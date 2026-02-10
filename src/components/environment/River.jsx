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
          envMapIntensity={0.5} // Slight env reflection
          normalMap={normalMap}
          normalScale={[0.6, 0.6]} // Stronger waves
          color="#0d0805" // Very deep tannin black
          roughness={0.4} // Glassier surface
          metalness={0.1}
          blur={[400, 100]} // Blur ground reflections
          mixBlur={3.0} // Softer reflections
          mixStrength={2.0} // Stronger reflection
          mixContrast={1.2} // Higher contrast
          resolution={1024}
          mirror={0.7} // More reflective
          depthScale={2.0} // More depth perception in reflection
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          depthToBlurRatioBias={0.25}
          distortion={1.8} // High distortion for organic flow
          distortionMap={distortionMap}
          debug={0}
        />
      </mesh>
    </group>
  )
}

export default River
