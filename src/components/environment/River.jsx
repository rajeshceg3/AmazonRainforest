/* eslint-disable react-hooks/immutability */
import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useWaterNormals } from '../../utils/WaterNormals'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const River = () => {
  const meshRef = useRef()
  const materialRef = useRef()
  const baseNormalMap = useWaterNormals(1024)
  const normalMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])
  const distortionMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])

  // Uniforms for the shader
  const uniforms = useRef({
    uTime: { value: 0 }
  })

  useFrame((state, delta) => {
    // Update time uniform
    if (uniforms.current) {
        uniforms.current.uTime.value = state.clock.elapsedTime
    }

    // Animate texture offset for flow (Visual detail)
    normalMap.offset.x += delta * 0.05
    normalMap.offset.y += delta * 0.02
    distortionMap.offset.x -= delta * 0.02
    distortionMap.offset.y -= delta * 0.01
  })

  const onBeforeCompile = useMemo(() => (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime

      shader.vertexShader = `
        uniform float uTime;

        // Analytical Wave Function
        float getWaveHeight(vec2 pos) {
            float wave1 = sin(pos.x * 0.05 + uTime * 0.5) * 0.5;
            float wave2 = cos(pos.y * 0.1 + uTime * 0.8) * 0.2;
            float wave3 = sin((pos.x + pos.y) * 0.05 + uTime * 0.3) * 0.3;
            return wave1 + wave2 + wave3;
        }

        // Analytical Derivatives for Normal Recalculation
        vec3 getWaveNormal(vec2 pos) {
            float dx = 0.05 * cos(pos.x * 0.05 + uTime * 0.5) * 0.5
                     + 0.05 * cos((pos.x + pos.y) * 0.05 + uTime * 0.3) * 0.3;

            float dy = -0.1 * sin(pos.y * 0.1 + uTime * 0.8) * 0.2
                     + 0.05 * cos((pos.x + pos.y) * 0.05 + uTime * 0.3) * 0.3;

            return normalize(vec3(-dx, -dy, 1.0));
        }
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Apply wave displacement
        float h = getWaveHeight(position.xy);
        transformed.z += h;

        // Recalculate Normal
        vec3 newNormal = getWaveNormal(position.xy);
        vNormal = normalMatrix * newNormal; // Transform to view space
        `
      )
  }, [])

  return (
    <group position={[0, -0.5, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* Reduced segments slightly as shader handles smooth interpolation well */}
        <planeGeometry args={[400, 400, 128, 128]} />
        <MeshReflectorMaterial
          ref={materialRef}
          onBeforeCompile={onBeforeCompile}
          envMapIntensity={0.8}
          normalMap={normalMap}
          normalScale={[1.0, 1.0]}
          color="#031203"
          roughness={0.45}
          metalness={0.1}
          blur={[300, 100]}
          mixBlur={6.0}
          mixStrength={1.2}
          mixContrast={1.0}
          resolution={1024}
          mirror={0.5}
          depthScale={3.0}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          depthToBlurRatioBias={0.25}
          distortion={3.5}
          distortionMap={distortionMap}
          debug={0}
        />
      </mesh>
    </group>
  )
}

export default River
