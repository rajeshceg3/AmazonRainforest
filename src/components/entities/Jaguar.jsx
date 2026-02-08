import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

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
    // Diagonal pairs move together usually in quadrupeds, but cats walk LF, RH, RF, LH
    // Let's do a simple diagonal trot for visual clarity: FL & BR vs FR & BL
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

  const furColor = "#c68642"

  return (
    <group ref={group} position={position}>
      {/* Root is Hips usually, but let's use Chest as parent for simplicity or center of mass */}
      {/* Let's build from Center (Belly) */}

      <group position={[0, 0.7, 0]}> {/* Height offset */}

          {/* BELLY (Center) */}
          <group ref={bellyRef}>
            <RoundedBox args={[0.5, 0.6, 0.7]} radius={0.25} smoothness={4} castShadow receiveShadow>
                 <meshStandardMaterial color={furColor} />
            </RoundedBox>

            {/* CHEST (Forward) */}
            <group position={[0, 0.05, 0.6]} ref={chestRef}>
                 <RoundedBox args={[0.55, 0.65, 0.6]} radius={0.25} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color={furColor} />
                 </RoundedBox>

                 {/* NECK */}
                 <group position={[0, 0.2, 0.4]} ref={neckRef} rotation={[0.2, 0, 0]}>
                    <RoundedBox args={[0.3, 0.3, 0.5]} radius={0.1} smoothness={4} castShadow receiveShadow>
                        <meshStandardMaterial color={furColor} />
                    </RoundedBox>

                    {/* HEAD */}
                    <group position={[0, 0.1, 0.3]} ref={headRef} rotation={[-0.2, 0, 0]}>
                        <RoundedBox args={[0.35, 0.35, 0.4]} radius={0.15} smoothness={4} castShadow receiveShadow>
                            <meshStandardMaterial color={furColor} />
                        </RoundedBox>
                        {/* Snout */}
                        <mesh position={[0, -0.05, 0.25]} castShadow receiveShadow>
                            <boxGeometry args={[0.18, 0.15, 0.2]} />
                            <meshStandardMaterial color="#e0ac69" />
                        </mesh>
                        {/* Ears */}
                        <mesh position={[0.12, 0.2, -0.05]} rotation={[0, 0, -0.2]} castShadow receiveShadow>
                            <coneGeometry args={[0.06, 0.15, 4]} />
                            <meshStandardMaterial color={furColor} />
                        </mesh>
                        <mesh position={[-0.12, 0.2, -0.05]} rotation={[0, 0, 0.2]} castShadow receiveShadow>
                            <coneGeometry args={[0.06, 0.15, 4]} />
                            <meshStandardMaterial color={furColor} />
                        </mesh>
                    </group>
                 </group>

                 {/* Front Legs */}
                 <group position={[0.25, -0.2, 0.2]} ref={legFL}>
                    <RoundedBox args={[0.15, 0.7, 0.15]} radius={0.07} position={[0, -0.3, 0]} castShadow receiveShadow>
                         <meshStandardMaterial color={furColor} />
                    </RoundedBox>
                 </group>
                 <group position={[-0.25, -0.2, 0.2]} ref={legFR}>
                    <RoundedBox args={[0.15, 0.7, 0.15]} radius={0.07} position={[0, -0.3, 0]} castShadow receiveShadow>
                         <meshStandardMaterial color={furColor} />
                    </RoundedBox>
                 </group>
            </group>

            {/* HIPS (Back) */}
            <group position={[0, 0.02, -0.6]} ref={hipsRef}>
                 <RoundedBox args={[0.52, 0.62, 0.6]} radius={0.25} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color={furColor} />
                 </RoundedBox>

                 {/* TAIL */}
                 <group position={[0, 0.2, -0.3]} ref={tailRef} rotation={[-0.4, 0, 0]}>
                    <RoundedBox args={[0.1, 0.1, 1.2]} radius={0.05} position={[0, 0, -0.5]} castShadow receiveShadow>
                        <meshStandardMaterial color={furColor} />
                    </RoundedBox>
                 </group>

                 {/* Back Legs */}
                 <group position={[0.25, -0.2, -0.2]} ref={legBL}>
                    <RoundedBox args={[0.18, 0.7, 0.18]} radius={0.08} position={[0, -0.3, 0]} castShadow receiveShadow>
                         <meshStandardMaterial color={furColor} />
                    </RoundedBox>
                 </group>
                 <group position={[-0.25, -0.2, -0.2]} ref={legBR}>
                    <RoundedBox args={[0.18, 0.7, 0.18]} radius={0.08} position={[0, -0.3, 0]} castShadow receiveShadow>
                         <meshStandardMaterial color={furColor} />
                    </RoundedBox>
                 </group>
            </group>
          </group>

      </group>
    </group>
  )
}

export default Jaguar
