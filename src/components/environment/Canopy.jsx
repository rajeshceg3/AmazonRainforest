import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'

const Canopy = () => {
  const lightRef = useRef()

  // Settings
  const treeCount = 10
  const leavesPerTree = 150

  // Generate tree centers
  const treeCenters = useMemo(() => {
    const centers = []
    for (let i = 0; i < treeCount; i++) {
      centers.push(new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        15 + Math.random() * 5,
        (Math.random() - 0.5) * 50
      ))
    }
    return centers
  }, [])

  useFrame((state) => {
    if (lightRef.current) {
      // Gentle sun pulse
      lightRef.current.intensity = 0.8 + Math.sin(state.clock.elapsedTime * 0.3) * 0.3
      // Subtle movement of light position
      lightRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2
    }
  })

  return (
    <group>
      {/* Canopy Leaves using Instances */}
      <Instances range={treeCount * leavesPerTree}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial
          color="#1a4d1a"
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          depthWrite={false} // Helps with transparency sorting issues slightly
        />

        {treeCenters.map((center, i) => (
          <group key={i} position={center}>
            {Array.from({ length: leavesPerTree }).map((_, j) => {
              // Random position within a sphere around center
              const r = 4 + Math.random() * 3
              const theta = Math.random() * Math.PI * 2
              const phi = Math.acos(2 * Math.random() - 1)

              const x = r * Math.sin(phi) * Math.cos(theta)
              const y = r * Math.sin(phi) * Math.sin(theta) * 0.6 // Flatten slightly
              const z = r * Math.cos(phi)

              return (
                <Instance
                  key={`${i}-${j}`}
                  position={[x, y, z]}
                  rotation={[
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                  ]}
                  scale={0.5 + Math.random() * 1.5}
                />
              )
            })}
          </group>
        ))}
      </Instances>

      {/* Sun Shafts / Volumetric Light Placeholder */}
      <spotLight
        ref={lightRef}
        position={[10, 25, 5]}
        angle={0.5}
        penumbra={1}
        intensity={1}
        color="#fffceb"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Ambient fill for canopy from below */}
      <pointLight position={[0, 10, 0]} intensity={0.2} color="#4a704a" distance={30} decay={2} />
    </group>
  )
}

export default Canopy
