import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import JaguarFurMaterial from '../shaders/JaguarFurMaterial'

extend({ JaguarFurMaterial })

const Jaguar = ({ position = [0, 0, 0] }) => {
  const group = useRef()
  // Body segments
  const headRef = useRef()
  const neckRef = useRef()
  const chestRef = useRef()
  const bellyRef = useRef()
  const hipsRef = useRef()
  const tailRef = useRef()

  // Legs
  const legFL = useRef()
  const legFR = useRef()
  const legBL = useRef()
  const legBR = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const speed = 2.0

    // Spine undulation (Sinusoidal wave through segments)
    if (chestRef.current) chestRef.current.rotation.y = Math.sin(t * speed) * 0.05
    if (bellyRef.current) bellyRef.current.rotation.y = Math.sin(t * speed - 0.5) * 0.05
    if (hipsRef.current) hipsRef.current.rotation.y = Math.sin(t * speed - 1.0) * 0.05
    if (neckRef.current) neckRef.current.rotation.y = Math.sin(t * speed + 0.5) * 0.03
    if (headRef.current) headRef.current.rotation.y = Math.sin(t * speed + 1.0) * 0.02

    // Tail Sway (Lagging behind hips)
    if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * speed - 2.0) * 0.2
        tailRef.current.rotation.z = Math.cos(t * speed * 0.5) * 0.1 // Casual sway
    }

    // Walking Cycle (Legs)
    const legAmp = 0.4
    if (legFL.current) legFL.current.rotation.x = Math.sin(t * speed) * legAmp
    if (legBR.current) legBR.current.rotation.x = Math.sin(t * speed) * legAmp

    if (legFR.current) legFR.current.rotation.x = Math.sin(t * speed + Math.PI) * legAmp
    if (legBL.current) legBL.current.rotation.x = Math.sin(t * speed + Math.PI) * legAmp

    // Breathing
    if (chestRef.current) chestRef.current.scale.y = 1 + Math.sin(t * 3) * 0.02

    // Slight bobbing of whole group
    if (group.current) {
        group.current.position.y = position[1] + Math.abs(Math.sin(t * speed)) * 0.05
    }
  })

  const furMaterial = (
      <jaguarFurMaterial
        uScale={6.0}
        uColor={new THREE.Color("#d49b5c")}
        uSpotColor={new THREE.Color("#2b1d0e")}
      />
  )

  return (
    <group ref={group} position={position}>
      <group position={[0, 0.7, 0]}> {/* Height offset */}

          {/* BELLY (Center) */}
          <group ref={bellyRef}>
            <RoundedBox args={[0.5, 0.6, 0.7]} radius={0.25} smoothness={8} castShadow receiveShadow>
                 {furMaterial}
            </RoundedBox>

            {/* CHEST (Forward) */}
            <group position={[0, 0.05, 0.6]} ref={chestRef}>
                 <RoundedBox args={[0.55, 0.65, 0.6]} radius={0.25} smoothness={8} castShadow receiveShadow>
                    {furMaterial}
                 </RoundedBox>

                 {/* NECK */}
                 <group position={[0, 0.2, 0.4]} ref={neckRef} rotation={[0.2, 0, 0]}>
                    <RoundedBox args={[0.3, 0.3, 0.5]} radius={0.12} smoothness={8} castShadow receiveShadow>
                        {furMaterial}
                    </RoundedBox>

                    {/* HEAD */}
                    <group position={[0, 0.1, 0.3]} ref={headRef} rotation={[-0.2, 0, 0]}>
                        <RoundedBox args={[0.35, 0.35, 0.4]} radius={0.16} smoothness={8} castShadow receiveShadow>
                            {furMaterial}
                        </RoundedBox>
                        {/* Snout */}
                        <mesh position={[0, -0.05, 0.25]} castShadow receiveShadow>
                            <boxGeometry args={[0.18, 0.15, 0.2]} />
                            <meshStandardMaterial color="#e0ac69" roughness={0.6} />
                        </mesh>
                        {/* Ears - more rounded */}
                        <group position={[0.12, 0.2, -0.05]} rotation={[0, 0, -0.2]}>
                            <RoundedBox args={[0.08, 0.12, 0.05]} radius={0.04} smoothness={4} castShadow receiveShadow>
                                <meshStandardMaterial color="#d49b5c" />
                            </RoundedBox>
                        </group>
                        <group position={[-0.12, 0.2, -0.05]} rotation={[0, 0, 0.2]}>
                             <RoundedBox args={[0.08, 0.12, 0.05]} radius={0.04} smoothness={4} castShadow receiveShadow>
                                <meshStandardMaterial color="#d49b5c" />
                            </RoundedBox>
                        </group>
                    </group>
                 </group>

                 {/* Front Legs */}
                 <group position={[0.25, -0.2, 0.2]} ref={legFL}>
                    <RoundedBox args={[0.15, 0.7, 0.15]} radius={0.07} smoothness={8} position={[0, -0.3, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </RoundedBox>
                 </group>
                 <group position={[-0.25, -0.2, 0.2]} ref={legFR}>
                    <RoundedBox args={[0.15, 0.7, 0.15]} radius={0.07} smoothness={8} position={[0, -0.3, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </RoundedBox>
                 </group>
            </group>

            {/* HIPS (Back) */}
            <group position={[0, 0.02, -0.6]} ref={hipsRef}>
                 <RoundedBox args={[0.52, 0.62, 0.6]} radius={0.25} smoothness={8} castShadow receiveShadow>
                    {furMaterial}
                 </RoundedBox>

                 {/* TAIL */}
                 <group position={[0, 0.2, -0.3]} ref={tailRef} rotation={[-0.4, 0, 0]}>
                    <RoundedBox args={[0.1, 0.1, 1.2]} radius={0.05} smoothness={8} position={[0, 0, -0.5]} castShadow receiveShadow>
                        {furMaterial}
                    </RoundedBox>
                 </group>

                 {/* Back Legs */}
                 <group position={[0.25, -0.2, -0.2]} ref={legBL}>
                    <RoundedBox args={[0.18, 0.7, 0.18]} radius={0.08} smoothness={8} position={[0, -0.3, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </RoundedBox>
                 </group>
                 <group position={[-0.25, -0.2, -0.2]} ref={legBR}>
                    <RoundedBox args={[0.18, 0.7, 0.18]} radius={0.08} smoothness={8} position={[0, -0.3, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </RoundedBox>
                 </group>
            </group>
          </group>

      </group>
    </group>
  )
}

export default Jaguar
