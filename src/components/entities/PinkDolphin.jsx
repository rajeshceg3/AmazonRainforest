import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DolphinSkinMaterial } from '../shaders/DolphinSkinMaterial'
import { pseudoNoise } from '../../utils/OrganicMath'
import OrganicMesh from './OrganicMesh'

const PinkDolphin = ({ position = [0, -2, 0] }) => {
  const group = useRef()
  const bodyRef = useRef()

  // Fins
  const finL = useRef()
  const finR = useRef()
  const dorsalFin = useRef()
  const flukes = useRef()

  // Radius Function (Snout to Tail)
  const bodyRadius = useMemo(() => (t) => {
    // t=0 (Snout Tip) -> t=1 (Tail Tip)
    // Snout
    if (t < 0.1) return THREE.MathUtils.lerp(0.04, 0.15, t / 0.1)
    // Head/Melon
    if (t < 0.25) return THREE.MathUtils.lerp(0.15, 0.3, (t - 0.1) / 0.15)
    // Body (Thick)
    if (t < 0.5) return THREE.MathUtils.lerp(0.3, 0.38, (t - 0.25) / 0.25)
    // Taper
    if (t < 0.8) return THREE.MathUtils.lerp(0.38, 0.15, (t - 0.5) / 0.3)
    // Tail Stock
    return THREE.MathUtils.lerp(0.15, 0.05, (t - 0.8) / 0.2)
  }, [])

  const skinMaterial = useMemo(() => (
      <DolphinSkinMaterial
        uColorBase={new THREE.Color("#eecbcb")}
        uColorPatch={new THREE.Color("#998888")}
        uScale={3.0}
      />
  ), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Swimming Movement
    const speedNoise = pseudoNoise(t * 0.4, 123)
    const swimSpeed = 2.0 + speedNoise * 1.5
    const moveSpeed = 0.2 + speedNoise * 0.1

    // Path Logic (Circle)
    if (group.current) {
        const r = 12 + pseudoNoise(t * 0.15, 0) * 4.0
        const angle = t * moveSpeed + pseudoNoise(t * 0.1, 50) * 0.5
        const x = position[0] + Math.sin(angle) * r
        const z = position[2] + Math.cos(angle) * r
        const y = position[1] + Math.sin(t * 0.8) * 0.3 + pseudoNoise(t * 0.5, 99) * 0.5

        const currentPos = group.current.position
        const targetPos = new THREE.Vector3(x, y, z)
        const dir = targetPos.clone().sub(currentPos).normalize()

        group.current.position.copy(targetPos)

        // Look At
        const lookTarget = currentPos.clone().add(dir)
        group.current.lookAt(lookTarget)

        // Banking
        const roll = pseudoNoise(t * 0.5, 20) * 0.8
        group.current.rotation.z += roll
    }

    // Undulation (Body Bones)
    if (bodyRef.current && bodyRef.current.bones) {
        const bones = bodyRef.current.bones
        // Bones: 0=Snout, ..., N=Tail
        // Rotate around X (Up/Down) for swimming
        // Wave propagation

        // Head (Bone 0, 1) relatively stable
        bones[0].rotation.x = Math.sin(t * swimSpeed) * 0.05

        for (let i=2; i<bones.length; i++) {
            // Increasing amplitude towards tail
            const amp = 0.05 + (i / bones.length) * 0.15
            // Phase shift
            const phase = i * 0.5
            bones[i].rotation.x = Math.sin(t * swimSpeed - phase) * amp
        }
    }

    // Fins Flap
    if (finL.current) finL.current.rotation.z = 0.5 + Math.sin(t * swimSpeed) * 0.1
    if (finR.current) finR.current.rotation.z = -0.5 - Math.sin(t * swimSpeed) * 0.1
  })

  // Attachments
  useEffect(() => {
     if (bodyRef.current && bodyRef.current.bones) {
         // Attach Pectoral Fins to Bone 2 (Shoulder area)
         if (finL.current) bodyRef.current.bones[2].add(finL.current)
         if (finR.current) bodyRef.current.bones[2].add(finR.current)

         // Attach Dorsal Fin to Bone 4 (Mid Back)
         if (dorsalFin.current) bodyRef.current.bones[4].add(dorsalFin.current)

         // Attach Flukes to Last Bone
         const lastBone = bodyRef.current.bones[bodyRef.current.bones.length - 1]
         if (flukes.current) lastBone.add(flukes.current)
     }
  }, [])

  return (
    <group ref={group} position={position}>
        {/* BODY (Snout to Tail) - Points Back (+Z) or Forward (-Z)? */}
        {/* OrganicMesh is +Y (0 to L). */}
        {/* Dolphin swims forward. If we align +Y to -Z (Forward), Snout is at -Z. */}
        {/* But usually Head is at origin or front. */}
        {/* Let's align +Y to +Z (Backwards). So Snout at 0, Tail at +L. */}
        {/* Rotate X -90. Y -> +Z. */}
        <OrganicMesh
            ref={bodyRef}
            length={2.2}
            segments={8}
            radiusFunction={bodyRadius}
            rotation={[-Math.PI/2, 0, 0]}
            castShadow receiveShadow
        >
            {skinMaterial}
        </OrganicMesh>

        {/* Fins (Simple geometry for now, parented to bones) */}

        {/* Pectoral Left */}
        <group ref={finL} position={[0.35, 0, 0]} rotation={[0, 0.5, 0.5]}>
             <mesh scale={[1.0, 0.15, 0.5]} position={[0.4, 0, 0]} castShadow receiveShadow>
                 <sphereGeometry args={[0.4, 32, 32]} />
                 {skinMaterial}
             </mesh>
        </group>

        {/* Pectoral Right */}
        <group ref={finR} position={[-0.35, 0, 0]} rotation={[0, -0.5, -0.5]}>
             <mesh scale={[1.0, 0.15, 0.5]} position={[-0.4, 0, 0]} castShadow receiveShadow>
                 <sphereGeometry args={[0.4, 32, 32]} />
                 {skinMaterial}
             </mesh>
        </group>

        {/* Dorsal Fin */}
        <group ref={dorsalFin} position={[0, 0.3, 0]} rotation={[0.2, 0, 0]}>
             <mesh scale={[0.1, 0.6, 0.8]} position={[0, 0.3, 0]} castShadow receiveShadow>
                 <sphereGeometry args={[0.3, 32, 32]} />
                 {skinMaterial}
             </mesh>
        </group>

        {/* Flukes (Tail Fin) */}
        {/* Attached to Last Bone. Last Bone is at tip. */}
        {/* Flukes should be horizontal. */}
        <group ref={flukes} position={[0, 0, 0]} rotation={[0, 0, 0]}>
             <group rotation={[Math.PI/2, 0, 0]}> {/* Flat horizontally */}
                  <mesh position={[0.4, 0, 0]} rotation={[0, 0, -0.3]} scale={[1.2, 0.1, 0.6]} castShadow receiveShadow>
                       <sphereGeometry args={[0.35, 32, 32]} />
                       {skinMaterial}
                  </mesh>
                  <mesh position={[-0.4, 0, 0]} rotation={[0, 0, 0.3]} scale={[1.2, 0.1, 0.6]} castShadow receiveShadow>
                       <sphereGeometry args={[0.35, 32, 32]} />
                       {skinMaterial}
                  </mesh>
             </group>
        </group>

    </group>
  )
}

export default PinkDolphin
