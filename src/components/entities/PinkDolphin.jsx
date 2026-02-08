import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'
import DolphinSkinMaterial from '../shaders/DolphinSkinMaterial'

extend({ DolphinSkinMaterial })

const PinkDolphin = ({ position = [0, -2, 0] }) => {
  const group = useRef()
  const headRef = useRef()
  const torsoRef = useRef()
  const tailBaseRef = useRef()
  const tailFinRef = useRef()

  // Fins
  const finL = useRef()
  const finR = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const swimSpeed = 2.0

    // Circle path
    if (group.current) {
        const r = 12
        group.current.position.x = position[0] + Math.sin(t * 0.2) * r
        group.current.position.z = position[2] + Math.cos(t * 0.2) * r
        group.current.rotation.y = t * 0.2 + Math.PI // Face forward along path

        // Bobbing
        group.current.position.y = position[1] + Math.sin(t * 0.8) * 0.3
    }

    // Undulation
    if (torsoRef.current) torsoRef.current.rotation.x = Math.sin(t * swimSpeed) * 0.1
    if (headRef.current) headRef.current.rotation.x = Math.sin(t * swimSpeed + 0.5) * 0.05
    if (tailBaseRef.current) tailBaseRef.current.rotation.x = Math.sin(t * swimSpeed - 0.5) * 0.2
    if (tailFinRef.current) tailFinRef.current.rotation.x = Math.sin(t * swimSpeed - 1.0) * 0.4

    // Fins flapping slightly
    if (finL.current) finL.current.rotation.z = 0.5 + Math.sin(t * swimSpeed) * 0.1
    if (finR.current) finR.current.rotation.z = -0.5 - Math.sin(t * swimSpeed) * 0.1
  })

  const skinMaterial = (
      <dolphinSkinMaterial
        uColorBase={new THREE.Color("#eecbcb")}
        uColorPatch={new THREE.Color("#998888")}
        uScale={3.0}
      />
  )

  return (
    <group ref={group} position={position}>
        {/* Torso Group */}
        <group ref={torsoRef}>
             {/* Main Body - Capsule for organic shape */}
             <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
                 {/* Radius 0.38, Length 1.5 */}
                 <capsuleGeometry args={[0.38, 1.5, 8, 16]} />
                 {skinMaterial}
             </mesh>

             {/* Dorsal Ridge (Hump) - Blended better */}
             <mesh position={[0, 0.3, -0.2]} rotation={[0.2, 0, 0]} scale={[0.4, 0.4, 1.5]}>
                 <sphereGeometry args={[0.5, 16, 16]} />
                 {skinMaterial}
             </mesh>

             {/* Tail Section */}
             <group position={[0, 0.1, -0.9]} ref={tailBaseRef}>
                  {/* Tail Stock - Tapered using Cone or scaled Capsule */}
                  <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, -0.6]} castShadow>
                      <coneGeometry args={[0.25, 1.4, 32]} />
                      {skinMaterial}
                  </mesh>
                  {/* Smoothing the joint with a sphere */}
                  <mesh position={[0, 0, -0.1]}>
                      <sphereGeometry args={[0.3, 16, 16]} />
                      {skinMaterial}
                  </mesh>

                  {/* Flukes (Tail Fin) */}
                  <group position={[0, 0, -1.3]} ref={tailFinRef} rotation={[-0.2, 0, 0]}>
                      {/* Better Flukes: Two flattened spheres with curve */}
                      <group position={[0, 0, 0]}>
                           <mesh position={[0.4, 0, 0]} rotation={[0.2, 0, -0.3]} scale={[1.2, 0.1, 0.7]}>
                               <sphereGeometry args={[0.35, 32, 32]} />
                               {skinMaterial}
                           </mesh>
                           <mesh position={[-0.4, 0, 0]} rotation={[0.2, 0, 0.3]} scale={[1.2, 0.1, 0.7]}>
                               <sphereGeometry args={[0.35, 32, 32]} />
                               {skinMaterial}
                           </mesh>
                           {/* Center blend */}
                           <mesh position={[0, 0, 0]} scale={[0.5, 0.1, 0.5]}>
                               <sphereGeometry args={[0.3, 16, 16]} />
                               {skinMaterial}
                           </mesh>
                      </group>
                  </group>
             </group>

             {/* Pectoral Fins attached to Torso */}
             <group position={[0.35, -0.15, 0.4]} rotation={[0, 0.5, 0.5]} ref={finL}>
                 <mesh scale={[1.0, 0.15, 0.5]} position={[0.4, 0, 0]}>
                     <sphereGeometry args={[0.4, 32, 32]} />
                     {skinMaterial}
                 </mesh>
             </group>
             <group position={[-0.35, -0.15, 0.4]} rotation={[0, -0.5, -0.5]} ref={finR}>
                 <mesh scale={[1.0, 0.15, 0.5]} position={[-0.4, 0, 0]}>
                     <sphereGeometry args={[0.4, 32, 32]} />
                     {skinMaterial}
                 </mesh>
             </group>
        </group>

        {/* Head Group */}
        <group position={[0, -0.05, 0.8]} ref={headRef}>
             {/* Cranium - Smooth blend */}
             <mesh castShadow position={[0, 0, -0.1]}>
                 <sphereGeometry args={[0.36, 32, 32]} />
                 {skinMaterial}
             </mesh>
             {/* Melon (Bulbous forehead) */}
             <mesh position={[0, 0.18, 0.15]} castShadow scale={[0.9, 1, 1.1]}>
                 <sphereGeometry args={[0.3, 32, 32]} />
                 {skinMaterial}
             </mesh>
             {/* Snout (Long beak) - Tapered Capsule/Cylinder blend */}
             <mesh position={[0, -0.05, 0.6]} rotation={[Math.PI/2, 0, 0]} castShadow>
                 {/* Using Cone for taper */}
                 <coneGeometry args={[0.06, 0.8, 32]} />
                 {skinMaterial}
             </mesh>
             {/* Snout tip rounded */}
             <mesh position={[0, -0.05, 1.0]}>
                 <sphereGeometry args={[0.03, 16, 16]} />
                 {skinMaterial}
             </mesh>

             {/* Eyes */}
             <mesh position={[0.22, -0.05, 0.15]}>
                 <sphereGeometry args={[0.025, 16, 16]} />
                 <meshStandardMaterial color="#111" roughness={0.0} />
             </mesh>
              <mesh position={[-0.22, -0.05, 0.15]}>
                 <sphereGeometry args={[0.025, 16, 16]} />
                 <meshStandardMaterial color="#111" roughness={0.0} />
             </mesh>
        </group>
    </group>
  )
}

export default PinkDolphin
