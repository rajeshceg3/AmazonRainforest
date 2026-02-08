import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
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

  // Reusable geometry
  const muscleGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), [])

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

          {/* BELLY (Center) - Ellipsoid */}
          <group ref={bellyRef}>
            <mesh geometry={muscleGeo} scale={[0.25, 0.3, 0.35]} castShadow receiveShadow>
                 {furMaterial}
            </mesh>

            {/* CHEST (Forward) */}
            <group position={[0, 0.05, 0.5]} ref={chestRef}>
                 <mesh geometry={muscleGeo} scale={[0.28, 0.32, 0.35]} castShadow receiveShadow>
                    {furMaterial}
                 </mesh>

                 {/* NECK */}
                 <group position={[0, 0.15, 0.3]} ref={neckRef} rotation={[0.4, 0, 0]}>
                    <mesh geometry={muscleGeo} scale={[0.15, 0.15, 0.25]} castShadow receiveShadow>
                        {furMaterial}
                    </mesh>

                    {/* HEAD */}
                    <group position={[0, 0.0, 0.25]} ref={headRef} rotation={[-0.4, 0, 0]}>
                        <mesh geometry={muscleGeo} scale={[0.18, 0.18, 0.2]} castShadow receiveShadow>
                            {furMaterial}
                        </mesh>
                        {/* Snout */}
                        <mesh position={[0, -0.05, 0.18]} castShadow receiveShadow>
                            <boxGeometry args={[0.12, 0.1, 0.15]} />
                            <meshStandardMaterial color="#e0ac69" roughness={0.6} />
                        </mesh>
                        {/* Ears - small spheres */}
                        <mesh geometry={muscleGeo} scale={[0.05, 0.05, 0.02]} position={[0.1, 0.15, 0.0]} rotation={[0, 0, -0.5]} castShadow receiveShadow>
                             <meshStandardMaterial color="#d49b5c" />
                        </mesh>
                        <mesh geometry={muscleGeo} scale={[0.05, 0.05, 0.02]} position={[-0.1, 0.15, 0.0]} rotation={[0, 0, 0.5]} castShadow receiveShadow>
                             <meshStandardMaterial color="#d49b5c" />
                        </mesh>
                    </group>
                 </group>

                 {/* Front Legs - Upper Arm */}
                 <group position={[0.2, -0.1, 0.15]} ref={legFL}>
                    <mesh geometry={muscleGeo} scale={[0.08, 0.25, 0.1]} position={[0, -0.15, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </mesh>
                    {/* Lower Arm */}
                     <mesh geometry={muscleGeo} scale={[0.06, 0.2, 0.08]} position={[0, -0.45, 0.05]} rotation={[-0.2, 0, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </mesh>
                 </group>
                 <group position={[-0.2, -0.1, 0.15]} ref={legFR}>
                    <mesh geometry={muscleGeo} scale={[0.08, 0.25, 0.1]} position={[0, -0.15, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </mesh>
                     <mesh geometry={muscleGeo} scale={[0.06, 0.2, 0.08]} position={[0, -0.45, 0.05]} rotation={[-0.2, 0, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </mesh>
                 </group>
            </group>

            {/* HIPS (Back) */}
            <group position={[0, 0.02, -0.5]} ref={hipsRef}>
                 <mesh geometry={muscleGeo} scale={[0.26, 0.31, 0.35]} castShadow receiveShadow>
                    {furMaterial}
                 </mesh>

                 {/* TAIL */}
                 <group position={[0, 0.1, -0.3]} ref={tailRef} rotation={[-0.4, 0, 0]}>
                     {/* Tail segments using simple cylinder or stretched sphere */}
                    <mesh geometry={muscleGeo} scale={[0.04, 0.04, 0.6]} position={[0, 0, -0.5]} castShadow receiveShadow>
                        {furMaterial}
                    </mesh>
                 </group>

                 {/* Back Legs */}
                 <group position={[0.2, -0.1, -0.1]} ref={legBL}>
                    <mesh geometry={muscleGeo} scale={[0.1, 0.3, 0.15]} position={[0, -0.15, 0]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </mesh>
                    {/* Lower Leg */}
                     <mesh geometry={muscleGeo} scale={[0.07, 0.25, 0.08]} position={[0, -0.5, -0.05]} rotation={[-0.4, 0, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </mesh>
                 </group>
                 <group position={[-0.2, -0.1, -0.1]} ref={legBR}>
                    <mesh geometry={muscleGeo} scale={[0.1, 0.3, 0.15]} position={[0, -0.15, 0]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </mesh>
                     <mesh geometry={muscleGeo} scale={[0.07, 0.25, 0.08]} position={[0, -0.5, -0.05]} rotation={[-0.4, 0, 0]} castShadow receiveShadow>
                         {furMaterial}
                    </mesh>
                 </group>
            </group>
          </group>

      </group>
    </group>
  )
}

export default Jaguar
