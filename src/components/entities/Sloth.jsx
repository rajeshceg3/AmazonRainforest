import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FurMaterial } from '../shaders/FurMaterial'
import { pseudoNoise } from '../../utils/OrganicMath'

const Sloth = ({ position = [0, 10, 0] }) => {
  const group = useRef()
  const headRef = useRef()
  const armL = useRef()
  const armR = useRef()
  const legL = useRef()
  const legR = useRef()

  // Random offset for organic noise
  const offset = useMemo(() => Math.random() * 100, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + offset

    // Organic Sway (Hanging behavior)
    // Use pseudoNoise for non-repetitive motion
    if (group.current) {
      const sway = pseudoNoise(t * 0.5) * 0.2 // Slow sway
      const bob = pseudoNoise(t * 0.8 + 10) * 0.05

      group.current.rotation.z = Math.PI + sway
      group.current.rotation.x = bob
    }

    // Head Look (Lazy scanning)
    if (headRef.current) {
      const lookYaw = pseudoNoise(t * 0.3) * 0.5
      const lookPitch = 0.4 + pseudoNoise(t * 0.4 + 20) * 0.1

      // Smooth interpolation would be better, but noise is continuous
      headRef.current.rotation.y = lookYaw
      headRef.current.rotation.x = lookPitch
    }
  })

  const furMaterial = (
      <FurMaterial
        uColor={new THREE.Color("#6d5e52")}
        uColorTip={new THREE.Color("#8c7b6c")} // Lighter tip
        uScale={4.0}
        uFurLength={0.15}
      />
  )

  const faceMaterial = (
       <meshStandardMaterial color="#e0d6c8" roughness={0.9} />
  )

  const clawGeometry = useMemo(() => {
      // Merged claws for efficiency
      const geo = new THREE.BufferGeometry()
      const cone = new THREE.ConeGeometry(0.04, 0.25, 8)
      cone.translate(0, 0.1, 0)
      cone.rotateX(0.2)

      // 3 Claws
      const c1 = cone.clone().translate(0, 0, 0)
      const c2 = cone.clone().rotateZ(-0.2).translate(0.05, -0.01, 0)
      const c3 = cone.clone().rotateZ(0.2).translate(-0.05, -0.01, 0)

      // Merge logic (simplified manual merge of arrays or just group)
      // Since it's small, let's just return a group in render or geometry?
      // Geometry merge is annoying without utils.
      // Let's stick to group in render for claws, it's fine.
      return null
  }, [])

  const ClawGroup = () => (
      <group rotation={[0.5, 0, 0]} position={[0, 0.9, 0]}>
          <mesh position={[0, 0.1, 0]} rotation={[0.2, 0, 0]}>
            <coneGeometry args={[0.04, 0.25, 8]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
          <mesh position={[0.05, 0.08, 0]} rotation={[0.2, 0, -0.2]}>
            <coneGeometry args={[0.03, 0.2, 8]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
           <mesh position={[-0.05, 0.08, 0]} rotation={[0.2, 0, 0.2]}>
            <coneGeometry args={[0.03, 0.2, 8]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
      </group>
  )

  // Sculpted Body Geometry
  const bodyGeo = useMemo(() => {
      const geo = new THREE.CapsuleGeometry(0.45, 0.9, 8, 16)
      // Deform to be pear shaped (wider hips)
      const pos = geo.attributes.position
      const v = new THREE.Vector3()
      for(let i=0; i<pos.count; i++){
          v.fromBufferAttribute(pos, i)
          // y is -0.9 to 0.9 (approx)
          // Hips at -0.5, Shoulders at 0.5

          if (v.y < 0) {
              // Widen hips
              v.x *= 1.2
              v.z *= 1.2
          } else {
              // Narrow shoulders
              v.x *= 0.9
              v.z *= 0.9
          }
          pos.setXYZ(i, v.x, v.y, v.z)
      }
      return geo
  }, [])

  return (
    <group ref={group} position={position} rotation={[0, 0, Math.PI]}> {/* Hanging upside down */}
      {/* Body */}
      <mesh geometry={bodyGeo} castShadow>
        {furMaterial}
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0.4, -0.5, 0.2]} rotation={[0.4, 0, 0]}>
        {/* Main Head Fur */}
        <mesh castShadow>
           <sphereGeometry args={[0.32, 16, 16]} />
           {furMaterial}
        </mesh>

        {/* Face Mask - Integrated Mesh */}
        {/* Use a sphere section that sits slightly on top */}
        <mesh position={[0, 0.05, 0.15]} rotation={[-0.2, 0, 0]}>
             {/* Flattened, curved patch */}
             <sphereGeometry args={[0.26, 32, 32, 0, Math.PI * 2, 0, 1.0]} />
             {/* Scale it to fit face curve */}
             {faceMaterial}
        </mesh>

        {/* Snout/Nose */}
         <mesh position={[0, -0.05, 0.32]} scale={[1, 0.8, 1]}>
             <sphereGeometry args={[0.08, 16, 16]} />
             <meshStandardMaterial color="#222" roughness={0.5} />
         </mesh>

         {/* Eyes (Dark Patches + Eye) */}
         <group position={[0, 0.08, 0.28]}>
             <mesh position={[0.1, 0, 0]} rotation={[0, 0.2, 0]}>
                 <sphereGeometry args={[0.035, 16, 16]} />
                 <meshStandardMaterial color="#111" roughness={0.1} />
             </mesh>
             <mesh position={[-0.1, 0, 0]} rotation={[0, -0.2, 0]}>
                 <sphereGeometry args={[0.035, 16, 16]} />
                 <meshStandardMaterial color="#111" roughness={0.1} />
             </mesh>
         </group>
      </group>

      {/* Limbs (Curved to hold branch) */}
      {/* Arms */}
      {[1, -1].map((side, i) => (
          <group key={i} position={[side * 0.3, 0.2, side * 0.3]} rotation={[0, 0, -side * 0.5]} ref={side===1 ? armL : armR}>
              <mesh position={[0, 0.4, 0]}>
                 <capsuleGeometry args={[0.12, 0.9, 4, 8]} />
                 {furMaterial}
              </mesh>
              <ClawGroup />
          </group>
      ))}

      {/* Legs */}
      {[1, -1].map((side, i) => (
          <group key={i+2} position={[side * -0.3, 0.2, side * 0.3]} rotation={[0, 0, side * 0.5]} ref={side===1 ? legL : legR}>
              <mesh position={[0, 0.4, 0]}>
                 <capsuleGeometry args={[0.12, 0.9, 4, 8]} />
                 {furMaterial}
              </mesh>
              <ClawGroup />
          </group>
      ))}
    </group>
  )
}

export default Sloth
