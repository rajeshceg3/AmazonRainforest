import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Butterfly = ({ position = [0, 0, 0] }) => {
  const group = useRef()
  const wingL = useRef()
  const wingR = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Fluttering wings
    if (wingL.current && wingR.current) {
      wingL.current.rotation.y = Math.sin(time * 15) * 0.8
      wingR.current.rotation.y = -Math.sin(time * 15) * 0.8
    }

    // Gentle movement
    if (group.current) {
      group.current.position.y += Math.sin(time * 0.5 + position[0]) * 0.01
      group.current.position.x += Math.cos(time * 0.3 + position[2]) * 0.01
    }
  })

  return (
    <group ref={group} position={position}>
      <mesh ref={wingL} position={[-0.1, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color="#3498db" side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wingR} position={[0.1, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color="#3498db" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default Butterfly
