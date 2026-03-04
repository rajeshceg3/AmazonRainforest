import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FeatherMaterial } from '../shaders/FeatherMaterial'
import { FurMaterial } from '../shaders/FurMaterial'
import OrganicMesh from './OrganicMesh'
import DiscoveryText from '../UI/DiscoveryText'

const _targetPos = new THREE.Vector3()

const Macaw = ({ position = [0, 15, 0] }) => {
  const group = useRef()
  const bodyRef = useRef()
  const headGroup = useRef()
  const wingL = useRef()
  const wingR = useRef()
  const tailRef = useRef()

  // Animation State
  const timeOffset = useMemo(() => Math.random() * 100, [])

  // Radius Function (Base=Hips, Top=Head)
  const bodyRadius = useMemo(() => (t) => {
    // t=0 (Hips) -> t=1 (Head)
    if (t < 0.2) return THREE.MathUtils.lerp(0.18, 0.22, t / 0.2) // Hips -> Belly
    if (t < 0.5) return THREE.MathUtils.lerp(0.22, 0.24, (t - 0.2) / 0.3) // Belly -> Chest
    if (t < 0.8) return THREE.MathUtils.lerp(0.24, 0.12, (t - 0.5) / 0.3) // Chest -> Neck
    return THREE.MathUtils.lerp(0.12, 0.15, (t - 0.8) / 0.2) // Neck -> Head
  }, [])

  const bodyMaterial = useMemo(() => (
      <FurMaterial
        uColor={new THREE.Color("#d02020")}
        uColorTip={new THREE.Color("#ff4040")}
        uScale={8.0}
        uFurLength={0.05}
      />
  ), [])

  // Feather Geometry
  const featherGeo = useMemo(() => {
      const geo = new THREE.PlaneGeometry(0.3, 1.2, 4, 8)
      geo.translate(0, 0.6, 0)
      return geo
  }, [])

  // Wing Setup
  const primaries = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
      rotation: [0, 0, -1.0 - i * 0.15],
      position: [0.8 + i*0.1, 0, -i*0.1],
      scale: 1.0 + i * 0.1,
      color: new THREE.Color("#1e3d9e"),
      colorTip: new THREE.Color("#0066ff")
  })), [])

  const secondaries = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
      rotation: [0, 0, -0.5 - i * 0.1],
      position: [0.2 + i*0.15, 0.02, -i*0.05],
      scale: 0.8,
      color: new THREE.Color("#e6d412"),
      colorTip: new THREE.Color("#ffff00")
  })), [])

  const coverts = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
      rotation: [0, 0, 0 - i * 0.1],
      position: [0.1 + i*0.1, 0.04, 0.1],
      scale: 0.5,
      color: new THREE.Color("#d02020"),
      colorTip: new THREE.Color("#ff4040")
  })), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + timeOffset

    // Flight Path
    if (group.current) {
        const x = position[0] + Math.sin(t * 0.5) * 12
        const z = position[2] + Math.cos(t * 0.3) * 8
        const y = position[1] + Math.cos(t * 0.8) * 2

        const nextX = position[0] + Math.sin((t + 0.1) * 0.5) * 12
        const nextZ = position[2] + Math.cos((t + 0.1) * 0.3) * 8
        const nextY = position[1] + Math.cos((t + 0.1) * 0.8) * 2

        _targetPos.set(nextX, nextY, nextZ)

        group.current.position.set(x, y, z)
        group.current.lookAt(_targetPos)

        // Banking
        const dx = nextX - x
        const bank = -dx * 0.1
        group.current.rotation.z += bank
    }

    // Wing Flap
    const flapSpeed = 10
    const flap = Math.sin(t * flapSpeed)
    const fold = Math.cos(t * flapSpeed) * 0.2 + 0.2

    if (wingL.current) {
        wingL.current.rotation.z = flap * 0.6 + 0.2
        wingL.current.rotation.y = fold * 0.5
    }
    if (wingR.current) {
        wingR.current.rotation.z = -flap * 0.6 - 0.2
        wingR.current.rotation.y = -fold * 0.5
    }

    // Tail Bob
    if (tailRef.current) {
        tailRef.current.rotation.x = -0.2 + Math.sin(t * 0.5) * 0.1 + flap * 0.05
    }

    // Body Animation
    if (bodyRef.current && bodyRef.current.bones) {
        const bones = bodyRef.current.bones
        // Bones 0..5 (Hips..Head)
        // Undulate slightly
        const spineWave = Math.sin(t * 2.0) * 0.05
        bones[2].rotation.z = spineWave // Chest sway
        bones[4].rotation.z = -spineWave * 1.5 // Neck counteract

        // Head Look
        bones[5].rotation.x = -0.2 + Math.sin(t * 1.5) * 0.1 // Look down/up
        bones[5].rotation.z = Math.cos(t * 1.0) * 0.2 // Look side/side
    }
  })

  // Discovery UI State
  const [isHovered, setIsHovered] = useState(false)
  const [showText, setShowText] = useState(false)
  const hoverTimer = useRef(null)

  useEffect(() => {
    if (isHovered) {
      hoverTimer.current = setTimeout(() => {
        setShowText(true)
      }, 2000) // 2 seconds of focus required
    } else {
      clearTimeout(hoverTimer.current)
      setShowText(false)
    }
    return () => clearTimeout(hoverTimer.current)
  }, [isHovered])

  // Attachments
  useEffect(() => {
     if (bodyRef.current && bodyRef.current.bones) {
         const bones = bodyRef.current.bones

         // Attach Wings to Chest (Bone 3)
         const chestBone = bones[3]
         if (wingL.current) chestBone.add(wingL.current)
         if (wingR.current) chestBone.add(wingR.current)

         // Attach Tail to Hips (Bone 0)
         if (tailRef.current) bones[0].add(tailRef.current)

         // Attach Head Group to Head Bone (Last bone)
         const headBone = bones[bones.length - 1]
         if (headGroup.current) headBone.add(headGroup.current)
     }
  }, [])

  return (
    <group
      ref={group}
      position={position}
      scale={0.5}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true) }}
      onPointerOut={() => setIsHovered(false)}
    >
      <group position={[0, 1.5, 0]}>
        <DiscoveryText
          text="Ara macao"
          subtext="Scarlet Macaw"
          show={showText}
        />
      </group>

      {/* Body: Base=Hips (Back), Top=Head (Front) */}
      <OrganicMesh
          ref={bodyRef}
          length={0.9}
          segments={6}
          radiusFunction={bodyRadius}
          rotation={[Math.PI/2, 0, 0]}
          castShadow receiveShadow
      >
          {bodyMaterial}
      </OrganicMesh>

      {/* Head Details */}
      <group ref={headGroup} position={[0, 0, 0]}>
            {/* Position relative to bone origin. Bone goes +Y (approx 0.15 length) */}
            {/* We want beak at Tip (0.15) */}
            <group position={[0, 0.1, 0.05]} rotation={[0.5, 0, 0]}>
               {/* Beak */}
               <mesh castShadow receiveShadow>
                   <coneGeometry args={[0.12, 0.35, 16]} />
                   <meshStandardMaterial color="#fdfdfd" roughness={0.4} />
               </mesh>
               {/* Lower Beak */}
               <mesh position={[0, -0.15, 0.05]} rotation={[-0.5, 0, 0]} castShadow receiveShadow>
                    <coneGeometry args={[0.08, 0.15, 16]} />
                    <meshStandardMaterial color="#111" roughness={0.4} />
               </mesh>
            </group>
            {/* Eyes */}
            <mesh position={[0.12, 0.08, 0.05]}>
                 <sphereGeometry args={[0.04, 8, 8]} />
                 <meshStandardMaterial color="#111" />
             </mesh>
             <mesh position={[-0.12, 0.08, 0.05]}>
                 <sphereGeometry args={[0.04, 8, 8]} />
                 <meshStandardMaterial color="#111" />
             </mesh>
      </group>

      {/* Left Wing */}
      <group position={[0.2, 0.2, 0.2]} ref={wingL} rotation={[0, 0, -0.2]}>
           {primaries.map((f, i) => (
               <mesh key={`p-${i}`} geometry={featherGeo} position={f.position} rotation={[0, Math.PI/2, f.rotation[2]]} scale={f.scale} castShadow receiveShadow>
                   <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
               </mesh>
           ))}
           {secondaries.map((f, i) => (
               <mesh key={`s-${i}`} geometry={featherGeo} position={f.position} rotation={[0, Math.PI/2, f.rotation[2]]} scale={f.scale} castShadow receiveShadow>
                   <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
               </mesh>
           ))}
           {coverts.map((f, i) => (
               <mesh key={`c-${i}`} geometry={featherGeo} position={f.position} rotation={[0, Math.PI/2, f.rotation[2]]} scale={f.scale} castShadow receiveShadow>
                   <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
               </mesh>
           ))}
      </group>

      {/* Right Wing */}
      <group position={[-0.2, 0.2, 0.2]} ref={wingR} rotation={[0, 0, 0.2]}>
           {primaries.map((f, i) => (
               <mesh key={`p-${i}`} geometry={featherGeo} position={[-f.position[0], f.position[1], f.position[2]]} rotation={[0, -Math.PI/2, -f.rotation[2]]} scale={f.scale} castShadow receiveShadow>
                   <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
               </mesh>
           ))}
           {secondaries.map((f, i) => (
               <mesh key={`s-${i}`} geometry={featherGeo} position={[-f.position[0], f.position[1], f.position[2]]} rotation={[0, -Math.PI/2, -f.rotation[2]]} scale={f.scale} castShadow receiveShadow>
                   <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
               </mesh>
           ))}
           {coverts.map((f, i) => (
               <mesh key={`c-${i}`} geometry={featherGeo} position={[-f.position[0], f.position[1], f.position[2]]} rotation={[0, -Math.PI/2, -f.rotation[2]]} scale={f.scale} castShadow receiveShadow>
                   <FeatherMaterial uColor={f.color} uColorTip={f.colorTip} />
               </mesh>
           ))}
      </group>

      {/* Tail Fan */}
      <group ref={tailRef} position={[0, -0.1, 0.1]} rotation={[-0.2, 0, 0]}>
          {[0, 1, 2].map(i => (
              <mesh key={i} geometry={featherGeo} position={[0, 0, 0]} rotation={[-Math.PI/2, 0, (i-1)*0.1]} scale={[1, 1, 2.5 - Math.abs(i-1)*0.5]} castShadow receiveShadow>
                  <FeatherMaterial uColor={new THREE.Color("#d02020")} uColorTip={new THREE.Color("#1e3d9e")} uScale={2.0} />
              </mesh>
          ))}
      </group>

    </group>
  )
}

export default Macaw
