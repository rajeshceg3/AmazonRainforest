import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const PinkDolphin = ({ position = [0, -2, 0] }) => {
  const group = useRef()
  const headRef = useRef()
  const torsoRef = useRef()
  const tailBaseRef = useRef()
  const tailFinRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const swimSpeed = 2.0

    // Circle path
    if (group.current) {
        const r = 15
        group.current.position.x = position[0] + Math.sin(t * 0.2) * r
        group.current.position.z = position[2] + Math.cos(t * 0.2) * r
        group.current.rotation.y = -t * 0.2 + Math.PI // Face forward

        // Bobbing
        group.current.position.y = position[1] + Math.sin(t * 0.5) * 0.5
    }

    // Undulation
    if (torsoRef.current) torsoRef.current.rotation.x = Math.sin(t * swimSpeed) * 0.1
    if (headRef.current) headRef.current.rotation.x = Math.sin(t * swimSpeed + 0.5) * 0.05
    if (tailBaseRef.current) tailBaseRef.current.rotation.x = Math.sin(t * swimSpeed - 0.5) * 0.2
    if (tailFinRef.current) tailFinRef.current.rotation.x = Math.sin(t * swimSpeed - 1.0) * 0.4
  })

  const skinColor = "#dba4a4"
  const skinProps = { color: skinColor, roughness: 0.2, metalness: 0.1 } // Wet look

  return (
    <group ref={group} position={position}>
        {/* Torso */}
        <group ref={torsoRef}>
            <RoundedBox args={[0.7, 0.7, 1.2]} radius={0.3} smoothness={4} castShadow>
                 <meshStandardMaterial {...skinProps} />
            </RoundedBox>

            {/* Dorsal Fin */}
            <mesh position={[0, 0.5, 0]} rotation={[0.4, 0, 0]}>
                 <coneGeometry args={[0.08, 0.4, 16]} />
                 <meshStandardMaterial {...skinProps} />
            </mesh>

            {/* Head */}
            <group position={[0, -0.05, 0.7]} ref={headRef}>
                 <RoundedBox args={[0.6, 0.6, 0.6]} radius={0.25} smoothness={4} castShadow>
                      <meshStandardMaterial {...skinProps} />
                 </RoundedBox>
                 {/* Beak/Snout */}
                 <group position={[0, -0.1, 0.4]}>
                     <RoundedBox args={[0.2, 0.15, 0.6]} radius={0.07} smoothness={4} castShadow>
                          <meshStandardMaterial color="#eecbcb" roughness={0.3} />
                     </RoundedBox>
                 </group>
                 {/* Eyes */}
                 <mesh position={[0.25, 0, 0.1]}>
                      <sphereGeometry args={[0.03, 8, 8]} />
                      <meshStandardMaterial color="black" />
                 </mesh>
                 <mesh position={[-0.25, 0, 0.1]}>
                      <sphereGeometry args={[0.03, 8, 8]} />
                      <meshStandardMaterial color="black" />
                 </mesh>
            </group>

            {/* Tail Base */}
            <group position={[0, 0, -0.7]} ref={tailBaseRef}>
                 <RoundedBox args={[0.5, 0.5, 0.8]} radius={0.2} smoothness={4} castShadow>
                      <meshStandardMaterial {...skinProps} />
                 </RoundedBox>

                 {/* Tail Fin */}
                 <group position={[0, 0, -0.5]} ref={tailFinRef}>
                      <mesh position={[0, 0, -0.2]} rotation={[-0.2, 0, 0]}>
                          <boxGeometry args={[1.0, 0.05, 0.4]} />
                          <meshStandardMaterial {...skinProps} />
                      </mesh>
                 </group>
            </group>

            {/* Pectoral Fins */}
            <mesh position={[0.3, -0.2, 0.2]} rotation={[0.5, 0, 0.5]}>
                 <boxGeometry args={[0.4, 0.05, 0.2]} />
                 <meshStandardMaterial {...skinProps} />
            </mesh>
            <mesh position={[-0.3, -0.2, 0.2]} rotation={[0.5, 0, -0.5]}>
                 <boxGeometry args={[0.4, 0.05, 0.2]} />
                 <meshStandardMaterial {...skinProps} />
            </mesh>
        </group>
    </group>
  )
}

export default PinkDolphin
