import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const River = () => {
  const meshRef = useRef()

  // Create geometry with enough segments for displacement
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(100, 100, 64, 64)
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i) // In PlaneGeometry, Y is the second coordinate (which maps to Z in world space if rotated)

        // Simple wave function
        // Combine low frequency swells and high frequency ripples
        const z = Math.sin(x * 0.2 + time * 0.5) * 0.2 +
                  Math.sin(y * 0.3 + time * 0.4) * 0.2 +
                  Math.sin(x * 1.0 + y * 0.8 + time * 1.5) * 0.05

        positions.setZ(i, z)
      }
      positions.needsUpdate = true
      meshRef.current.geometry.computeVertexNormals()
    }
  })

  return (
    <group position={[0, -0.5, 0]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#3b5e68"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

export default River
