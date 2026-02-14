/* eslint-disable react-hooks/immutability */
import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useWaterNormals } from '../../utils/WaterNormals'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

const River = () => {
  const meshRef = useRef()
  const baseNormalMap = useWaterNormals(1024)
  const normalMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])
  const distortionMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])

  // Cache original positions for wave calculation
  const originalPositions = useRef(null)

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()

    // Animate texture offset for flow
    normalMap.offset.x += delta * 0.05
    normalMap.offset.y += delta * 0.02

    // Animate distortion map in opposite direction for turbulence
    distortionMap.offset.x -= delta * 0.02
    distortionMap.offset.y -= delta * 0.01

    // Vertex Displacement for Physical Waves
    if (meshRef.current && meshRef.current.geometry) {
      const geo = meshRef.current.geometry
      const posAttribute = geo.attributes.position

      // Initialize original positions if not set
      if (!originalPositions.current) {
        originalPositions.current = new Float32Array(posAttribute.array)
      }

      const originals = originalPositions.current
      const count = posAttribute.count

      for (let i = 0; i < count; i++) {
        // Plane is X-Y local. Z is up/down displacement.
        const x = originals[i * 3]
        const y = originals[i * 3 + 1]

        // Superposition of sine waves for rolling swells
        // Low frequency, large amplitude
        const wave1 = Math.sin(x * 0.05 + t * 0.5) * 0.5
        // Medium frequency, medium amplitude
        const wave2 = Math.cos(y * 0.1 + t * 0.8) * 0.2
        // Interference
        const wave3 = Math.sin((x + y) * 0.05 + t * 0.3) * 0.3

        // Total displacement (Z in local space)
        posAttribute.array[i * 3 + 2] = originals[i * 3 + 2] + wave1 + wave2 + wave3
      }

      posAttribute.needsUpdate = true

      // Computing normals is expensive.
      // For water, we rely heavily on the normal map for detail.
      // We can skip computeVertexNormals() if the waves are gentle enough
      // or recompute them every N frames if needed.
      // Given "UltraThink" and visual quality priority, let's try skipping first
      // as recomputing 16k normals every frame might kill FPS on lower end.
      // The Reflector material handles the main look.
    }
  })

  return (
    <group position={[0, -0.5, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* Increased segments to 128x128 for smoother waves */}
        <planeGeometry args={[400, 400, 128, 128]} />
        <MeshReflectorMaterial
          envMapIntensity={0.8}
          normalMap={normalMap}
          normalScale={[1.0, 1.0]} // Increased roughness
          color="#031203" // Slightly deeper green
          roughness={0.45} // More organic scattering
          metalness={0.1} // Less metallic
          blur={[300, 100]}
          mixBlur={6.0} // Softer reflections
          mixStrength={1.2}
          mixContrast={1.0}
          resolution={1024}
          mirror={0.5}
          depthScale={3.0} // Deeper perception
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          depthToBlurRatioBias={0.25}
          distortion={3.5} // High distortion
          distortionMap={distortionMap}
          debug={0}
        />
      </mesh>
    </group>
  )
}

export default River
