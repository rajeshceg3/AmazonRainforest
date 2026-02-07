import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Jaguar = ({ position = [0, 0, 0] }) => {
  const group = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (group.current) {
      // Very slow breathing/sway
      group.current.scale.y = 1 + Math.sin(time * 0.5) * 0.02
    }
  })

  return (
    <group ref={group} position={position}>
      {/* Body */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 0.6, 2]} />
        <meshStandardMaterial color="#c68642" />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.8, 1.2]}>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color="#c68642" />
      </mesh>
      {/* Legs */}
      <mesh castShadow position={[-0.4, 0.2, 0.8]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#c68642" />
      </mesh>
      <mesh castShadow position={[0.4, 0.2, 0.8]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#c68642" />
      </mesh>
      <mesh castShadow position={[-0.4, 0.2, -0.8]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#c68642" />
      </mesh>
      <mesh castShadow position={[0.4, 0.2, -0.8]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#c68642" />
      </mesh>
    </group>
  )
}

export default Jaguar
