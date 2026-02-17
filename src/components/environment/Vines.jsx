import React, { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import { LeafMaterial } from '../shaders/LeafMaterial'
import { getTerrainHeight } from '../../utils/TerrainHeight'

const VineConfig = {
  count: 150, // More vines
  area: 350,
  minHeight: 20,
  maxHeight: 45,
  segments: 20
}

const Vines = () => {
  // 1. Generate Vine Curves (Stems)
  const { curves, leafData } = useMemo(() => {
    const curves = []
    const leafData = []
    const leafColors = [
        new THREE.Color("#4a6f1b"),
        new THREE.Color("#2d4a22"),
        new THREE.Color("#5e8c31")
    ]

    for (let i = 0; i < VineConfig.count; i++) {
      const x = (Math.random() - 0.5) * VineConfig.area
      const z = (Math.random() - 0.5) * VineConfig.area

      // Start high up in canopy
      const startY = VineConfig.minHeight + Math.random() * (VineConfig.maxHeight - VineConfig.minHeight)

      // End near ground (but not underground)
      const terrainH = getTerrainHeight(x, z)
      const endY = Math.max(terrainH + 1.0, 2.0 + Math.random() * 5.0)

      // Control points for a natural hang
      // Simple vertical line with some noise
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, startY, z),
        new THREE.Vector3(x + (Math.random()-0.5)*2, (startY + endY) * 0.7, z + (Math.random()-0.5)*2),
        new THREE.Vector3(x + (Math.random()-0.5)*4, (startY + endY) * 0.4, z + (Math.random()-0.5)*4),
        new THREE.Vector3(x + (Math.random()-0.5)*5, endY, z + (Math.random()-0.5)*5)
      ])

      curves.push(curve)

      // Generate leaves along the curve
      const vineLength = startY - endY
      const leafCount = Math.floor(vineLength * 1.5) // Density

      const points = curve.getPoints(leafCount)

      for(let j=0; j<points.length; j++) {
          const point = points[j]
          const tangent = curve.getTangent(j / leafCount)

          // Random rotation around the vine stem
          const angle = Math.random() * Math.PI * 2
          const scale = 0.5 + Math.random() * 0.8

          // Leaf orientation: roughly normal to stem but drooping
          // Simple: specific rotation based on tangent?
          // For now, random rotation is organic enough for distance

          leafData.push({
              position: [point.x, point.y, point.z],
              rotation: [Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI],
              scale: scale,
              color: leafColors[Math.floor(Math.random() * leafColors.length)]
          })
      }
    }

    return { curves, leafData }
  }, [])

  // 2. Create Geometry for Stems (Merged Lines or Tubes)
  const stemGeometry = useMemo(() => {
     // Use TubeGeometry for thickness, merged
     const geometries = []

     curves.forEach(curve => {
         const tube = new THREE.TubeGeometry(curve, VineConfig.segments, 0.04, 4, false)
         geometries.push(tube)
     })

     // Merge
    let totalVerts = 0
    geometries.forEach(g => totalVerts += g.attributes.position.count)

    const mergedPos = new Float32Array(totalVerts * 3)
    const mergedNorm = new Float32Array(totalVerts * 3)
    // No UVs needed for simple color material

    let offset = 0
    // Simple merge logic (assuming non-indexed or handling indices)
    // TubeGeometry is indexed.

    // Better: use BufferGeometryUtils.mergeBufferGeometries if available, but I don't have it imported.
    // Manual merge including indices.

    // Actually, simpler: just return array of meshes? No, draw calls.
    // Let's make a single geometry.

    const singleGeo = new THREE.BufferGeometry()

    // Count total indices
    let totalIndices = 0
    geometries.forEach(g => totalIndices += g.index.count)

    const indices = new Uint32Array(totalIndices)

    let indexOffset = 0
    let vertOffset = 0

    geometries.forEach(g => {
        const p = g.attributes.position.array
        const n = g.attributes.normal.array
        const idx = g.index.array

        mergedPos.set(p, vertOffset * 3)
        mergedNorm.set(n, vertOffset * 3)

        for(let i=0; i<idx.length; i++) {
            indices[indexOffset + i] = idx[i] + vertOffset
        }

        vertOffset += g.attributes.position.count
        indexOffset += idx.length
    })

    singleGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
    singleGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3))
    singleGeo.setIndex(new THREE.BufferAttribute(indices, 1))

    return singleGeo
  }, [curves])

  // 3. Leaf Geometry (Instance)
  const leafGeo = useMemo(() => {
      // Heart shaped leaf using Plane + Alpha Mask (handled by shader)
      // Or shape geometry. Let's use Plane and rely on shader or shape.
      // Actually, simple plane is fine if we have enough of them.
      const geo = new THREE.PlaneGeometry(0.5, 0.5, 2, 2)
      return geo
  }, [])

  return (
    <group>
      {/* Stems */}
      <mesh geometry={stemGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#3e2b1f" roughness={0.9} />
      </mesh>

      {/* Leaves */}
      <Instances range={leafData.length} geometry={leafGeo} castShadow receiveShadow>
        <LeafMaterial
            uWindStrength={0.4}
            uWindSpeed={0.5}
            uUseAlphaMask={1.0} // Use circular cutout
            side={THREE.DoubleSide}
        />
        {leafData.map((data, i) => (
          <Instance
            key={i}
            position={data.position}
            rotation={data.rotation}
            scale={[data.scale, data.scale, data.scale]}
            color={data.color}
          />
        ))}
      </Instances>
    </group>
  )
}

export default Vines
