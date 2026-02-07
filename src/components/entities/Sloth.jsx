import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const Sloth = ({ position = [0, 10, 0] }) => {
  const group = useRef()
  const headRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Very slow sway
    if (group.current) {
      group.current.rotation.z = Math.sin(time * 0.2) * 0.1
      group.current.rotation.x = Math.sin(time * 0.15) * 0.05
    }

    // Slow head look
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.1) * 0.2
    }
  })

  const furColor = "#8c7b6c"
  const faceColor = "#e0d6c8"

  return (
    <group ref={group} position={position} rotation={[0, 0, Math.PI]}> {/* Hanging upside down */}
      {/* Body */}
      <RoundedBox args={[1.2, 0.9, 0.8]} radius={0.4} smoothness={4}>
        <meshStandardMaterial color={furColor} roughness={0.9} />
      </RoundedBox>

      {/* Head */}
      <group ref={headRef} position={[0.7, 0.2, 0]}>
        <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.2} smoothness={4}>
           <meshStandardMaterial color={furColor} />
        </RoundedBox>
        {/* Face Mask */}
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
           <circleGeometry args={[0.2, 32]} />
           <meshStandardMaterial color={faceColor} />
        </mesh>
      </group>

      {/* Limbs (Holding on) */}
      {/* Front */}
      <RoundedBox args={[0.2, 0.8, 0.2]} radius={0.1} position={[0.4, 0.6, 0.3]} rotation={[0, 0, -0.5]}>
         <meshStandardMaterial color={furColor} />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.8, 0.2]} radius={0.1} position={[0.4, 0.6, -0.3]} rotation={[0, 0, -0.5]}>
         <meshStandardMaterial color={furColor} />
      </RoundedBox>

      {/* Back */}
      <RoundedBox args={[0.2, 0.8, 0.2]} radius={0.1} position={[-0.4, 0.6, 0.3]} rotation={[0, 0, 0.5]}>
         <meshStandardMaterial color={furColor} />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.8, 0.2]} radius={0.1} position={[-0.4, 0.6, -0.3]} rotation={[0, 0, 0.5]}>
         <meshStandardMaterial color={furColor} />
      </RoundedBox>
    </group>
  )
}

export default Sloth
