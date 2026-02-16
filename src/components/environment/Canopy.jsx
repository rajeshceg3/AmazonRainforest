import React, { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import { BarkMaterial } from '../shaders/BarkMaterial.jsx'
import { LeafMaterial } from '../shaders/LeafMaterial'
import { getTerrainHeight } from '../../utils/TerrainHeight'

const TreeConfig = {
  count: 400,
  area: 400,
  minHeight: 18,
  maxHeight: 45,
}

// Helper to merge geometries
const mergeGeometries = (geometries) => {
    let totalVerts = 0
    let totalIndices = 0
    geometries.forEach(g => {
        totalVerts += g.attributes.position.count
        if (g.index) totalIndices += g.index.count
    })

    const mergedPos = new Float32Array(totalVerts * 3)
    const mergedNorm = new Float32Array(totalVerts * 3)
    const mergedUV = new Float32Array(totalVerts * 2)
    const indices = totalIndices > 0 ? (totalVerts > 65535 ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices)) : null

    let offset = 0
    let indexOffset = 0

    geometries.forEach(g => {
        const p = g.attributes.position.array
        const n = g.attributes.normal.array
        const uv = g.attributes.uv.array
        const idx = g.index ? g.index.array : null

        mergedPos.set(p, offset * 3)
        mergedNorm.set(n, offset * 3)
        mergedUV.set(uv, offset * 2)

        if (idx && indices) {
            for(let j=0; j<idx.length; j++) {
                indices[indexOffset + j] = idx[j] + offset
            }
            indexOffset += idx.length
        } else if (indices) {
             // If some have indices and others don't, this breaks.
             // We assume all inputs are either indexed or not.
             // Primitive Cylinder/Plane are indexed.
             // But if we use non-indexed, we'd need to generate.
             // Let's assume indexed.
        }

        offset += g.attributes.position.count
    })

    const merged = new THREE.BufferGeometry()
    merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
    merged.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3))
    merged.setAttribute('uv', new THREE.BufferAttribute(mergedUV, 2))
    if(indices) merged.setIndex(new THREE.BufferAttribute(indices, 1))

    return merged
}

const TrunkGeometry = () => {
    return useMemo(() => {
        const geometries = []
        const dummy = new THREE.Object3D()

        // 1. Main Trunk
        // Taller, thinner at top
        const trunk = new THREE.CylinderGeometry(0.2, 0.8, 1, 16, 12, true)
        trunk.translate(0, 0.5, 0) // Pivot at bottom

        // Shaping
        const pos = trunk.attributes.position
        const v = new THREE.Vector3()
        for(let i=0; i<pos.count; i++){
            v.fromBufferAttribute(pos, i)
            const y = v.y

            // Root flare
            const flare = Math.max(0, 1.0 - y * 6.0)
            const rOffset = Math.pow(flare, 2.0) * 1.5

            const r = Math.sqrt(v.x*v.x + v.z*v.z)
            if(r > 0.001) {
                v.x += (v.x/r) * rOffset
                v.z += (v.z/r) * rOffset
            }

            // Crookedness
            v.x += Math.sin(y * 5.0) * 0.1 * y
            v.z += Math.cos(y * 4.0) * 0.1 * y

            pos.setXYZ(i, v.x, v.y, v.z)
        }
        trunk.computeVertexNormals()
        geometries.push(trunk)

        // 2. Branches
        // Add 4-6 main branches
        const branchCount = 5
        const branchGeo = new THREE.CylinderGeometry(0.15, 0.25, 1, 8, 4, true)
        branchGeo.translate(0, 0.5, 0)

        for(let i=0; i<branchCount; i++) {
            const branch = branchGeo.clone()

            // Position up the trunk
            const yStart = 0.4 + (i / branchCount) * 0.5 // 0.4 to 0.9

            // Random angle around Y
            const rotY = (i / branchCount) * Math.PI * 2 + (Math.random() * 0.5)

            // Angle out (45-60 degrees)
            const rotX = Math.PI / 4 + Math.random() * 0.3

            dummy.position.set(0, yStart, 0)
            dummy.rotation.set(rotX, rotY, 0)
            dummy.scale.set(1, 0.4 + Math.random()*0.3, 1) // Short branches
            dummy.updateMatrix()

            branch.applyMatrix4(dummy.matrix)
            geometries.push(branch)
        }

        return mergeGeometries(geometries)
    }, [])
}

const LeafClusterGeometry = () => {
    return useMemo(() => {
        // We need to match the branch structure roughly
        // or just create a "crown" that looks like it sits on branches.

        // Single Leaf
        const leaf = new THREE.PlaneGeometry(1.5, 2.0, 2, 4)
        leaf.translate(0, 1.0, 0) // Pivot bottom

        // Shape leaf
        const pos = leaf.attributes.position
        const v = new THREE.Vector3()
        for(let i=0; i<pos.count; i++){
            v.fromBufferAttribute(pos, i)
            const y = v.y / 2.0
            // Taper top
            v.x *= (1.0 - Math.pow(y-0.2, 2.0)*0.5)
            // Bend down
            v.z += Math.pow(y, 1.5) * 0.8
            pos.setXYZ(i, v.x, v.y, v.z)
        }
        leaf.computeVertexNormals()

        const geometries = []
        const dummy = new THREE.Object3D()

        // Distribute leaves in "pads" or "clouds"
        // 1. Top Crown (Main trunk)
        // 2. Side Crowns (Branches)

        const crowns = [
            { y: 1.0, r: 0.2, count: 12, spread: 0.5 }, // Top
            { y: 0.8, r: 0.6, count: 10, spread: 0.8 }, // Upper branches
            { y: 0.6, r: 0.8, count: 10, spread: 1.0 }, // Mid branches
            { y: 0.5, r: 0.9, count: 8, spread: 1.2 },  // Lower branches
        ]

        crowns.forEach(crown => {
             for(let i=0; i<crown.count; i++) {
                 const l = leaf.clone()

                 // Random position within crown sphere
                 const theta = Math.random() * Math.PI * 2
                 const phi = Math.random() * Math.PI * 0.5 // Upper hemisphere

                 const r = crown.r + (Math.random() - 0.5) * crown.spread

                 const x = r * Math.sin(phi) * Math.cos(theta)
                 const y = crown.y + r * Math.cos(phi) * 0.5 // Flattened Y
                 const z = r * Math.sin(phi) * Math.sin(theta)

                 // Orient leaf
                 dummy.position.set(x, y, z)
                 dummy.lookAt(x * 2, y + 2, z * 2) // Look out and up

                 // Random twist
                 dummy.rotateZ(Math.random() * 0.5)

                 dummy.updateMatrix()
                 l.applyMatrix4(dummy.matrix)
                 geometries.push(l)
             }
        })

        return mergeGeometries(geometries)
    }, [])
}

const Canopy = () => {
  const trunkGeo = TrunkGeometry()
  const leafClusterGeo = LeafClusterGeometry()

  const { trunks, leaves } = useMemo(() => {
    const trunks = []
    const leaves = []
    const leafColors = [
        new THREE.Color("#2d4a22"),
        new THREE.Color("#3a5f2d"),
        new THREE.Color("#4c7a3b"),
        new THREE.Color("#1e3618"),
        new THREE.Color("#5e8c4b")
    ]

    for (let i = 0; i < TreeConfig.count; i++) {
      const x = (Math.random() - 0.5) * TreeConfig.area
      const z = (Math.random() - 0.5) * TreeConfig.area

      const terrainH = getTerrainHeight(x, z)

      if (terrainH < -0.5) continue;

      const height = TreeConfig.minHeight + Math.random() * (TreeConfig.maxHeight - TreeConfig.minHeight)
      const scaleBase = 2.5 + Math.random() * 2.5
      const rotation = Math.random() * Math.PI * 2

      // Trunk
      trunks.push({
        position: [x, terrainH, z],
        scale: [scaleBase, height, scaleBase],
        rotation: [0, rotation, 0]
      })

      // Leaves (One big cluster per tree, scaled to match)
      // Since geometry includes branch distribution, we just place it at the same spot
      // But we need to scale it to match trunk height?
      // Trunk geometry is normalized 0-1 height.
      // Leaf geometry is also 0-1 (mostly).
      // So we can use same scale/position.

      leaves.push({
          position: [x, terrainH, z],
          rotation: [0, rotation, 0],
          scale: [scaleBase, height, scaleBase],
          color: leafColors[Math.floor(Math.random() * leafColors.length)]
      })
    }
    return { trunks, leaves }
  }, [])

  return (
    <group>
      <Instances range={trunks.length} geometry={trunkGeo} castShadow receiveShadow>
        <BarkMaterial />
        {trunks.map((data, i) => (
          <Instance key={`trunk-${i}`} position={data.position} scale={data.scale} rotation={data.rotation} />
        ))}
      </Instances>

      <Instances range={leaves.length} geometry={leafClusterGeo} castShadow receiveShadow>
        <LeafMaterial uUseAlphaMask={1.0} uWindStrength={0.6} />
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
