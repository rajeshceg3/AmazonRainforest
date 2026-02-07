import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const PinkDolphin = ({ position = [0, -2, 0] }) => {
  const group = useRef()
  const bodyRef = useRef()
  const tailRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Swimming motion
    // Move forward in a circle or just idle swim
    if (group.current) {
      // Circle swimming
      const radius = 15
      const speed = 0.2
      group.current.position.x = Math.sin(time * speed) * radius
      group.current.position.z = Math.cos(time * speed) * radius
      group.current.rotation.y = -time * speed // Face direction of movement

      // Bobbing
      group.current.position.y = -1.5 + Math.sin(time * 1.5) * 0.2
    }

    // Body undulation
    if (bodyRef.current) {
      bodyRef.current.rotation.x = Math.sin(time * 3) * 0.1
    }

    // Tail flapping
    if (tailRef.current) {
      tailRef.current.rotation.x = Math.sin(time * 3 + 1) * 0.4
    }
  })

  const color = "#dba4a4"

  return (
    <group ref={group} position={position}>
      {/* Body */}
      <group ref={bodyRef}>
        <RoundedBox args={[0.8, 0.8, 2.5]} radius={0.3} smoothness={4} position={[0, 0, 0]}>
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
        </RoundedBox>

        {/* Dorsal Fin */}
        <mesh position={[0, 0.6, 0.2]} rotation={[0.5, 0, 0]}>
             <boxGeometry args={[0.1, 0.4, 0.6]} />
             <meshStandardMaterial color={color} />
        </mesh>

        {/* Snout */}
        <RoundedBox args={[0.3, 0.3, 0.8]} radius={0.1} position={[0, -0.1, 1.5]}>
          <meshStandardMaterial color="#eecbcb" />
        </RoundedBox>
      </group>

      {/* Tail */}
      <group position={[0, 0, -1.2]}>
        <group ref={tailRef}>
          <RoundedBox args={[0.6, 0.4, 1.0]} radius={0.2} position={[0, 0, -0.5]}>
             <meshStandardMaterial color={color} />
          </RoundedBox>
          {/* Flukes */}
          <mesh position={[0, 0, -1.0]} rotation={[-0.2, 0, 0]}>
             <boxGeometry args={[1.2, 0.1, 0.4]} />
             <meshStandardMaterial color={color} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export default PinkDolphin
