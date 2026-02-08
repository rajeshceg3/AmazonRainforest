import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FurMaterial } from '../shaders/FurMaterial'

const Sloth = ({ position = [0, 10, 0] }) => {
  const group = useRef()
  const headRef = useRef()
  const armL = useRef()
  const armR = useRef()
  const legL = useRef()
  const legR = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Very slow sway (hanging behavior)
    if (group.current) {
      group.current.rotation.z = Math.PI + Math.sin(t * 0.2) * 0.1 // Base rotation is PI (upside down)
      group.current.rotation.x = Math.sin(t * 0.15) * 0.05
    }

    // Slow head look
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.1) * 0.2
      headRef.current.rotation.x = 0.4 + Math.sin(t * 0.15) * 0.05
    }
  })

  const furMaterial = (
      <FurMaterial
        uColor={new THREE.Color("#6d5e52")}
        uColorTip={new THREE.Color("#556b2f")} // Mossy green tip
        uScale={3.0}
      />
  )

  const clawGeometry = (
      <group rotation={[0.5, 0, 0]}>
          <mesh position={[0, 0.1, 0]} rotation={[0.2, 0, 0]}>
            <coneGeometry args={[0.04, 0.25, 8]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
          <mesh position={[0.05, 0.08, 0]} rotation={[0.2, 0, -0.2]}>
            <coneGeometry args={[0.03, 0.2, 8]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
           <mesh position={[-0.05, 0.08, 0]} rotation={[0.2, 0, 0.2]}>
            <coneGeometry args={[0.03, 0.2, 8]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
      </group>
  )

  return (
    <group ref={group} position={position} rotation={[0, 0, Math.PI]}> {/* Hanging upside down */}
      {/* Body - Capsule */}
      <mesh castShadow>
        <capsuleGeometry args={[0.45, 0.9, 8, 16]} />
        {furMaterial}
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0.5, -0.5, 0.2]} rotation={[0.4, 0, 0]}>
        <mesh castShadow>
           <sphereGeometry args={[0.32, 16, 16]} />
           {furMaterial}
        </mesh>

        {/* Face Mask - Organic Shape */}
        <group position={[0, 0.05, 0.25]} rotation={[-0.2, 0, 0]}>
             {/* Flattened Sphere for face mask */}
             <mesh castShadow scale={[1.1, 0.9, 0.3]} position={[0, 0, 0]}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <meshStandardMaterial color="#e0d6c8" roughness={0.9} />
             </mesh>

             {/* Eyes */}
             <group position={[0, 0.02, 0.08]}>
                 <mesh position={[0.08, 0, 0]}>
                     <sphereGeometry args={[0.035, 16, 16]} />
                     <meshStandardMaterial color="#111" roughness={0.2} />
                 </mesh>
                 <mesh position={[-0.08, 0, 0]}>
                     <sphereGeometry args={[0.035, 16, 16]} />
                     <meshStandardMaterial color="#111" roughness={0.2} />
                 </mesh>
                 {/* Nose */}
                 <mesh position={[0, -0.06, 0.04]}>
                     <sphereGeometry args={[0.06, 16, 16]} />
                     <meshStandardMaterial color="#222" roughness={0.5} />
                 </mesh>
             </group>
        </group>
      </group>

      {/* Limbs (Curved to hold branch) */}
      {/* Front Left */}
      <group position={[0.3, 0.2, 0.3]} rotation={[0, 0, -0.5]} ref={armL}>
          <mesh position={[0, 0.4, 0]}>
             <capsuleGeometry args={[0.12, 0.9, 4, 8]} />
             {furMaterial}
          </mesh>
          <group position={[0, 0.9, 0]}>
            {clawGeometry}
          </group>
      </group>

      {/* Front Right */}
      <group position={[0.3, 0.2, -0.3]} rotation={[0, 0, -0.5]} ref={armR}>
          <mesh position={[0, 0.4, 0]}>
             <capsuleGeometry args={[0.12, 0.9, 4, 8]} />
             {furMaterial}
          </mesh>
          <group position={[0, 0.9, 0]}>
            {clawGeometry}
          </group>
      </group>

      {/* Back Left */}
      <group position={[-0.3, 0.2, 0.3]} rotation={[0, 0, 0.5]} ref={legL}>
          <mesh position={[0, 0.4, 0]}>
             <capsuleGeometry args={[0.12, 0.9, 4, 8]} />
             {furMaterial}
          </mesh>
          <group position={[0, 0.9, 0]}>
            {clawGeometry}
          </group>
      </group>

      {/* Back Right */}
      <group position={[-0.3, 0.2, -0.3]} rotation={[0, 0, 0.5]} ref={legR}>
           <mesh position={[0, 0.4, 0]}>
             <capsuleGeometry args={[0.12, 0.9, 4, 8]} />
             {furMaterial}
          </mesh>
          <group position={[0, 0.9, 0]}>
            {clawGeometry}
          </group>
      </group>
    </group>
  )
}

export default Sloth
