import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FeatherMaterial } from '../shaders/FeatherMaterial'
import { FurMaterial } from '../shaders/FurMaterial'

const Macaw = ({ position = [0, 15, 0] }) => {
  const group = useRef()
  const bodyRef = useRef()
  const wingL = useRef()
  const wingR = useRef()
  const tailRef = useRef()

  // Animation State
  const timeOffset = useMemo(() => Math.random() * 100, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + timeOffset

    // Flight Path (Figure 8 with banking)
    if (group.current) {
        const x = position[0] + Math.sin(t * 0.5) * 12
        const z = position[2] + Math.cos(t * 0.3) * 8 // Lissajous
        const y = position[1] + Math.cos(t * 0.8) * 2

        // Velocity for orientation
        const nextX = position[0] + Math.sin((t + 0.1) * 0.5) * 12
        const nextZ = position[2] + Math.cos((t + 0.1) * 0.3) * 8
        const nextY = position[1] + Math.cos((t + 0.1) * 0.8) * 2

        const dx = nextX - x
        const dy = nextY - y
        const dz = nextZ - z

        group.current.position.set(x, y, z)

        // Look at next position
        const targetPos = new THREE.Vector3(nextX, nextY, nextZ)
        group.current.lookAt(targetPos)

        // Banking (Roll) based on turn sharpness
        // Simple approximation: roll into the turn
        // Calculate curvature?
        // Or just map dx/dz to roll
        const bank = -dx * 0.1
        group.current.rotation.z += bank
    }

    // Wing Flap
    const flapSpeed = 10
    const flap = Math.sin(t * flapSpeed)

    // Wing Folding (upstroke pulls in, downstroke pushes out)
    const fold = Math.cos(t * flapSpeed) * 0.2 + 0.2

    if (wingL.current) {
        // Flap around Z (body axis is Z, wings extend X)
        // Group rotation is local.
        // Left wing: rotate Z up/down
        wingL.current.rotation.z = flap * 0.6 + 0.2
        // Forward/Back sweep
        wingL.current.rotation.y = fold * 0.5
    }
    if (wingR.current) {
        wingR.current.rotation.z = -flap * 0.6 - 0.2
        wingR.current.rotation.y = -fold * 0.5
    }

    // Tail Bob
    if (tailRef.current) {
        tailRef.current.rotation.x = -0.2 + Math.sin(t * 0.5) * 0.1 + flap * 0.05
        // Spread tail?
    }

    // Body bob
    if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * flapSpeed * 2) * 0.05
    }
  })

  // Materials
  const bodyFeather = (
      <FurMaterial
        uColor={new THREE.Color("#d02020")} // Scarlet
        uColorTip={new THREE.Color("#ff4040")}
        uScale={8.0}
        uFurLength={0.05} // Short fuzz
      />
  )

  // Feather Geometry (Shared)
  const featherGeo = useMemo(() => {
      const geo = new THREE.PlaneGeometry(0.3, 1.2, 4, 8)
      // Pivot at base (y=0 is center, so move up by 0.6)
      // Wait, plane is centered. y goes -0.6 to 0.6.
      // We want pivot at -0.6.
      geo.translate(0, 0.6, 0)
      return geo
  }, [])

  // Wing Setup
  // Primary Feathers (Blue)
  const primaries = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
      rotation: [0, 0, -1.0 - i * 0.15],
      position: [0.8 + i*0.1, 0, -i*0.1],
      scale: 1.0 + i * 0.1,
      color: new THREE.Color("#1e3d9e"),
      colorTip: new THREE.Color("#0066ff")
  })), [])

  // Secondary Feathers (Yellow/Green)
  const secondaries = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
      rotation: [0, 0, -0.5 - i * 0.1],
      position: [0.2 + i*0.15, 0.02, -i*0.05],
      scale: 0.8,
      color: new THREE.Color("#e6d412"),
      colorTip: new THREE.Color("#ffff00")
  })), [])

  // Coverts (Red)
  const coverts = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
      rotation: [0, 0, 0 - i * 0.1],
      position: [0.1 + i*0.1, 0.04, 0.1],
      scale: 0.5,
      color: new THREE.Color("#d02020"),
      colorTip: new THREE.Color("#ff4040")
  })), [])

  return (
    <group ref={group} position={position} scale={0.5}>
      {/* Body Group */}
      <group ref={bodyRef}>
          {/* Main Body - Deformed Sphere/Capsule blend */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.35, 0.9, 8, 16]} />
            {bodyFeather}
          </mesh>

          {/* Head */}
          <group position={[0, 0.2, 0.5]} rotation={[-0.2, 0, 0]}>
               <mesh castShadow>
                   <sphereGeometry args={[0.28, 16, 16]} />
                   {bodyFeather}
               </mesh>

               {/* Face Patch (White skin) - Sculpted */}
               <mesh position={[0, 0.02, 0.18]} rotation={[0.2, 0, 0]}>
                   <sphereGeometry args={[0.2, 16, 16]} />
                   <meshStandardMaterial color="#ffffff" roughness={0.9} />
               </mesh>

               {/* Beak - Curved Horn */}
               <group position={[0, 0, 0.28]} rotation={[0.5, 0, 0]}>
                    <mesh>
                        {/* Upper Beak */}
                        <coneGeometry args={[0.12, 0.35, 16]} />
                        <meshStandardMaterial color="#fdfdfd" roughness={0.4} />
                    </mesh>
                    <mesh position={[0, -0.15, 0.05]} rotation={[-0.5, 0, 0]}>
                         <coneGeometry args={[0.08, 0.15, 16]} />
                         <meshStandardMaterial color="#111" roughness={0.4} />
                    </mesh>
               </group>

                {/* Eyes */}
               <mesh position={[0.12, 0.05, 0.22]}>
                   <sphereGeometry args={[0.04, 8, 8]} />
                   <meshStandardMaterial color="#111" />
               </mesh>
               <mesh position={[-0.12, 0.05, 0.22]}>
                   <sphereGeometry args={[0.04, 8, 8]} />
                   <meshStandardMaterial color="#111" />
               </mesh>
          </group>

          {/* Tail Fan */}
          <group ref={tailRef} position={[0, -0.1, -0.5]} rotation={[-0.2, 0, 0]}>
              {/* Long Tail Feathers */}
              {[0, 1, 2].map(i => (
                  <mesh key={i} geometry={featherGeo} position={[0, 0, 0]} rotation={[-Math.PI/2, 0, (i-1)*0.1]} scale={[1, 1, 2.5 - Math.abs(i-1)*0.5]}>
                      <FeatherMaterial uColor={new THREE.Color("#d02020")} uColorTip={new THREE.Color("#1e3d9e")} uScale={2.0} />
                  </mesh>
              ))}
          </group>

          {/* Left Wing */}
          <group position={[0.2, 0.2, 0.2]} ref={wingL} rotation={[0, 0, -0.2]}>
               {/* Primaries */}
               {primaries.map((f, i) => (
                   <mesh key={`p-${i}`} geometry={featherGeo} position={f.position} rotation={[0, Math.PI/2, f.rotation[2]]} scale={f.scale}>
                       <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
                   </mesh>
               ))}
               {/* Secondaries */}
               {secondaries.map((f, i) => (
                   <mesh key={`s-${i}`} geometry={featherGeo} position={f.position} rotation={[0, Math.PI/2, f.rotation[2]]} scale={f.scale}>
                       <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
                   </mesh>
               ))}
               {/* Coverts */}
               {coverts.map((f, i) => (
                   <mesh key={`c-${i}`} geometry={featherGeo} position={f.position} rotation={[0, Math.PI/2, f.rotation[2]]} scale={f.scale}>
                       <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
                   </mesh>
               ))}
          </group>

          {/* Right Wing (Mirrored) */}
          <group position={[-0.2, 0.2, 0.2]} ref={wingR} rotation={[0, 0, 0.2]}>
               {/* Primaries */}
               {primaries.map((f, i) => (
                   <mesh key={`p-${i}`} geometry={featherGeo} position={[-f.position[0], f.position[1], f.position[2]]} rotation={[0, -Math.PI/2, -f.rotation[2]]} scale={f.scale}>
                       <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
                   </mesh>
               ))}
               {/* Secondaries */}
               {secondaries.map((f, i) => (
                   <mesh key={`s-${i}`} geometry={featherGeo} position={[-f.position[0], f.position[1], f.position[2]]} rotation={[0, -Math.PI/2, -f.rotation[2]]} scale={f.scale}>
                       <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
                   </mesh>
               ))}
               {/* Coverts */}
               {coverts.map((f, i) => (
                   <mesh key={`c-${i}`} geometry={featherGeo} position={[-f.position[0], f.position[1], f.position[2]]} rotation={[0, -Math.PI/2, -f.rotation[2]]} scale={f.scale}>
                       <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
                   </mesh>
               ))}
          </group>
      </group>
    </group>
  )
}

export default Macaw
