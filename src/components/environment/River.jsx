/* eslint-disable react-hooks/immutability */
import React, { useRef, useMemo, useLayoutEffect } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useWaterNormals } from '../../utils/WaterNormals'
import * as THREE from 'three'

const River = () => {
  const meshRef = useRef()
  const materialRef = useRef()
  const baseNormalMap = useWaterNormals(1024)
  const normalMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])
  const distortionMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])

  // Uniforms for shader animation
  const uniforms = useRef({
    uTime: { value: 0 },
  })

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()

    // Update uniform time
    if (uniforms.current) {
        uniforms.current.uTime.value = t
    }

    // Animate texture offset for flow
    normalMap.offset.x += delta * 0.05
    normalMap.offset.y += delta * 0.02

    // Animate distortion map in opposite direction for turbulence
    distortionMap.offset.x -= delta * 0.02
    distortionMap.offset.y -= delta * 0.01
  })

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime

      // Helper functions: Gerstner Wave
      const waveFuncs = `
        uniform float uTime;
        varying float vWaveHeight;

        // Calculate Gerstner Wave
        // Returns displacement in .xyz
        // Updates Normal in .w (not implemented here, we use analytic derivatives)

        vec3 gerstner_wave(vec2 uv, float steepness, float wavelength, float speed, vec2 direction, inout vec3 tangent, inout vec3 binormal) {
            float k = 2.0 * 3.14159 / wavelength;
            float c = sqrt(9.8 / k) * speed;
            vec2 d = normalize(direction);

            float f = k * (dot(d, uv) - c * uTime);
            float a = steepness / k; // Amplitude

            // Derivatives
            float wa = k * a; // steepness
            float s = sin(f);
            float c_w = cos(f);

            // Tangent (partial derivative wrt x)
            // P = [x + D.x*cos, y + D.y*cos, sin]
            // dP/dx = [1 - D.x*D.x*S*sin, -D.x*D.y*S*sin, D.x*k*A*cos]

            float rw = steepness * s; // rolling weight

            tangent.x -= d.x * d.x * rw;
            tangent.y -= d.x * d.y * rw;
            tangent.z += d.x * wa * c_w;

            // Binormal (partial derivative wrt y)
            binormal.x -= d.x * d.y * rw;
            binormal.y -= d.y * d.y * rw;
            binormal.z += d.y * wa * c_w;

            return vec3(
                d.x * (a * c_w),
                d.y * (a * c_w),
                a * s
            );
        }
      `

      // Inject Helper Functions & Varying Declaration
      shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          `#include <common>
           ${waveFuncs}
          `
      )

      // Inject Vertex Displacement & Normal Calculation
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        vec3 tangent = vec3(1.0, 0.0, 0.0);
        vec3 binormal = vec3(0.0, 1.0, 0.0);
        vec3 p = position;
        vec3 displacement = vec3(0.0);

        // Sum of waves for complexity
        displacement += gerstner_wave(p.xy, 0.15, 8.0, 1.0, vec2(1.0, 0.2), tangent, binormal);
        displacement += gerstner_wave(p.xy, 0.1, 4.5, 1.2, vec2(0.7, 0.7), tangent, binormal);
        displacement += gerstner_wave(p.xy, 0.08, 2.0, 1.5, vec2(-0.2, 1.0), tangent, binormal);

        // Normal is Cross(Tangent, Binormal)
        vec3 newNormal = normalize(cross(binormal, tangent)); // Check winding order
        // Usually Cross(T, B) is Normal.
        // T = dP/dx, B = dP/dy.
        // Z is Up. X is Right. Y is Forward.
        // Plane is XY.
        // Cross(X, Y) = Z.
        // So Cross(tangent, binormal).

        objectNormal = normalize(cross(tangent, binormal));

        // Pass height to fragment
        vWaveHeight = displacement.z;
        `
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        transformed.xyz += displacement;
        `
      )

      // Inject Varying in Fragment
      shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
           varying float vWaveHeight;
          `
      )

      // Inject Foam in Fragment
      // We inject after map_fragment to modify diffuseColor
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        // Simple Foam based on height tips
        // vWaveHeight range approx -0.3 to 0.3
        float foam = smoothstep(0.15, 0.35, vWaveHeight);

        vec3 foamColor = vec3(0.9, 0.95, 1.0);

        // Mix
        diffuseColor.rgb = mix(diffuseColor.rgb, foamColor, foam * 0.8);

        // Increase roughness for foam
        // roughnessFactor = mix(roughnessFactor, 1.0, foam);
        // We can't access roughnessFactor here easily if we are in map_fragment replacement
        // AND roughnessmap_fragment is included AFTER map_fragment (which is standard).
        // Standard:
        // map_fragment -> roughnessmap_fragment -> ...
        // So modifying roughnessFactor here is useless if it's overwritten later.
        // But roughnessFactor is initialized to uniform 'roughness' before loop.
        // Then roughnessmap_fragment multiplies it.
        // So we can modify it here? No, roughnessmap_fragment defines 'float roughnessFactor = roughness;'?
        // Let's check meshphysical_frag.glsl.
        // It defines 'float roughnessFactor = roughness;' BEFORE include <roughnessmap_fragment>.
        // So if we are in <map_fragment>, we are BEFORE <roughnessmap_fragment>.
        // BUT <roughnessmap_fragment> typically does 'roughnessFactor *= ...'.
        // So if we set 'roughnessFactor' here, we need to know if it's defined.
        // Standard shader defines roughnessFactor AFTER map_fragment?
        // Actually:
        // #include <uv_pars_fragment>
        // ...
        // void main() {
        //   ...
        //   vec4 diffuseColor = opacity * diffuse;
        //   #include <map_fragment>
        //   #include <color_fragment>
        //   ...
        //   #include <roughnessmap_fragment>
        //   ...
        // }
        // Wait, roughnessFactor is usually local to roughnessmap_fragment block or main.
        // In Three.js:
        // float roughnessFactor = roughness;
        // #include <roughnessmap_fragment>
        //
        // This usually happens AFTER map_fragment.
        // So at map_fragment, roughnessFactor is NOT defined.
        // So we can't modify it here.
        // We can modify it by replacing roughnessmap_fragment.

        `
      )

      // roughnessFactor modification removed to avoid redefinition errors
    }
  }, [])

  return (
    <group position={[0, -0.5, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* High resolution plane for vertex displacement */}
        <planeGeometry args={[400, 400, 256, 256]} />
        <MeshReflectorMaterial
          ref={materialRef}
          envMapIntensity={1.0}
          normalMap={normalMap}
          normalScale={[0.5, 0.5]}
          color="#001111" // Deep jungle river color
          roughness={0.2}
          metalness={0.1}
          blur={[300, 100]}
          mixBlur={6.0}
          mixStrength={1.5}
          mixContrast={1.2}
          resolution={1024}
          mirror={0.7}
          depthScale={2.0}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          depthToBlurRatioBias={0.25}
          distortion={3.0}
          distortionMap={distortionMap}
          debug={0}
          defines={{ USE_UV: '' }}
        />
      </mesh>
    </group>
  )
}

export default River
