import React, { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import { LeafMaterial } from '../shaders/LeafMaterial'
import { TerrainMaterial } from '../shaders/TerrainMaterial'
import { getTerrainHeight } from '../../utils/TerrainHeight'

// Helper to create Fern Geometry
const useFernGeometry = () => {
  return useMemo(() => {
    // Single frond geometry
    const frond = new THREE.PlaneGeometry(0.3, 1.0, 3, 10)
    frond.translate(0, 0.5, 0) // Pivot at bottom

    const pos = frond.attributes.position
    const v = new THREE.Vector3()

    // Shape the frond
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        // Normalize Y (0 to 1)
        const yNorm = v.y / 1.0

        // Taper width: wider at 0.2, zero at 1.0
        // Base width (y=0) is 0.3.
        const taper = 1.0 - Math.pow(yNorm, 1.5)
        v.x *= taper

        // Curl: Bend backwards (Z)
        const curve = Math.pow(yNorm, 2.0) * 0.5
        v.z += curve // Bend backward relative to front face

        pos.setXYZ(i, v.x, v.y, v.z)
    }
    frond.computeVertexNormals()

    // Assemble fern from fronds
    const fern = new THREE.BufferGeometry()
    const frondCount = 7
    const geometries = []

    for(let i=0; i<frondCount; i++) {
        const f = frond.clone()
        const angle = (i / frondCount) * Math.PI * 2 + (Math.random() * 0.5)

        // Rotate around Y
        f.rotateY(angle)

        // Rotate out (bloom)
        f.rotateX(0.5 + Math.random() * 0.3)

        geometries.push(f)
    }

    // Manual merge
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

    fern.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
    fern.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3))
    fern.setAttribute('uv', new THREE.BufferAttribute(mergedUV, 2))
    if(indices.length > 0) fern.setIndex(indices)

    return fern
  }, [])
}

const useGrassGeometry = () => {
    return useMemo(() => {
        const geometry = new THREE.PlaneGeometry(0.08, 0.6, 2, 6)
        geometry.translate(0, 0.3, 0)

        const pos = geometry.attributes.position
        const v = new THREE.Vector3()

        for(let i=0; i<pos.count; i++){
             v.fromBufferAttribute(pos, i)
             const yNorm = v.y / 0.6

             // Taper
             v.x *= (1.0 - Math.pow(yNorm, 2.0))

             // Bend
             v.z += Math.pow(yNorm, 2.0) * 0.2

             pos.setXYZ(i, v.x, v.y, v.z)
        }
        geometry.computeVertexNormals()
        return geometry
    }, [])
}

const useFallenLeafGeometry = () => {
    return useMemo(() => {
        // Increased resolution for shaping
        const geometry = new THREE.PlaneGeometry(0.3, 0.4, 4, 6)
        const pos = geometry.attributes.position
        const v = new THREE.Vector3()

        for(let i=0; i<pos.count; i++){
            v.fromBufferAttribute(pos, i)

            // Normalize coordinates for shaping logic (assuming centered at 0,0)
            // x from -0.15 to 0.15, y from -0.2 to 0.2

            // Simple oval shape
            // Normalize Y to -1 to 1 range
            const yNorm = v.y / 0.2

            // Width factor: cos-ish shape
            const widthScale = Math.sqrt(1.0 - Math.pow(yNorm, 2)) * 1.0

            // Apply width taper
            // Handle edge cases where sqrt might be NaN if > 1 due to float precision
            const safeWidth = isNaN(widthScale) ? 0 : widthScale
            v.x *= safeWidth

            // Random crumple/curl
            const z = v.z
            v.z = z + Math.pow(v.x*3.0, 2.0)*0.1 + (Math.random()-0.5)*0.03 + Math.sin(v.y * 5.0) * 0.05

            pos.setXYZ(i, v.x, v.y, v.z)
        }
        geometry.computeVertexNormals()
        return geometry
    }, [])
}

const useBroadleafGeometry = () => {
    return useMemo(() => {
        // Large Alocasia-like leaf
        // Increased resolution
        const geometry = new THREE.PlaneGeometry(1.0, 1.5, 8, 12)
        geometry.translate(0, 0.75, 0) // Pivot at bottom

        const pos = geometry.attributes.position
        const v = new THREE.Vector3()

        for(let i=0; i<pos.count; i++){
             v.fromBufferAttribute(pos, i)
             const yNorm = v.y / 1.5

             // Heart shape / Shield shape
             // Wider near bottom/middle, taper to point at top
             const shape = Math.sin(Math.pow(yNorm, 0.6) * Math.PI)
             v.x *= (shape * 1.2 + 0.2) // Maintain some width

             // Center depression (vein)
             v.z -= Math.abs(v.x) * 0.3

             // Bend back overall
             v.z += Math.pow(yNorm, 1.8) * 0.8

             // Random waviness
             v.z += Math.sin(v.x * 3.0 + v.y * 2.0) * 0.1

             pos.setXYZ(i, v.x, v.y, v.z)
        }
        geometry.computeVertexNormals()
        return geometry
    }, [])
}

const ForestFloor = () => {
  const fernCount = 1500
  const grassCount = 15000
  const fallenLeafCount = 2000
  const broadleafCount = 500

  const fernGeo = useFernGeometry()
  const grassGeo = useGrassGeometry()
  const fallenGeo = useFallenLeafGeometry()
  const broadleafGeo = useBroadleafGeometry()

  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(400, 400, 256, 256)
    const pos = geo.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i) // Plane Y corresponds to World -Z (roughly, due to rotation)

      // Rotated -90 deg X: Plane Y+ -> World Z-
      // So World Z = -y
      const h = getTerrainHeight(x, -y)

      pos.setZ(i, h)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const grassData = useMemo(() => {
      const data = []
      const baseColor = new THREE.Color("#4a6f1b")

      for(let i=0; i<grassCount; i++) {
          const x = (Math.random() - 0.5) * 380
          const z = (Math.random() - 0.5) * 380
          const h = getTerrainHeight(x, z)

          // Don't spawn underwater (River is approx -0.5, give some buffer)
          if (h < -0.4) continue;

          // Clumping: Use noise to skip some
          const density = Math.sin(x * 0.05) * Math.cos(z * 0.05)
          if (density < -0.3) continue;

          const color = baseColor.clone()
          color.offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.2)

          data.push({
              position: [x, h, z],
              rotation: [0, Math.random() * Math.PI, 0],
              scale: [1 + Math.random()*0.5, 0.8 + Math.random() * 0.5, 1],
              color: color
          })
      }
      return data
  }, [grassCount])

  const fernData = useMemo(() => {
      const data = []
      const baseColor = new THREE.Color("#2d5a27")

      for(let i=0; i<fernCount; i++) {
          const x = (Math.random() - 0.5) * 380
          const z = (Math.random() - 0.5) * 380
          const h = getTerrainHeight(x, z)

          // Ferns prefer shade/higher ground?
          if (h < -0.3) continue;

          // Clumping
          const density = Math.sin(x * 0.08 + 10) * Math.cos(z * 0.08 + 10)
          if (density < -0.1) continue;

          const color = baseColor.clone()
          color.offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.15)

          data.push({
              position: [x, h, z],
              rotation: [0, Math.random() * Math.PI * 2, 0],
              scale: [0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4],
              color: color
          })
      }
      return data
  }, [fernCount])

  const broadleafData = useMemo(() => {
      const data = []
      const baseColor = new THREE.Color("#3a5f2d") // Slightly lighter/yellower green

      for(let i=0; i<broadleafCount; i++) {
          const x = (Math.random() - 0.5) * 380
          const z = (Math.random() - 0.5) * 380
          const h = getTerrainHeight(x, z)

          // Prefer lower areas near water, but not submerged
          if (h < -0.2 || h > 10) continue;

          // Clumping
          const density = Math.sin(x * 0.1 + 5) * Math.cos(z * 0.1 + 5)
          if (density < 0.0) continue; // Sparse clumps

          const color = baseColor.clone()
          color.offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.1)

          data.push({
              position: [x, h, z],
              rotation: [0, Math.random() * Math.PI * 2, 0],
              scale: [0.8 + Math.random() * 0.6, 0.8 + Math.random() * 0.6, 0.8 + Math.random() * 0.6],
              color: color
          })
      }
      return data
  }, [broadleafCount])

  const fallenData = useMemo(() => {
      const data = []
      const baseColor = new THREE.Color("#8b5a2b")

      for(let i=0; i<fallenLeafCount; i++) {
          const x = (Math.random() - 0.5) * 380
          const z = (Math.random() - 0.5) * 380
          const h = getTerrainHeight(x, z)

          if(h < -0.3) continue;

          const color = baseColor.clone()
          color.offsetHSL((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)

          data.push({
              position: [x, h + 0.02, z], // Just above ground
              rotation: [-Math.PI/2, Math.random()*Math.PI*2, 0], // Flat
              scale: 0.5 + Math.random() * 0.5,
              color: color
          })
      }
      return data
  }, [fallenLeafCount])

  return (
    <group>
        {/* Ground Mesh */}
        <mesh geometry={groundGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <TerrainMaterial uScale={0.1} uColorSoil={new THREE.Color("#2b1d0e")} uColorMoss={new THREE.Color("#1a331a")} />
        </mesh>

        {/* Fallen Leaves */}
        <Instances range={fallenData.length} geometry={fallenGeo} receiveShadow>
             <LeafMaterial color="#8b5a2b" uWindStrength={0.0} uUseAlphaMask={1.0} />
             {fallenData.map((data, i) => (
                 <Instance
                    key={`fallen-${i}`}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                    color={data.color}
                 />
             ))}
        </Instances>

        {/* Grass Instances */}
        <Instances range={grassData.length} geometry={grassGeo} castShadow receiveShadow>
            <LeafMaterial color="#4a6f1b" uWindStrength={0.3} uWindSpeed={1.0} uUseAlphaMask={0.0} />
            {grassData.map((data, i) => (
                <Instance
                    key={`grass-${i}`}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                    color={data.color}
                 />
             ))}
        </Instances>

        {/* Fern Instances */}
        <Instances range={fernData.length} geometry={fernGeo} castShadow receiveShadow>
             <LeafMaterial color="#2d5a27" uWindStrength={0.2} uWindSpeed={0.8} uUseAlphaMask={0.0} />
             {fernData.map((data, i) => (
                 <Instance
                    key={`fern-${i}`}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                    color={data.color}
                 />
             ))}
        </Instances>

        {/* Broadleaf Instances */}
        <Instances range={broadleafData.length} geometry={broadleafGeo} castShadow receiveShadow>
             <LeafMaterial color="#3a5f2d" uWindStrength={0.4} uWindSpeed={0.7} uUseAlphaMask={1.0} />
             {broadleafData.map((data, i) => (
                 <Instance
                    key={`broadleaf-${i}`}
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

export default ForestFloor
