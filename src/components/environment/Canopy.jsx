import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Canopy = () => {
  const lightRef = useRef()

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })

  return (
    <group position={[0, 15, 0]}>
      {/* Canopy "Leaves" */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 30
          ]}
        >
          <sphereGeometry args={[2 + Math.random() * 3, 16, 16]} />
          <meshStandardMaterial color="#0a3d0a" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Sun Shafts Placeholder */}
      <spotLight
        ref={lightRef}
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#fffceb"
        castShadow
      />
    </group>
  )
}

export default Canopy
