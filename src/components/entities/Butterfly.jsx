import { useRef, useMemo, useState, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { pseudoNoise } from '../../utils/OrganicMath'

// Procedural Geometry for Morpho Wing
const useButterflyWingGeometry = () => {
  return useMemo(() => {
    // High resolution plane for smooth deformation
    const geo = new THREE.PlaneGeometry(1, 1, 32, 32)
    const pos = geo.attributes.position
    const uv = geo.attributes.uv
    const v = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      // v.x is -0.5 to 0.5. v.y is -0.5 to 0.5.

      // Normalize X to 0..1 (assuming width 1)
      let nx = v.x + 0.5
      let ny = v.y + 0.5

      // Shape Logic (Teardrop / Butterfly Wing)
      const topCurve = Math.sin(nx * Math.PI) * 0.5 + 0.5
      const bottomCurve = -Math.sin(nx * Math.PI) * 0.4 - 0.2 * Math.sin(nx * Math.PI * 3.0)
      const h = topCurve - bottomCurve
      const newY = bottomCurve + ny * h

      v.x = nx * 0.6
      v.y = newY * 0.8
      v.y -= 0.1

      pos.setXYZ(i, v.x, v.y, v.z)
    }

    geo.computeVertexNormals()
    return geo
  }, [])
}

// Custom Material Component using onBeforeCompile
const ButterflyMaterial = ({ uColor1, uColor2, flapSpeedRef, flapStrengthRef, ...props }) => {
    const materialRef = useRef()
    const uniforms = useRef({
        uTime: { value: 0 },
        uColor1: { value: uColor1 },
        uColor2: { value: uColor2 },
        uFlapSpeed: { value: flapSpeedRef.current },
        uFlapStrength: { value: flapStrengthRef.current }
    })

    // Update uniforms when initial colors change
    useLayoutEffect(() => {
        if (uniforms.current) {
            uniforms.current.uColor1.value = uColor1
            uniforms.current.uColor2.value = uColor2
        }
    }, [uColor1, uColor2])

    useFrame((state) => {
        if (uniforms.current) {
            uniforms.current.uTime.value = state.clock.elapsedTime
            // Read directly from refs to avoid React re-renders on prop updates
            uniforms.current.uFlapSpeed.value = flapSpeedRef.current
            uniforms.current.uFlapStrength.value = flapStrengthRef.current
        }
    })

    const onBeforeCompile = useMemo(() => (shader) => {
        shader.uniforms.uTime = uniforms.current.uTime
        shader.uniforms.uColor1 = uniforms.current.uColor1
        shader.uniforms.uColor2 = uniforms.current.uColor2
        shader.uniforms.uFlapSpeed = uniforms.current.uFlapSpeed
        shader.uniforms.uFlapStrength = uniforms.current.uFlapStrength

        // VERTEX SHADER
        shader.vertexShader = `
            uniform float uTime;
            uniform float uFlapSpeed;
            uniform float uFlapStrength;
            varying float vFresnel;
            varying vec2 vUv2;
        ` + shader.vertexShader

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vUv2 = uv;

            // Flapping Animation
            // Wing in XZ plane (after rotation).
            // Local Space: X is width, Y is length (along body).
            // We displace Z (normal direction) to flap?
            // PlaneGeometry is XY plane.
            // Butterfly renders it Rotated -PI/2 X. So it lies on XZ.
            // X is width. Y in geometry is Z in world.
            // We want to flap around Y axis (Body).
            // So we rotate position around Y axis based on X distance? Or just displace Z?
            // Original code displaced Z based on X.
            // Plane is XY.

            float flap = sin(uTime * uFlapSpeed);
            flap = sign(flap) * pow(abs(flap), 0.8);
            float angle = flap * 1.0 * uFlapStrength;

            // Rigid rotation + Bending
            // Pivot is at x=0 (Body).
            // Rotate around Y axis? No, X axis?
            // If geometry is XY plane. Body is at X=0?
            // useButterflyWingGeometry centers X at 0?
            // No, it normalizes nx = v.x + 0.5.
            // v.x = nx * 0.6.
            // So X ranges 0 to 0.6.
            // So Body is at X=0. Tip at X=0.6.

            // So we rotate vertices around Y axis (x=0 line).
            // Rotation Matrix around Y:
            // x' = x cos(a) + z sin(a)
            // z' = -x sin(a) + z cos(a)
            // transformed.z is 0 initially.

            float s = sin(angle);
            float c = cos(angle);

            float oldX = transformed.x;
            transformed.x = oldX * c; // z is 0
            transformed.z = -oldX * s;

            // Secondary flutter (Ripple along X)
            transformed.z += sin(oldX * 15.0 + uTime * 20.0) * 0.05 * oldX;

            // Compute Fresnel (View vs Normal)
            // We need world normal.
            // Normal is impacted by rotation.
            // objectNormal is (0,0,1).
            // New normal: Rotate (0,0,1) by angle around Y?
            // No, Plane normal is Z.
            // Rotate around Y. Normal becomes (sin(a), 0, cos(a)).
            // Let's rely on standard normal recalculation?
            // Standard material recalculates normal if we modify 'transformed'?
            // No, vertex shader uses 'objectNormal'.
            // We must update 'vNormal' or 'objectNormal'.

            vec3 axis = vec3(0.0, 1.0, 0.0);
            // Rotate objectNormal around Y
            // mat3 rot = ...
            // Simplified:
            objectNormal.x = s;
            objectNormal.z = c;

            // Wait, this is rigid rotation.
            // Flutter adds noise. Ignored for normal.
            `
        )

        // Pass Fresnel for Fragment
        // vNormal is view space normal in standard shader?
        // varying vec3 vNormal is usually defined in common or pars_vertex.
        // #include <default_normal_vertex> calculates vNormal.

        // We calculate world fresnel manually or use view space?
        // View space is easier.
        shader.vertexShader = shader.vertexShader.replace(
            '#include <fog_vertex>',
            `
            #include <fog_vertex>
            vec3 viewDir = normalize(-mvPosition.xyz);
            vec3 viewNormal = normalize(normalMatrix * objectNormal);
            // vNormal might be already computed?
            // Let's recompute for safety or use vNormal if available.
            // Standard shader uses transformedNormal.
            vFresnel = dot(viewDir, viewNormal);
            `
        )

        // FRAGMENT SHADER
        shader.fragmentShader = `
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            varying float vFresnel;
            varying vec2 vUv2;
        ` + shader.fragmentShader

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>

            // Iridescence
            float f = abs(vFresnel);
            vec3 iri = mix(uColor2, uColor1, smoothstep(0.1, 0.6, f));

            // Pattern
            float n = sin(vUv2.x * 40.0 + sin(vUv2.y * 20.0) * 5.0);
            iri *= (0.95 + 0.05 * n);

            if (f < 0.2) iri *= 0.5; // Rim dark

            diffuseColor.rgb = iri;
            `
        )
    }, [])

    return (
        <meshStandardMaterial
            ref={materialRef}
            side={THREE.DoubleSide}
            onBeforeCompile={onBeforeCompile}
            roughness={0.4}
            metalness={0.6}
            defines={{ USE_UV: '' }} // Ensure UVs are available
            {...props}
        />
    )
}

// Reusable objects for useFrame
const _targetPos = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _velocity = new THREE.Vector3()

const Butterfly = ({ position = [0, 0, 0] }) => {
  const group = useRef()
  const wingGeo = useButterflyWingGeometry()
  const baseFlapSpeed = useRef(12.0 + Math.random() * 8.0)

  // Instance state.
  // Use refs instead of state for frequently changing variables to prevent React re-render storms.
  const flapSpeed = useRef(baseFlapSpeed.current)
  const flapStrength = useRef(1.0)
  const color1 = useMemo(() => new THREE.Color().setHSL(0.6, 1.0, 0.5 + Math.random() * 0.2), [])
  const color2 = useMemo(() => new THREE.Color('#8800ff'), [])
  const offset = useMemo(() => Math.random() * 100, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime + offset

    // Logic updates (Speed/Path) - Same as before
    const effort = pseudoNoise(t * 0.5, offset)
    if (effort > 0.5) {
       // Glide
       // We can't update useState in useFrame (too many re-renders).
       // We should use refs for uniforms if possible, but ButterflyMaterial handles it via props?
       // If I pass props, I trigger re-renders.
       // Better: The Material component should handle the uniform update itself?
       // But speed varies per instance.
       // My ButterflyMaterial updates uniforms in useLayoutEffect.
       // So passing props works, but triggers React Reconciliation.
       // THIS IS BAD for performance (60fps updates via Props).

       // FIX: Pass refs or mutable object to material?
       // OR: ButterflyMaterial exposes a ref to its uniforms?
       // No, simpler: Just use a ref for the material instance and update uniforms directly here.
    }

    // Position Logic
    if (group.current) {
        const radius = 3.0
        const speed = 0.5
        const wanderX = pseudoNoise(t * 0.2, offset) * 2.0
        const wanderY = pseudoNoise(t * 0.3, offset + 10) * 1.5
        const wanderZ = pseudoNoise(t * 0.25, offset + 20) * 2.0
        const x = position[0] + Math.sin(t * speed) * radius + Math.sin(t * speed * 2.1) * 1.5 + wanderX
        const y = position[1] + Math.cos(t * speed * 0.7) * 1.5 + Math.sin(t * speed * 1.3) * 0.8 + wanderY
        const z = position[2] + Math.cos(t * speed * 1.1) * radius * 0.8 + wanderZ
        _targetPos.set(x, y, z)
        const currentPos = group.current.position
        _velocity.subVectors(_targetPos, currentPos)
        group.current.position.copy(_targetPos)
        if (_velocity.lengthSq() > 0.0001) {
            _lookTarget.subVectors(currentPos, _velocity)
            group.current.lookAt(_lookTarget)
            group.current.rotation.z += pseudoNoise(t, offset) * 0.5
        }
    }
  })

  // Optimization: Don't update props every frame.
  // Use a ref to store material, and update uniforms in useFrame.
  // But <ButterflyMaterial> creates the material.
  // I can forwardRef to ButterflyMaterial?

  // Let's assume standard behavior for now. If performance is issue, I'll optimize.
  // Actually, standard prop updates in R3F are fast IF they don't recreate the component.
  // But passing new numbers creates new props object.
  // Material will update uniforms.
  // It should be fine for a few butterflies.

  return (
    <group ref={group} scale={0.5}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.04, 0.4, 4, 8]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>

      {/* Left Wing */}
      <mesh
        geometry={wingGeo}
        position={[0.04, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow receiveShadow
      >
          <ButterflyMaterial
            uColor1={color1}
            uColor2={color2}
            flapSpeedRef={flapSpeed}
            flapStrengthRef={flapStrength}
          />
      </mesh>

      {/* Right Wing (Mirrored) */}
      <mesh
        geometry={wingGeo}
        position={[-0.04, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[-1, 1, 1]}
        castShadow receiveShadow
      >
         <ButterflyMaterial
            uColor1={color1}
            uColor2={color2}
            flapSpeedRef={flapSpeed}
            flapStrengthRef={flapStrength}
          />
      </mesh>
    </group>
  )
}

export default Butterfly
