/* eslint-disable react-hooks/immutability */
import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useWaterNormals } from '../../utils/WaterNormals'
import { useMemo } from 'react'
import * as THREE from 'three'

const River = () => {
  const baseNormalMap = useWaterNormals(512)
  const normalMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])
  const distortionMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])

  useFrame((state, delta) => {
    // Animate texture offset for flow
    normalMap.offset.x += delta * 0.05
    normalMap.offset.y += delta * 0.02

    // Animate distortion map in opposite direction for turbulence
    distortionMap.offset.x -= delta * 0.02
    distortionMap.offset.y -= delta * 0.01
  })

  return (
    <group position={[0, -0.5, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400, 64, 64]} />
        <MeshReflectorMaterial
          envMapIntensity={1.0} // Stronger env reflection for mood
          normalMap={normalMap}
          normalScale={[1.2, 1.2]} // Very rough surface for turbulence
          color="#0a1a0a" // Deep dark river water (blackwater)
          roughness={0.6} // More organic scattering, less plastic
          metalness={0.1}
          blur={[400, 100]} // Blur ground reflections heavily
          mixBlur={5.0} // Very soft reflections
          mixStrength={2.0} // Subtle reflection mix
          mixContrast={1.1} // Lower contrast
          resolution={1024}
          mirror={0.5} // Less mirror-like
          depthScale={2.0} // More depth perception in reflection
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          depthToBlurRatioBias={0.25}
          distortion={3.0} // High distortion for organic flow
          distortionMap={distortionMap}
          debug={0}
        />
      </mesh>
    </group>
  )
}

export default River
