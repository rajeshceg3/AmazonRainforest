import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Macaw = ({ position = [0, 15, 0] }) => {
  const group = useRef()
  const wingL = useRef()
  const wingR = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Flight path: Figure 8
    if (group.current) {
      const t = time * 0.5
      group.current.position.x = position[0] + Math.sin(t) * 10
      group.current.position.z = position[2] + Math.sin(t * 2) * 5
      group.current.position.y = position[1] + Math.cos(t * 1.5) * 2

      // Face forward (simple approximation)
      const dx = Math.cos(t) * 10
      const dz = Math.cos(t * 2) * 10
      group.current.rotation.y = Math.atan2(dx, dz) + Math.PI / 2
    }

    // Wing flapping
    if (wingL.current && wingR.current) {
      const flap = Math.sin(time * 10) * 0.5
      wingL.current.rotation.z = flap
      wingR.current.rotation.z = -flap
    }
  })

  return (
    <group ref={group} position={position}>
      {/* Body */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
         <coneGeometry args={[0.3, 1.0, 8]} />
         <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Head */}
      <mesh position={[0.5, 0.2, 0]}>
         <sphereGeometry args={[0.25, 16, 16]} />
         <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Wings */}
      <group position={[0, 0.2, 0.2]}>
        <mesh ref={wingL} position={[0, 0, 0.5]} rotation={[0.2, 0, 0]}>
           <boxGeometry args={[0.4, 0.05, 1.5]} />
           <meshStandardMaterial color="#0000ff" />
        </mesh>
      </group>

      <group position={[0, 0.2, -0.2]}>
        <mesh ref={wingR} position={[0, 0, -0.5]} rotation={[-0.2, 0, 0]}>
           <boxGeometry args={[0.4, 0.05, 1.5]} />
           <meshStandardMaterial color="#0000ff" />
        </mesh>
      </group>

      {/* Tail */}
      <mesh position={[-0.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
         <boxGeometry args={[0.2, 0.8, 0.4]} />
         <meshStandardMaterial color="#ffff00" />
      </mesh>
    </group>
  )
}

export default Macaw
