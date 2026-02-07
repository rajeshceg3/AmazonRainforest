import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Jaguar = ({ position = [0, 0, 0] }) => {
  const group = useRef()
  const headRef = useRef()
  const tailRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Breathing / Idle sway
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(time * 1.5) * 0.01
      group.current.rotation.z = Math.sin(time * 0.5) * 0.01
    }

    // Head movement
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.7) * 0.1
      headRef.current.rotation.x = Math.sin(time * 1.1) * 0.05
    }

    // Tail sway
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(time * 2.0) * 0.15
      tailRef.current.rotation.z = Math.cos(time * 1.5) * 0.1
    }
  })

  const color = "#c68642"
  const materialProps = { color: color, roughness: 0.7, metalness: 0.1 }
  const snoutColor = "#e0ac69"

  return (
    <group ref={group} position={position}>
      {/* Main Body - Capsule */}
      {/* Rotated to be horizontal along Z axis. Length is Y axis in CapsuleGeometry */}
      <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 1.0, 4, 16]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0, 0.95, 0.75]}>
        {/* Head Sphere */}
        <mesh castShadow>
             <sphereGeometry args={[0.25, 16, 16]} />
             <meshStandardMaterial {...materialProps} />
        </mesh>

        {/* Snout */}
        <mesh position={[0, -0.05, 0.2]} castShadow>
             <sphereGeometry args={[0.13, 16, 16]} />
             <meshStandardMaterial color={snoutColor} roughness={0.8} />
        </mesh>

        {/* Ears - Cones */}
        <mesh position={[0.16, 0.2, 0.05]} rotation={[0, 0, -0.3]} castShadow>
             <coneGeometry args={[0.07, 0.15, 16]} />
             <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh position={[-0.16, 0.2, 0.05]} rotation={[0, 0, 0.3]} castShadow>
             <coneGeometry args={[0.07, 0.15, 16]} />
             <meshStandardMaterial {...materialProps} />
        </mesh>
      </group>

      {/* Tail Group */}
      <group position={[0, 0.7, -0.55]}>
        <group ref={tailRef} rotation={[-0.5, 0, 0]}>
           {/* Tail - Capsule */}
           <mesh position={[0, 0, -0.4]} rotation={[Math.PI/2, 0, 0]} castShadow>
                <capsuleGeometry args={[0.05, 0.8, 4, 8]} />
                <meshStandardMaterial {...materialProps} />
           </mesh>
        </group>
      </group>

      {/* Legs - Capsules */}
      {/* Front Left */}
      <mesh position={[-0.2, 0.35, 0.5]} castShadow>
         <capsuleGeometry args={[0.09, 0.6, 4, 8]} />
         <meshStandardMaterial {...materialProps} />
      </mesh>
      {/* Front Right */}
      <mesh position={[0.2, 0.35, 0.5]} castShadow>
         <capsuleGeometry args={[0.09, 0.6, 4, 8]} />
         <meshStandardMaterial {...materialProps} />
      </mesh>
      {/* Back Left */}
      <mesh position={[-0.22, 0.35, -0.5]} castShadow>
         <capsuleGeometry args={[0.11, 0.6, 4, 8]} />
         <meshStandardMaterial {...materialProps} />
      </mesh>
      {/* Back Right */}
      <mesh position={[0.22, 0.35, -0.5]} castShadow>
         <capsuleGeometry args={[0.11, 0.6, 4, 8]} />
         <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  )
}

export default Jaguar
