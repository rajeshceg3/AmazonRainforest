import React, { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import { BarkMaterial } from '../shaders/BarkMaterial.jsx'
import { LeafMaterial } from '../shaders/LeafMaterial'
import { getTerrainHeight } from '../../utils/TerrainHeight'

const TreeConfig = {
  count: 150,
  area: 400,
  minHeight: 12,
  maxHeight: 25,
}

// Improved Trunk Geometry: High segmentation for shader displacement
const TrunkGeometry = () => {
    return useMemo(() => {
        // Tapered cylinder: top radius 0.2, bottom 0.8, height 1 (scaled later), segments
        const geo = new THREE.CylinderGeometry(0.2, 0.8, 1, 12, 16)
        geo.translate(0, 0.5, 0) // Pivot at bottom
        return geo
    }, [])
}

// Improved Leaf Cluster: Denser and more organic
const LeafClusterGeometry = () => {
    return useMemo(() => {
        // Base leaf shape
        const singleLeaf = new THREE.PlaneGeometry(0.8, 1.2, 2, 4)
        singleLeaf.translate(0, 0.6, 0) // Pivot at bottom

        const pos = singleLeaf.attributes.position
        const v = new THREE.Vector3()

        // Bend the leaf to be less flat
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)
            const bend = Math.pow(Math.max(0, v.y), 1.5) * 0.5
            v.z += bend
            v.x *= (1.2 - v.y * 0.5) // Taper
            pos.setXYZ(i, v.x, v.y, v.z)
        }
        singleLeaf.computeVertexNormals()

        const cluster = new THREE.BufferGeometry()
        const leafCount = 12
        const geometries = []

        for(let i=0; i<leafCount; i++) {
            const leaf = singleLeaf.clone()

            // Distribute leaves in a semi-sphere or branch-like pattern
            const angle = (i / leafCount) * Math.PI * 2 + (Math.random() - 0.5)
            const height = Math.random() * 0.5
            const radius = Math.random() * 0.5

            // Position relative to cluster center
            leaf.translate(Math.cos(angle) * radius, height, Math.sin(angle) * radius)

            // Random rotations
            leaf.rotateY(Math.random() * Math.PI * 2)
            leaf.rotateX((Math.random() - 0.5) * 1.0)
            leaf.rotateZ((Math.random() - 0.5) * 1.0)

            // Scale variation
            const s = 0.5 + Math.random() * 0.8
            leaf.scale(s, s, s)

            geometries.push(leaf)
        }

        // Merge geometries manually
        let totalVerts = 0
        geometries.forEach(g => totalVerts += g.attributes.position.count)

        const mergedPos = new Float32Array(totalVerts * 3)
        const mergedNorm = new Float32Array(totalVerts * 3)
        const mergedUV = new Float32Array(totalVerts * 2)
        const indices = []

        let offset = 0

        geometries.forEach(g => {
            const p = g.attributes.position.array
            const n = g.attributes.normal.array
            const uv = g.attributes.uv.array
            const idx = g.index ? g.index.array : null

            mergedPos.set(p, offset * 3)
            mergedNorm.set(n, offset * 3)
            mergedUV.set(uv, offset * 2)

            if (idx) {
                for(let j=0; j<idx.length; j++) {
                    indices.push(idx[j] + offset)
                }
            } else {
                 for(let j=0; j<g.attributes.position.count; j++) {
                    indices.push(j + offset)
                }
            }

            offset += g.attributes.position.count
        })

        cluster.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
        cluster.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3))
        cluster.setAttribute('uv', new THREE.BufferAttribute(mergedUV, 2))
        if(indices.length > 0) cluster.setIndex(indices)

        return cluster
    }, [])
}

const Canopy = () => {
  const trunkGeo = TrunkGeometry()
  const leafClusterGeo = LeafClusterGeometry()

  const { trunks, leaves } = useMemo(() => {
    const trunks = []
    const leaves = []
    const leafColors = ["#2d4a22", "#3a5f2d", "#4c7a3b", "#1e3618", "#5e8c4b"]

    for (let i = 0; i < TreeConfig.count; i++) {
      const x = (Math.random() - 0.5) * TreeConfig.area
      const z = (Math.random() - 0.5) * TreeConfig.area

      const terrainH = getTerrainHeight(x, z)

      // Avoid river (if too low)
      if (terrainH < -0.5) continue;

      const height = TreeConfig.minHeight + Math.random() * (TreeConfig.maxHeight - TreeConfig.minHeight)
      const scaleBase = 1.5 + Math.random() * 1.0 // Thicker trunks
      const rotation = Math.random() * Math.PI * 2

      // Trunk
      // Height is handled by scaling Y
      trunks.push({
        position: [x, terrainH, z],
        scale: [scaleBase, height, scaleBase],
        rotation: [0, rotation, 0]
      })

      // Canopy Clusters
      const clusterCount = 20 + Math.floor(Math.random() * 15) // Denser canopy

      for (let c = 0; c < clusterCount; c++) {
          // Distribution: cone-like at top
          const hRatio = 0.5 + Math.random() * 0.5 // Top 50%
          const clusterY = height * hRatio

          // Radius increases as we go down from top
          const maxR = 6.0 * (1.0 - (hRatio - 0.5)*2.0) + 2.0
          const r = Math.random() * maxR
          const theta = Math.random() * Math.PI * 2

          const lx = x + Math.cos(theta) * r
          const lz = z + Math.sin(theta) * r

          leaves.push({
              position: [lx, terrainH + clusterY, lz],
              rotation: [Math.random()*0.5, Math.random()*Math.PI*2, Math.random()*0.5],
              scale: 1.0 + Math.random() * 0.8,
              color: leafColors[Math.floor(Math.random() * leafColors.length)]
          })
      }
    }
    return { trunks, leaves }
  }, [])

  return (
    <group>
      {/* Trunks */}
      <Instances range={trunks.length} geometry={trunkGeo} castShadow receiveShadow>
        <BarkMaterial />
        {trunks.map((data, i) => (
          <Instance key={`trunk-${i}`} position={data.position} scale={data.scale} rotation={data.rotation} />
        ))}
      </Instances>

      {/* Leaves */}
      <Instances range={leaves.length} geometry={leafClusterGeo} castShadow receiveShadow>
        <LeafMaterial />
        {leaves.map((data, i) => (
          <Instance
            key={`leaf-${i}`}
            position={data.position}
            rotation={data.rotation}
            scale={data.scale}
            color={data.color}
          />
        ))}
      </Instances>
    </group>
  )
}

export default Canopy
