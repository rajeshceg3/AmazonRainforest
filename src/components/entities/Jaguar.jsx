import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const Jaguar = ({ position = [0, 0, 0] }) => {
  const group = useRef()
  const headRef = useRef()
  const tailRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Breathing / Idle sway
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(time * 1.5) * 0.02
      group.current.rotation.z = Math.sin(time * 0.5) * 0.01 // slight body roll
    }

    // Head movement
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.7) * 0.1 // look around slowly
      headRef.current.rotation.x = Math.sin(time * 1.1) * 0.05 // nod
    }

    // Tail sway
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(time * 2.0) * 0.1
    }
  })

  const color = "#c68642"
  const materialProps = { color: color, roughness: 0.8, metalness: 0.1 }

  return (
    <group ref={group} position={position}>
      {/* Main Body */}
      <RoundedBox args={[1.0, 0.7, 1.8]} radius={0.15} smoothness={4} position={[0, 0.8, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...materialProps} />
      </RoundedBox>

      {/* Head Group */}
      <group ref={headRef} position={[0, 1.1, 1.0]}>
        {/* Head Shape */}
        <RoundedBox args={[0.6, 0.5, 0.6]} radius={0.1} smoothness={4} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
        {/* Snout */}
        <RoundedBox args={[0.3, 0.25, 0.3]} radius={0.05} smoothness={4} position={[0, -0.1, 0.4]} castShadow>
           <meshStandardMaterial color="#d9a066" roughness={0.9} />
        </RoundedBox>
        {/* Ears */}
        <RoundedBox args={[0.15, 0.15, 0.05]} radius={0.02} smoothness={4} position={[0.2, 0.3, -0.1]} castShadow>
           <meshStandardMaterial {...materialProps} />
        </RoundedBox>
        <RoundedBox args={[0.15, 0.15, 0.05]} radius={0.02} smoothness={4} position={[-0.2, 0.3, -0.1]} castShadow>
           <meshStandardMaterial {...materialProps} />
        </RoundedBox>
      </group>

      {/* Tail Group */}
      <group position={[0, 0.9, -0.9]}>
        <group ref={tailRef} rotation={[-0.5, 0, 0]}>
           <RoundedBox args={[0.15, 0.15, 1.2]} radius={0.07} smoothness={4} position={[0, 0, -0.5]} castShadow>
              <meshStandardMaterial {...materialProps} />
           </RoundedBox>
        </group>
      </group>

      {/* Legs - Static for now but rounded */}
      {/* Front Left */}
      <RoundedBox args={[0.25, 0.8, 0.25]} radius={0.05} smoothness={4} position={[-0.35, 0.4, 0.7]} castShadow>
         <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      {/* Front Right */}
      <RoundedBox args={[0.25, 0.8, 0.25]} radius={0.05} smoothness={4} position={[0.35, 0.4, 0.7]} castShadow>
         <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      {/* Back Left */}
      <RoundedBox args={[0.25, 0.8, 0.25]} radius={0.05} smoothness={4} position={[-0.35, 0.4, -0.7]} castShadow>
         <meshStandardMaterial {...materialProps} />
      </RoundedBox>
      {/* Back Right */}
      <RoundedBox args={[0.25, 0.8, 0.25]} radius={0.05} smoothness={4} position={[0.35, 0.4, -0.7]} castShadow>
         <meshStandardMaterial {...materialProps} />
      </RoundedBox>
    </group>
  )
}

export default Jaguar
