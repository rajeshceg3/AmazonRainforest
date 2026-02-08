/* eslint-disable react-hooks/immutability */
import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useWaterNormals } from '../../utils/WaterNormals'
import { useMemo } from 'react'
import * as THREE from 'three'

const River = () => {
  const baseNormalMap = useWaterNormals(512)
  const normalMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])

  useFrame((state, delta) => {
    // Animate texture offset for flow
    normalMap.offset.x += delta * 0.05
    normalMap.offset.y += delta * 0.02
  })

  return (
    <group position={[0, -0.5, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400, 64, 64]} />
        <MeshReflectorMaterial
          envMapIntensity={0}
          normalMap={normalMap}
          normalScale={[0.5, 0.5]}
          color="#0a2a1a" // Rich teal/green
          roughness={0.6}
          blur={[400, 200]} // Blur ground reflections (width, height), 0 skips blur
          mixBlur={2.0} // How much blur mixes with surface roughness (default = 1)
          mixStrength={1.5} // Strength of the reflection
          mixContrast={1} // Contrast of the reflection
          resolution={1024} // Off-buffer resolution, lower=faster, higher=better quality, slower
          mirror={0.5} // Mirror intensity, 0 - 1
          depthScale={1.2} // Scale the depth factor (0 = no depth, default = 0)
          minDepthThreshold={0.4} // Lower edge for the depthTexture interpolation (default = 0)
          maxDepthThreshold={1.4} // Upper edge for the depthTexture interpolation (default = 0)
          depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp at the edges of the screen reflection
          distortion={1.0} // Amount of distortion based on the distortionMap texture
          distortionMap={normalMap} // Use the same noise texture for distortion
          debug={0} /* Depending on the assigned value, one of the following channels is shown:
            0 = no debug
            1 = depth channel
            2 = base channel
            3 = distortion channel
            4 = lod channel (based on the roughness)
          */
        />
      </mesh>
    </group>
  )
}

export default River
