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
             {/* Main Body Cylinder */}
             <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
                 <cylinderGeometry args={[0.35, 0.4, 1.4, 16]} />
                 {skinMaterial}
             </mesh>

             {/* Dorsal Ridge (Hump) */}
             <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0]}>
                 <capsuleGeometry args={[0.1, 0.8, 4, 8]} />
                 {/* Rotate capsule to lie flat along spine */}
                 {/* Capsule is Y-aligned. Rotate X 90. */}
             </mesh>
             {/* Better Hump: Scaled Sphere */}
             <mesh position={[0, 0.25, 0]} scale={[0.5, 0.5, 2.0]}>
                 <sphereGeometry args={[0.3, 16, 16]} />
                 {skinMaterial}
             </mesh>

             {/* Tail Section */}
             <group position={[0, 0, -0.7]} ref={tailBaseRef}>
                  <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, -0.5]} castShadow>
                      <cylinderGeometry args={[0.35, 0.1, 1.2, 16]} />
                      {skinMaterial}
                  </mesh>

                  {/* Flukes (Tail Fin) */}
                  <group position={[0, 0, -1.1]} ref={tailFinRef}>
                      {/* Better Flukes: Two flattened spheres */}
                      <group position={[0, 0, 0]}>
                           <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.2]} scale={[1, 0.1, 0.6]}>
                               <sphereGeometry args={[0.4, 16, 16]} />
                               {skinMaterial}
                           </mesh>
                           <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0.2]} scale={[1, 0.1, 0.6]}>
                               <sphereGeometry args={[0.4, 16, 16]} />
                               {skinMaterial}
                           </mesh>
                      </group>
                  </group>
             </group>

             {/* Pectoral Fins attached to Torso */}
             <group position={[0.35, -0.2, 0.3]} rotation={[0, 0.5, 0.5]} ref={finL}>
                 <mesh scale={[0.8, 0.1, 0.4]} position={[0.4, 0, 0]}>
                     <sphereGeometry args={[0.5, 16, 16]} />
                     {skinMaterial}
                 </mesh>
             </group>
             <group position={[-0.35, -0.2, 0.3]} rotation={[0, -0.5, -0.5]} ref={finR}>
                 <mesh scale={[0.8, 0.1, 0.4]} position={[-0.4, 0, 0]}>
                     <sphereGeometry args={[0.5, 16, 16]} />
                     {skinMaterial}
                 </mesh>
             </group>
        </group>

        {/* Head Group */}
        <group position={[0, 0, 0.7]} ref={headRef}>
             {/* Cranium */}
             <mesh castShadow>
                 <sphereGeometry args={[0.35, 16, 16]} />
                 {skinMaterial}
             </mesh>
             {/* Melon (Bulbous forehead) */}
             <mesh position={[0, 0.15, 0.1]} castShadow>
                 <sphereGeometry args={[0.28, 16, 16]} />
                 {skinMaterial}
             </mesh>
             {/* Snout (Long beak) */}
             <mesh position={[0, -0.1, 0.5]} rotation={[Math.PI/2, 0, 0]} castShadow>
                 <cylinderGeometry args={[0.05, 0.08, 0.7, 12]} />
                 {skinMaterial}
             </mesh>

             {/* Eyes */}
             <mesh position={[0.22, -0.05, 0.15]}>
                 <sphereGeometry args={[0.02, 8, 8]} />
                 <meshStandardMaterial color="#111" roughness={0.0} />
             </mesh>
              <mesh position={[-0.22, -0.05, 0.15]}>
                 <sphereGeometry args={[0.02, 8, 8]} />
                 <meshStandardMaterial color="#111" roughness={0.0} />
             </mesh>
        </group>
    </group>
  )
}

export default PinkDolphin
