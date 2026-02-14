import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { JaguarFurMaterial } from '../shaders/JaguarFurMaterial'
import { pseudoNoise, remap, mix } from '../../utils/OrganicMath'

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

  // State for idle behavior
  const behaviorState = useRef({
    isIdle: false,
    nextTransition: 5.0, // Time until next state change
    headTargetX: 0,
    headTargetY: 0,
    seed: Math.random() * 100
  })

  // Reusable geometry
  const muscleGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const dt = state.clock.getDelta()
    const { seed } = behaviorState.current

    // --- State Machine: Idle vs Walking ---
    if (t > behaviorState.current.nextTransition) {
      behaviorState.current.isIdle = !behaviorState.current.isIdle
      // Randomize next duration: Idle for 2-5s, Walk for 5-10s
      const duration = behaviorState.current.isIdle
        ? 2 + Math.random() * 3
        : 5 + Math.random() * 5
      behaviorState.current.nextTransition = t + duration

      if (behaviorState.current.isIdle) {
        // Pick a random spot to look at
        behaviorState.current.headTargetY = (Math.random() - 0.5) * 1.0 // Left/Right
        behaviorState.current.headTargetX = (Math.random() - 0.5) * 0.5 // Up/Down
      }
    }

    // Smoothly blend speed (0 for idle, 2.0 for walk)
    // We use a separate lerp value, but for simplicity here we just use isIdle logic
    // A more robust way would be a 'currentSpeed' ref.
    // Let's assume sudden stop is okay for now, or just damping.
    const targetSpeed = behaviorState.current.isIdle ? 0.0 : 2.0
    // Simple damping for speed would require a persistent speed var.
    // Let's stick to the request: Organic Noise replacing Sinewaves.

    // Using a persistent 'animTime' allows us to stop the cycle when idle
    if (!behaviorState.current.animTime) behaviorState.current.animTime = 0
    if (!behaviorState.current.isIdle) {
        behaviorState.current.animTime += 0.016 * 2.0 // advance animation
    }
    const aT = behaviorState.current.animTime

    // --- Organic Movement Logic ---

    // Spine Undulation: Layered noise for less robotic feel
    const spineNoise = pseudoNoise(aT, seed) * 0.1
    if (chestRef.current) chestRef.current.rotation.y = spineNoise * 0.5
    if (bellyRef.current) bellyRef.current.rotation.y = pseudoNoise(aT - 0.5, seed) * 0.05
    if (hipsRef.current) hipsRef.current.rotation.y = pseudoNoise(aT - 1.0, seed) * 0.05

    // Neck counter-rotation + noise
    if (neckRef.current) neckRef.current.rotation.y = -spineNoise * 0.8 + pseudoNoise(t * 0.5, seed + 10) * 0.05

    // Head: Micro-twitches + Look Target
    let headY = -spineNoise * 0.5 // Counter-balance body
    let headX = 0

    // Idle looking around
    if (behaviorState.current.isIdle) {
       headY = mix(headY, behaviorState.current.headTargetY, 0.1) // Lerp to target
       headX = mix(headX, behaviorState.current.headTargetX, 0.1)
    }

    // Micro-twitches (High frequency noise)
    const twitch = pseudoNoise(t * 15.0, seed + 50)
    // Only twitch occasionally (threshold)
    if (twitch > 0.6) {
        headY += (twitch - 0.6) * 0.1
        headX += (twitch - 0.6) * 0.05
    }

    if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, headY, 0.1)
        // Add breathing to head pitch
        headRef.current.rotation.x = -0.4 + headX + Math.sin(t * 2.0) * 0.01
    }

    // Tail Sway: Very organic, independent noise
    if (tailRef.current) {
        // Base sway + whip
        const tailSway = pseudoNoise(t * 0.8, seed + 20) * 0.3
        const tailWhip = pseudoNoise(t * 3.0, seed + 25) * 0.1 // Occasional flick
        tailRef.current.rotation.y = tailSway + tailWhip
        tailRef.current.rotation.z = Math.cos(t * 0.5) * 0.1
    }

    // Walking Cycle (Legs)
    // We keep sin/cos for the gait cycle as it's rhythmic, but modulated by 'isIdle'
    const legAmp = behaviorState.current.isIdle ? 0 : 0.4
    // Lerp leg amplitude for smooth stop
    // We can just apply the rotation directly.

    if (legFL.current) legFL.current.rotation.x = Math.sin(aT) * legAmp
    if (legBR.current) legBR.current.rotation.x = Math.sin(aT) * legAmp
    if (legFR.current) legFR.current.rotation.x = Math.sin(aT + Math.PI) * legAmp
    if (legBL.current) legBL.current.rotation.x = Math.sin(aT + Math.PI) * legAmp

    // Breathing: Always happens, distinct from walking
    // Complex breath: Inhale pause Exhale pause
    const breath = (Math.sin(t * 1.5) + Math.sin(t * 1.5 + Math.PI*0.2) * 0.5) * 0.02
    if (chestRef.current) chestRef.current.scale.y = 1 + breath

    // Bobbing
    if (group.current) {
        const bob = Math.abs(Math.sin(aT)) * 0.05
        // Smoothly transition bob height
        group.current.position.y = position[1] + (behaviorState.current.isIdle ? 0 : bob)
    }
  })

  const furMaterial = (
      <JaguarFurMaterial
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
                        {/* Snout - Rounded */}
                        <mesh geometry={muscleGeo} scale={[0.06, 0.05, 0.08]} position={[0, -0.05, 0.18]} castShadow receiveShadow>
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
