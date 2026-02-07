import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'

const Vine = ({ position, length, delay }) => {
  const ref = useRef()

  // Generate leaves data once to avoid jitter on re-renders
  const leaves = useMemo(() => {
    return Array.from({ length: Math.floor(length / 2) }).map(() => ({
      position: [
        (Math.random() - 0.5) * 0.2,
        -Math.random() * length,
        (Math.random() - 0.5) * 0.2
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: 0.15 + Math.random() * 0.1
    }))
  }, [length])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (ref.current) {
      // Swing gently
      ref.current.rotation.z = Math.sin(time * 0.5 + delay) * 0.05
      ref.current.rotation.x = Math.cos(time * 0.3 + delay) * 0.05
    }
  })

  return (
    <group ref={ref} position={position}>
      {/* The vine geometry itself, pivoted at top (0,0,0) so we move geometry down */}
      <mesh position={[0, -length / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.02, 0.03, length, 6]} />
        <meshStandardMaterial color="#4a3c31" roughness={0.9} />
      </mesh>

      {/* Add some leaves/epiphytes along the vine */}
      {leaves.map((leaf, i) => (
        <mesh
          key={i}
          position={leaf.position}
          rotation={leaf.rotation}
        >
          <sphereGeometry args={[leaf.scale, 4, 4]} />
          <meshStandardMaterial color="#5e8c31" />
        </mesh>
      ))}
    </group>
  )
}

const Understory = () => {
  const vineCount = 30

  const vines = useMemo(() => {
    return Array.from({ length: vineCount }).map(() => ({
      position: [
        (Math.random() - 0.5) * 60,
        15 + Math.random() * 5, // Hanging from canopy height
        (Math.random() - 0.5) * 60
      ],
      length: 5 + Math.random() * 10,
      delay: Math.random() * Math.PI * 2
    }))
  }, [])

  return (
    <group>
      {vines.map((props, i) => (
        <Vine key={i} {...props} />
      ))}

      {/* Add some floating particles or mid-air debris for atmosphere */}
      <mesh position={[0, 8, 0]}>
         {/* Placeholder for future detailed understory elements */}
      </mesh>
    </group>
  )
}

export default Understory
