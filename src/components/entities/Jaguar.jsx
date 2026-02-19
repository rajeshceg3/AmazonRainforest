import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { JaguarFurMaterial } from '../shaders/JaguarFurMaterial'
import { pseudoNoise, mix } from '../../utils/OrganicMath'
import OrganicMesh from './OrganicMesh'

const Jaguar = ({ position = [0, 0, 0] }) => {
  const group = useRef()
  const bodyRef = useRef()
  const tailRef = useRef()

  // Legs Refs
  const legFL = useRef()
  const legFR = useRef()
  const legBL = useRef()
  const legBR = useRef()

  // State
  const behaviorState = useRef({
    isIdle: false,
    nextTransition: 5.0,
    headTargetX: 0,
    headTargetY: 0,
    seed: Math.random() * 100,
    animTime: 0
  })

  // Radius Functions
  const bodyRadius = useMemo(() => (t) => {
    // t=0 (Hips) -> t=1 (Head)
    if (t < 0.2) return THREE.MathUtils.lerp(0.28, 0.25, t / 0.2) // Hips to Waist
    if (t < 0.5) return THREE.MathUtils.lerp(0.25, 0.35, (t - 0.2) / 0.3) // Waist to Chest
    if (t < 0.7) return THREE.MathUtils.lerp(0.35, 0.25, (t - 0.5) / 0.2) // Chest to Neck Base
    if (t < 0.85) return THREE.MathUtils.lerp(0.25, 0.18, (t - 0.7) / 0.15) // Neck
    return THREE.MathUtils.lerp(0.18, 0.22, (t - 0.85) / 0.15) // Head
  }, [])

  const tailRadius = useMemo(() => (t) => {
    // t=0 (Base) -> t=1 (Tip)
    return THREE.MathUtils.lerp(0.1, 0.03, t)
  }, [])

  // Legs Geometry (Simple Cylinders/Capsules for now, attached to bones later?)
  // For "Ultrathink", let's use OrganicMesh for legs too?
  // Maybe overkill for now, let's stick to Body+Tail smoothing first.
  // We can attach simple meshes for legs to the body bones.

  // Material
  const furMaterial = useMemo(() => (
    <JaguarFurMaterial
      uScale={6.0}
      uColor={new THREE.Color("#d49b5c")}
      uSpotColor={new THREE.Color("#2b1d0e")}
    />
  ), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { seed } = behaviorState.current

    // Logic updates
    if (t > behaviorState.current.nextTransition) {
      behaviorState.current.isIdle = !behaviorState.current.isIdle
      const duration = behaviorState.current.isIdle ? 2 + Math.random() * 3 : 5 + Math.random() * 5
      behaviorState.current.nextTransition = t + duration
      if (behaviorState.current.isIdle) {
         behaviorState.current.headTargetY = (Math.random() - 0.5) * 1.0
         behaviorState.current.headTargetX = (Math.random() - 0.5) * 0.5
      }
    }

    if (!behaviorState.current.isIdle) {
        behaviorState.current.animTime += 0.016 * 2.0
    }
    const aT = behaviorState.current.animTime

    // ANIMATION

    // BODY (Spine)
    if (bodyRef.current && bodyRef.current.bones) {
        const bones = bodyRef.current.bones
        // Bones: 0=Hips, 1=Waist, 2=Mid, 3=Chest, 4=Neck, 5=Head

        const spineNoise = pseudoNoise(aT, seed) * 0.1

        // Hips (Root) - Bobbing
        const bob = Math.abs(Math.sin(aT)) * 0.05
        bones[0].position.y = (behaviorState.current.isIdle ? 0 : bob) // Local Y is along the spine? No.
        // Wait, bones[0].position is relative to Mesh.
        // Mesh is rotated.
        // If I move bones[0] in Y, it moves along the mesh Y axis (which is -Z world).
        // I want Vertical bobbing (World Y).
        // Since Mesh is rotated X 90, Mesh Z is World -Y?
        // Local Z is World Y.
        bones[0].position.z = (behaviorState.current.isIdle ? 0 : -bob) // Move down?
        // Actually simpler: Move the whole group for bobbing.

        // Spine Rotation (Y axis in local space = Left/Right sway)
        // Since Cylinder is along Y, rotation around Y is Twist.
        // Rotation around X is Pitch (Up/Down).
        // Rotation around Z is Yaw (Side/Side).

        // Waist
        bones[1].rotation.z = spineNoise * 0.5
        // Mid
        bones[2].rotation.z = pseudoNoise(aT - 0.5, seed) * 0.1
        // Chest
        bones[3].rotation.z = pseudoNoise(aT - 1.0, seed) * 0.1

        // Neck (Counter rotate)
        bones[4].rotation.z = -spineNoise * 0.8

        // Head Look
        let headY = -spineNoise * 0.5
        let headX = 0
        if (behaviorState.current.isIdle) {
           headY = mix(headY, behaviorState.current.headTargetY, 0.1)
           headX = mix(headX, behaviorState.current.headTargetX, 0.1)
        }
        // Apply to Head Bone (Rotation Z is side-to-side, Rotation X is Up/Down)
        // Note: Bones local coords. Y is along bone. X/Z are perpendicular.
        bones[5].rotation.z = THREE.MathUtils.lerp(bones[5].rotation.z, headY, 0.1)
        bones[5].rotation.x = -0.4 + headX // Look down slightly
    }

    // TAIL
    if (tailRef.current && tailRef.current.bones) {
        const bones = tailRef.current.bones
        // Wave
        const tailSway = pseudoNoise(t * 0.8, seed + 20) * 0.3
        const tailWhip = pseudoNoise(t * 3.0, seed + 25) * 0.1

        // Rotate base
        bones[0].rotation.z = tailSway
        // Propagate wave
        for (let i=1; i<bones.length; i++) {
             bones[i].rotation.z = Math.sin(t * 5.0 - i * 0.5) * 0.1 + tailWhip * 0.5
        }
    }

    // LEGS
    const legAmp = behaviorState.current.isIdle ? 0 : 0.6
    if (legFL.current) legFL.current.rotation.x = Math.sin(aT) * legAmp
    if (legBR.current) legBR.current.rotation.x = Math.sin(aT) * legAmp
    if (legFR.current) legFR.current.rotation.x = Math.sin(aT + Math.PI) * legAmp
    if (legBL.current) legBL.current.rotation.x = Math.sin(aT + Math.PI) * legAmp

    // Bobbing Group
    if (group.current) {
        const bob = Math.abs(Math.sin(aT)) * 0.05
        group.current.position.y = position[1] + (behaviorState.current.isIdle ? 0 : bob) + 0.6 // Height offset
    }
  })

  // Attachments
  // Use `useEffect` to attach Tail and Legs to Body Bones
  useEffect(() => {
     if (bodyRef.current && bodyRef.current.bones && tailRef.current) {
         // Attach Tail to Hips (Bone 0)
         // Note: OrganicMesh exposes `mesh` as well.
         // We can parent the Tail Mesh to the Hip Bone.
         bodyRef.current.bones[0].add(tailRef.current.mesh)
     }

     if (bodyRef.current && bodyRef.current.bones) {
         // Attach Legs
         // Front Legs -> Chest (Bone 3)
         if (legFL.current) bodyRef.current.bones[3].add(legFL.current)
         if (legFR.current) bodyRef.current.bones[3].add(legFR.current)

         // Back Legs -> Hips (Bone 0)
         if (legBL.current) bodyRef.current.bones[0].add(legBL.current)
         if (legBR.current) bodyRef.current.bones[0].add(legBR.current)
     }
  }, [])

  return (
    <group ref={group} position={position}>
        {/* BODY (Hips to Head) - Points Forward (-Z) */}
        <OrganicMesh
            ref={bodyRef}
            length={1.5}
            segments={6}
            radiusFunction={bodyRadius}
            rotation={[Math.PI/2, 0, 0]} // Y becomes -Z
            castShadow receiveShadow
        >
            {furMaterial}
        </OrganicMesh>

        {/* TAIL (Base to Tip) - Points Back (+Z) */}
        {/* Initially at 0,0,0. Will be attached to Hip Bone. */}
        {/* Hip Bone is at 0,0,0 local to Body. */}
        {/* We want Tail to point +Z (Backwards relative to body? No, body points -Z. Back is +Z) */}
        <OrganicMesh
            ref={tailRef}
            length={1.2}
            segments={8}
            radiusFunction={tailRadius}
            rotation={[-Math.PI, 0, 0]} // Y becomes -Y (Down)? No.
            // Body is Rot X 90. Y -> -Z.
            // Tail should be opposite. Y -> +Z.
            // Rot X -90.
            // Wait, if attached to Hip Bone (which is rotated with body),
            // The local space of Hip Bone aligns with Body Mesh?
            // Yes.
            // So +Y in Bone space is -Z world.
            // We want Tail to go +Z world.
            // So we need Tail to point -Y in Bone Space.
            // OrganicMesh goes +Y.
            // So rotate Tail Mesh by PI around X? (Flip Y).
            // Yes.
            rotation={[Math.PI, 0, 0]}
            castShadow receiveShadow
        >
            {furMaterial}
        </OrganicMesh>

        {/* LEGS (Simple Placeholders for now, but smoothed) */}
        {/* We use simple meshes but parented to bones so they move naturally */}
        {/* Front Left */}
        <group ref={legFL} position={[0.2, 0, 0]}>
             {/* Offset from Chest Bone center */}
             {/* Note: In Bone Space (Y is Forward). X is Right. Z is Up? */}
             {/* Rot X 90. Y->-Z (Forward). Z->Y (Up). X->X (Right). */}
             {/* So pos [0.2, 0, 0] is Right 0.2. Correct. */}

             {/* Leg Geometry - Cylinder pointing Down (World -Y, Bone -Z) */}
             <mesh position={[0, 0, -0.3]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
                 <cylinderGeometry args={[0.08, 0.06, 0.6, 12]} />
                 {furMaterial}
             </mesh>
             {/* Paw */}
             <mesh position={[0, 0, -0.65]} castShadow receiveShadow>
                 <sphereGeometry args={[0.07, 12, 12]} />
                 {furMaterial}
             </mesh>
        </group>

         <group ref={legFR} position={[-0.2, 0, 0]}>
             <mesh position={[0, 0, -0.3]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
                 <cylinderGeometry args={[0.08, 0.06, 0.6, 12]} />
                 {furMaterial}
             </mesh>
             <mesh position={[0, 0, -0.65]} castShadow receiveShadow>
                 <sphereGeometry args={[0.07, 12, 12]} />
                 {furMaterial}
             </mesh>
        </group>

         <group ref={legBL} position={[0.2, 0, 0]}>
             <mesh position={[0, 0, -0.3]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
                 <cylinderGeometry args={[0.1, 0.07, 0.6, 12]} />
                 {furMaterial}
             </mesh>
             <mesh position={[0, 0, -0.65]} castShadow receiveShadow>
                 <sphereGeometry args={[0.07, 12, 12]} />
                 {furMaterial}
             </mesh>
        </group>

         <group ref={legBR} position={[-0.2, 0, 0]}>
             <mesh position={[0, 0, -0.3]} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
                 <cylinderGeometry args={[0.1, 0.07, 0.6, 12]} />
                 {furMaterial}
             </mesh>
             <mesh position={[0, 0, -0.65]} castShadow receiveShadow>
                 <sphereGeometry args={[0.07, 12, 12]} />
                 {furMaterial}
             </mesh>
        </group>

    </group>
  )
}

export default Jaguar
