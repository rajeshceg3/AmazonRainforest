import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'
import FurMaterial from '../shaders/FurMaterial'

extend({ FurMaterial })

const Macaw = ({ position = [0, 15, 0] }) => {
  const group = useRef()
  const wingL = useRef()
  const wingR = useRef()
  const tailRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Flight Path (Figure 8)
    if (group.current) {
        const x = position[0] + Math.sin(t * 0.5) * 12
        const z = position[2] + Math.sin(t) * 6
        const y = position[1] + Math.cos(t * 0.8) * 2

        // Determine velocity for orientation
        const dx = Math.cos(t * 0.5) * 12 * 0.5
        const dz = Math.cos(t) * 6
        const dy = -Math.sin(t * 0.8) * 2 * 0.8

        group.current.position.set(x, y, z)

        const targetRot = Math.atan2(dx, dz)
        group.current.rotation.y = targetRot + Math.PI // Face forward? atan2(x, z) gives angle from Z.

        // Banking
        group.current.rotation.z = -dx * 0.05
        group.current.rotation.x = -dy * 0.1 // Pitch
    }

    // Wing Flap
    const flap = Math.sin(t * 10)
    if (wingL.current) {
        wingL.current.rotation.z = flap * 0.5 + 0.2
        // Fold wing slightly on upstroke? Simpler to just rotate
    }
    if (wingR.current) {
        wingR.current.rotation.z = -flap * 0.5 - 0.2
    }

    // Tail
    if (tailRef.current) {
        tailRef.current.rotation.x = 0.2 + Math.sin(t * 10) * 0.1
    }
  })

  const redFeather = (
      <furMaterial
        uColor={new THREE.Color("#d02020")}
        uColorTip={new THREE.Color("#ff4040")}
        uScale={5.0}
      />
  )

  const yellowFeather = (
       <furMaterial
        uColor={new THREE.Color("#e6d412")}
        uColorTip={new THREE.Color("#ffff00")}
        uScale={5.0}
      />
  )

  const flightFeatherMat = (
      <meshStandardMaterial color="#1e3d9e" roughness={0.6} side={THREE.DoubleSide} />
  )

  return (
    <group ref={group} position={position}>
      {/* Body - Slightly tapered Capsule */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.6, 4, 16]} />
          {redFeather}
      </mesh>

      {/* Head */}
      <group position={[0, 0, 0.5]} rotation={[-0.2, 0, 0]}>
           <mesh castShadow>
               <sphereGeometry args={[0.22, 16, 16]} />
               {redFeather}
           </mesh>

           {/* Face Patch (White skin) */}
           <mesh position={[0, 0.02, 0.18]} rotation={[0.2, 0, 0]}>
               <sphereGeometry args={[0.18, 16, 16]} />
               <meshStandardMaterial color="#ffffff" roughness={0.9} />
           </mesh>

           {/* Upper Beak (Hooked) */}
           <group position={[0, 0.05, 0.25]} rotation={[0.5, 0, 0]}>
               {/* Base of beak */}
               <mesh>
                   <coneGeometry args={[0.1, 0.3, 16]} />
                   <meshStandardMaterial color="#fdfdfd" roughness={0.4} />
               </mesh>
               {/* Tip hook (Torus segment or bent cone) */}
               <mesh position={[0, 0.15, 0.05]} rotation={[-0.5, 0, 0]}>
                   <coneGeometry args={[0.08, 0.2, 16]} />
                    <meshStandardMaterial color="#fdfdfd" roughness={0.4} />
               </mesh>
           </group>

           {/* Lower Beak */}
           <mesh position={[0, -0.08, 0.25]} rotation={[-0.2, 0, 0]}>
               <coneGeometry args={[0.08, 0.15, 16]} />
               <meshStandardMaterial color="#111" roughness={0.4} />
           </mesh>

           {/* Eyes */}
           <mesh position={[0.12, 0.05, 0.2]}>
               <sphereGeometry args={[0.03, 8, 8]} />
               <meshStandardMaterial color="#111" />
           </mesh>
           <mesh position={[-0.12, 0.05, 0.2]}>
               <sphereGeometry args={[0.03, 8, 8]} />
               <meshStandardMaterial color="#111" />
           </mesh>
      </group>

      {/* Tail */}
      <group ref={tailRef} position={[0, -0.1, -0.4]} rotation={[-0.2, 0, 0]}>
           {/* Layered Tail Feathers - Flattened Capsules */}
           {[0, 1, 2].map(i => (
                <mesh key={i} position={[0, -i*0.02, -0.5 - i*0.1]} rotation={[Math.PI/2, 0, 0]} scale={[1 - i*0.1, 1, 0.05]}>
                    <capsuleGeometry args={[0.12, 0.8 + i*0.2, 4, 8]} />
                    {flightFeatherMat}
                </mesh>
           ))}
           <mesh position={[0, 0.02, -0.4]} rotation={[Math.PI/2, 0, 0]} scale={[1, 1, 0.1]}>
               <capsuleGeometry args={[0.15, 0.3, 4, 8]} />
               <meshStandardMaterial color="#d02020" roughness={0.6} side={THREE.DoubleSide} />
           </mesh>
      </group>

      {/* Wings */}
      {/* Left */}
      <group position={[0.2, 0.1, 0.1]} ref={wingL}>
           {/* Shoulder (Red) */}
           <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.2]}>
               <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
               {redFeather}
           </mesh>
           {/* Coverts (Yellow) - Flattened Spheres */}
           <mesh position={[0.5, 0, 0]} rotation={[0, 0, -0.2]} scale={[0.5, 0.05, 0.3]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                {yellowFeather}
           </mesh>
           {/* Flight (Blue) - Fan of Feathers */}
           <group position={[0.8, -0.05, 0]}>
                {[0, 1, 2, 3, 4].map(i => (
                     <mesh key={i} position={[0.1 + i*0.05, 0, (i-2)*0.08]} rotation={[0, (i-2)*0.1, Math.PI/2]} scale={[1, 1, 0.05]}>
                         <capsuleGeometry args={[0.08, 0.5 + Math.sin(i)*0.1, 4, 8]} />
                         {flightFeatherMat}
                     </mesh>
                ))}
           </group>
      </group>

      {/* Right */}
      <group position={[-0.2, 0.1, 0.1]} ref={wingR}>
           {/* Shoulder (Red) */}
           <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.2]}>
               <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
               {redFeather}
           </mesh>
           {/* Coverts (Yellow) */}
           <mesh position={[-0.5, 0, 0]} rotation={[0, 0, 0.2]} scale={[0.5, 0.05, 0.3]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                {yellowFeather}
           </mesh>
           {/* Flight (Blue) - Fan of Feathers */}
           <group position={[-0.8, -0.05, 0]}>
                {[0, 1, 2, 3, 4].map(i => (
                     <mesh key={i} position={[-0.1 - i*0.05, 0, (i-2)*0.08]} rotation={[0, -(i-2)*0.1, -Math.PI/2]} scale={[1, 1, 0.05]}>
                         <capsuleGeometry args={[0.08, 0.5 + Math.sin(i)*0.1, 4, 8]} />
                         {flightFeatherMat}
                     </mesh>
                ))}
           </group>
      </group>

    </group>
  )
}

export default Macaw
