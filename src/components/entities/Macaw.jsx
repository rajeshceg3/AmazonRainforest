import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Macaw = ({ position = [0, 15, 0] }) => {
  const group = useRef()
  const wingL_Arm = useRef()
  const wingL_Forearm = useRef()
  const wingR_Arm = useRef()
  const wingR_Forearm = useRef()
  const tailRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Flight Path
    if (group.current) {
        // Figure 8
        const x = position[0] + Math.sin(t * 0.5) * 12
        const z = position[2] + Math.sin(t) * 6
        const y = position[1] + Math.cos(t * 0.8) * 2

        group.current.position.set(x, y, z)

        // Banking and Turning
        // Look ahead
        const dx = Math.cos(t * 0.5) * 12 * 0.5 // Derivative of x
        const dz = Math.cos(t) * 6 // Derivative of z
        const targetRot = Math.atan2(dx, dz) + Math.PI / 2

        group.current.rotation.y = targetRot
        // Bank into turn
        group.current.rotation.z = -dx * 0.05
        group.current.rotation.x = Math.sin(t * 0.8) * 0.1 // Pitch
    }

    // Wing Flap - Multi-stage
    const flap = Math.sin(t * 8)
    const flapAmp = 0.6

    if (wingL_Arm.current) wingL_Arm.current.rotation.z = flap * flapAmp
    if (wingR_Arm.current) wingR_Arm.current.rotation.z = -flap * flapAmp

    // Forearms lag slightly
    const lag = 0.5
    const flapFore = Math.sin(t * 8 - lag)
    if (wingL_Forearm.current) wingL_Forearm.current.rotation.z = flapFore * 0.3 + 0.2 // Add base offset
    if (wingR_Forearm.current) wingR_Forearm.current.rotation.z = -flapFore * 0.3 - 0.2

    // Tail Adjustment
    if (tailRef.current) {
        tailRef.current.rotation.y = Math.cos(t * 0.5) * 0.2 // Rudder
        tailRef.current.rotation.x = 0.2 + Math.sin(t * 8) * 0.1 // Stabilize
    }
  })

  return (
    <group ref={group} position={position}>
      {/* Body Group */}
      <group rotation={[0, 0, 0]}>
          {/* Main Body */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
             <capsuleGeometry args={[0.3, 0.8, 4, 16]} />
             <meshStandardMaterial color="#c91818" /> {/* Scarlet Macaw Red */}
          </mesh>

          {/* Head */}
          <group position={[0, 0.5, 0.2]} rotation={[0.2, 0, 0]}>
             <mesh castShadow>
                 <sphereGeometry args={[0.25, 16, 16]} />
                 <meshStandardMaterial color="#c91818" />
             </mesh>
             {/* Beak */}
             <mesh position={[0, -0.05, 0.22]} rotation={[0.4, 0, 0]} castShadow>
                 <coneGeometry args={[0.12, 0.3, 16]} />
                 <meshStandardMaterial color="#f0f0f0" /> {/* Upper beak white/bone */}
             </mesh>
             <mesh position={[0, -0.12, 0.18]} rotation={[-0.2, 0, 0]} castShadow>
                 <coneGeometry args={[0.08, 0.15, 16]} />
                 <meshStandardMaterial color="#222" /> {/* Lower beak black */}
             </mesh>
             {/* Eyes */}
             <mesh position={[0.12, 0.05, 0.15]}>
                 <sphereGeometry args={[0.04, 8, 8]} />
                 <meshStandardMaterial color="black" />
             </mesh>
             <mesh position={[-0.12, 0.05, 0.15]}>
                 <sphereGeometry args={[0.04, 8, 8]} />
                 <meshStandardMaterial color="black" />
             </mesh>
          </group>

          {/* Tail Feathers */}
          <group ref={tailRef} position={[0, -0.4, -0.1]} rotation={[0.5, 0, 0]}>
              <mesh position={[0, -0.6, 0]} castShadow>
                  <boxGeometry args={[0.3, 1.2, 0.05]} />
                  <meshStandardMaterial color="#1e3d9e" /> {/* Blue tips */}
              </mesh>
          </group>

          {/* Left Wing */}
          <group position={[0.2, 0.2, 0]}>
             <group ref={wingL_Arm} rotation={[0, 0, 0.2]}>
                 {/* Arm */}
                 <mesh position={[0.3, 0, 0]}>
                     <boxGeometry args={[0.6, 0.1, 0.4]} />
                     <meshStandardMaterial color="#e6d412" /> {/* Yellow shoulder */}
                 </mesh>
                 {/* Forearm */}
                 <group position={[0.6, 0, 0]} ref={wingL_Forearm}>
                      <mesh position={[0.5, 0, 0]}>
                         <boxGeometry args={[1.0, 0.05, 0.5]} />
                         <meshStandardMaterial color="#1e3d9e" /> {/* Blue feathers */}
                      </mesh>
                 </group>
             </group>
          </group>

          {/* Right Wing */}
          <group position={[-0.2, 0.2, 0]}>
             <group ref={wingR_Arm} rotation={[0, 0, -0.2]}>
                 {/* Arm */}
                 <mesh position={[-0.3, 0, 0]}>
                     <boxGeometry args={[0.6, 0.1, 0.4]} />
                     <meshStandardMaterial color="#e6d412" />
                 </mesh>
                 {/* Forearm */}
                 <group position={[-0.6, 0, 0]} ref={wingR_Forearm}>
                      <mesh position={[-0.5, 0, 0]}>
                         <boxGeometry args={[1.0, 0.05, 0.5]} />
                         <meshStandardMaterial color="#1e3d9e" />
                      </mesh>
                 </group>
             </group>
          </group>

      </group>
    </group>
  )
}

export default Macaw
