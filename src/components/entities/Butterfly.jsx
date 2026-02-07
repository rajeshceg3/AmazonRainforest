import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Butterfly = ({ position = [0, 0, 0] }) => {
  const group = useRef()
  const wingL = useRef()
  const wingR = useRef()

  const wingGeo = useMemo(() => {
      const geo = new THREE.CircleGeometry(0.15, 32)
      // Shift so pivot is at edge (0,0) instead of center
      // Circle is in XY plane.
      geo.translate(0.15, 0, 0)
      return geo
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Flutter logic
    const flutterSpeed = 20
    const flutterAmp = 0.8
    const flutter = Math.sin(time * flutterSpeed) * flutterAmp // Full range flap

    if (wingL.current) {
        // Flap around hinge (Local Y axis which is aligned with body Z)
        wingL.current.rotation.y = flutter
    }
    if (wingR.current) {
        // Mirrored wing via scale X=-1
        // +Y rotation moves tip up for both due to scale flipping X?
        // Let's verify: +Y rotation -> Tip moves to +Z (local).
        // Since Mesh is rotated X 90, Local Z is World -Y.
        // So +Y rotation -> Tip moves to World -Y (Down).
        // So flutter should be negative?
        // Wait, let's just use same sign and adjust flutter math if inverted.
        wingR.current.rotation.y = flutter
    }

    // Path Movement
    if (group.current) {
        // Figure 8 / organic path
        const t = time * 0.5
        const x = position[0] + Math.sin(t) * 1.5
        const y = position[1] + Math.cos(t * 1.3) * 0.5
        const z = position[2] + Math.sin(t * 0.7) * 1.0

        group.current.position.set(x, y, z)

        // Orientation - roughly face movement direction
        const dx = Math.cos(t) * 1.5
        const dz = Math.cos(t * 0.7) * 1.0
        const targetRotY = Math.atan2(dx, dz)

        // Smooth rotation
        group.current.rotation.y = targetRotY

        // Add some pitch based on vertical movement
        const dy = -Math.sin(t * 1.3) * 0.5
        group.current.rotation.x = -dy * 0.5
    }
  })

  return (
    <group ref={group} position={position}>
        {/* Body - Horizontal along Z */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
            <capsuleGeometry args={[0.02, 0.2, 4, 8]} />
            <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>

        {/* Left Wing - Rotated X 90 to align hinge (Y) with Body (Z) */}
        <mesh ref={wingL} geometry={wingGeo} position={[0.02, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
             <meshStandardMaterial color="#4fc3f7" side={THREE.DoubleSide} transparent opacity={0.85} emissive="#4fc3f7" emissiveIntensity={0.2} />
        </mesh>

        {/* Right Wing */}
        {/* Flipped via scale */}
        <mesh ref={wingR} geometry={wingGeo} position={[-0.02, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[-1, 1, 1]}>
             <meshStandardMaterial color="#4fc3f7" side={THREE.DoubleSide} transparent opacity={0.85} emissive="#4fc3f7" emissiveIntensity={0.2} />
        </mesh>
    </group>
  )
}
export default Butterfly
