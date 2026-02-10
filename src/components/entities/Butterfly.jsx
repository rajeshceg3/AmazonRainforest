import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

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

      // We want pivot at (0, 0) in local space (after we shift vertices)
      // Actually let's assume the mesh is positioned such that x=0 is the body.
      // So we want the wing to start at x=0 and go to x=1 (or similar).

      // Normalize X to 0..1 (assuming width 1)
      let nx = v.x + 0.5
      let ny = v.y + 0.5

      // Shape Logic (Teardrop / Butterfly Wing)
      // Top curve
      const topCurve = Math.sin(nx * Math.PI) * 0.5 + 0.5
      // Bottom curve (scalloped)
      const bottomCurve = -Math.sin(nx * Math.PI) * 0.4 - 0.2 * Math.sin(nx * Math.PI * 3.0)

      // Apply shaping to Y based on X
      const h = topCurve - bottomCurve
      const newY = bottomCurve + ny * h

      // Scale X to be wing length (e.g. 0.6)
      v.x = nx * 0.6
      v.y = newY * 0.8 // Aspect ratio

      // Center Y slightly so it attaches well
      v.y -= 0.1

      pos.setXYZ(i, v.x, v.y, v.z)
    }

    geo.computeVertexNormals()
    return geo
  }, [])
}

// Custom Shader Material for Iridescence
const ButterflyMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#0077ff') }, // Morpho Blue
    uColor2: { value: new THREE.Color('#8800ff') }, // Iridescent Purple
    uFlapSpeed: { value: 15.0 }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uFlapSpeed;
    varying vec2 vUv;
    varying float vFresnel;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Flapping Animation
      // Wing in XZ plane (after rotation).
      // Local Space: X is width, Y is length (along body), Z is thickness/up-down displacement.
      // We displace Z to flap.

      float flap = sin(uTime * uFlapSpeed);
      flap = sign(flap) * pow(abs(flap), 0.8); // Snap
      float angle = flap * 1.0;

      // Rigid rotation + Bending
      // Rotate around Y axis (Length axis)?
      // If plane is X(width) Y(length). Z is up/down.
      // We want to rotate around Y axis.
      // z' = x * sin(angle)

      pos.z += pos.x * sin(angle);

      // Secondary flutter
      pos.z += sin(pos.x * 15.0 + uTime * 20.0) * 0.05 * pos.x;

      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vec4 viewPosition = viewMatrix * worldPosition;

      // Fresnel
      vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
      vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
      vFresnel = dot(viewDir, worldNormal);

      gl_Position = projectionMatrix * viewPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying vec2 vUv;
    varying float vFresnel;

    void main() {
      // Iridescence
      float f = abs(vFresnel);
      vec3 col = mix(uColor2, uColor1, smoothstep(0.1, 0.6, f));

      // Veins / Pattern
      // Simple organic noise
      float n = sin(vUv.x * 40.0 + sin(vUv.y * 20.0) * 5.0);
      col *= (0.95 + 0.05 * n);

      // Dark edge
      // Distance from center? Hard with distorted UVs.
      // Just dark rim based on Fresnel?
      if (f < 0.2) col *= 0.5;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  side: THREE.DoubleSide,
  transparent: true,
})

const Butterfly = ({ position = [0, 0, 0] }) => {
  const group = useRef()
  const wingGeo = useButterflyWingGeometry()

  // Clone material for independent time/speed
  const material = useMemo(() => {
    const m = ButterflyMaterial.clone()
    m.uniforms.uFlapSpeed.value = 12.0 + Math.random() * 8.0
    m.uniforms.uColor1.value = new THREE.Color().setHSL(0.6, 1.0, 0.5 + Math.random() * 0.2) // Blue var
    return m
  }, [])

  const [offset] = useState(() => Math.random() * 100)

  useFrame((state) => {
    const t = state.clock.elapsedTime + offset

    if (material) {
      material.uniforms.uTime.value = t
    }

    if (group.current) {
        // Organic Path
        const radius = 3.0
        const speed = 0.5

        // Complex Lissajous
        const x = position[0] + Math.sin(t * speed) * radius + Math.sin(t * speed * 2.1) * 1.5
        const y = position[1] + Math.cos(t * speed * 0.7) * 1.5 + Math.sin(t * speed * 1.3) * 0.8
        const z = position[2] + Math.cos(t * speed * 1.1) * radius * 0.8

        const targetPos = new THREE.Vector3(x, y, z)

        // LookAt Logic
        const currentPos = group.current.position
        const velocity = targetPos.clone().sub(currentPos)

        group.current.position.copy(targetPos)

        if (velocity.lengthSq() > 0.0001) {
            // Face forward
            // Body is Z aligned (Capsule rotated X 90)
            // Head is -Z.
            // LookAt makes +Z point to target.
            // We want -Z to point to velocity.
            // So +Z points to -velocity.
            const lookTarget = currentPos.clone().sub(velocity)
            group.current.lookAt(lookTarget)
        }
    }
  })

  return (
    <group ref={group} scale={0.5}>
      {/* Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.4, 4, 8]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>

      {/* Left Wing - Rotated to be horizontal initially (XZ plane) */}
      <mesh
        geometry={wingGeo}
        material={material}
        position={[0.04, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* Right Wing (Mirrored) */}
      <mesh
        geometry={wingGeo}
        material={material}
        position={[-0.04, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[-1, 1, 1]}
      />
    </group>
  )
}

export default Butterfly
