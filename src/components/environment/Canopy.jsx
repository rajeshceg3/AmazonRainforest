import { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'

const TreeConfig = {
  count: 50,
  area: 80,
  minHeight: 10,
  maxHeight: 20,
}

const Canopy = () => {
  const { trees, leaves } = useMemo(() => {
    const trees = []
    const leaves = []

    for (let i = 0; i < TreeConfig.count; i++) {
      const x = (Math.random() - 0.5) * TreeConfig.area
      const z = (Math.random() - 0.5) * TreeConfig.area

      // Avoid center clearing if desired, but let's keep it random for now.

      const height = TreeConfig.minHeight + Math.random() * (TreeConfig.maxHeight - TreeConfig.minHeight)
      const scaleBase = 0.8 + Math.random() * 0.6
      const rotation = Math.random() * Math.PI * 2

      // Trunk
      trees.push({
        position: [x, height / 2, z],
        scale: [scaleBase, height, scaleBase],
        rotation: [0, rotation, 0]
      })

      // Generate leaves for this tree
      // Use a few clusters for a more tree-like shape
      const clusterCount = 3 + Math.floor(Math.random() * 3)

      for (let c = 0; c < clusterCount; c++) {
          const clusterY = height - (Math.random() * (height * 0.4)) // Top 40% of tree
          // Random offset from trunk
          const branchAngle = Math.random() * Math.PI * 2
          const branchDist = Math.random() * 3 * scaleBase

          const clusterX = x + Math.cos(branchAngle) * branchDist
          const clusterZ = z + Math.sin(branchAngle) * branchDist

          const leavesInCluster = 15 + Math.floor(Math.random() * 10)

          for (let j = 0; j < leavesInCluster; j++) {
            const r = Math.random() * 2.5
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI

            const lx = clusterX + r * Math.sin(phi) * Math.cos(theta)
            const ly = clusterY + r * Math.sin(phi) * Math.sin(theta)
            const lz = clusterZ + r * Math.cos(phi)

            leaves.push({
                position: [lx, ly, lz],
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
                scale: 0.8 + Math.random() * 0.8
            })
          }
      }
    }
    return { trees, leaves }
  }, [])

  return (
    <group>
      {/* Trunks */}
      <Instances range={trees.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.5, 1, 7]} />
        <meshStandardMaterial color="#2d1a10" roughness={0.9} />
        {trees.map((data, i) => (
          <Instance key={i} position={data.position} scale={data.scale} rotation={data.rotation} />
        ))}
      </Instances>

      {/* Leaves */}
      <Instances range={leaves.length} castShadow receiveShadow>
        <planeGeometry args={[1.2, 1.2]} />
        <meshStandardMaterial color="#1a4d1a" side={THREE.DoubleSide} transparent opacity={0.9} alphaTest={0.5} />
        {leaves.map((data, i) => (
          <Instance key={i} position={data.position} rotation={data.rotation} scale={data.scale} />
        ))}
      </Instances>
    </group>
  )
}

export default Canopy
