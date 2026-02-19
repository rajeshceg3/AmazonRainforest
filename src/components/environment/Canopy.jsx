import React, { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import { BarkMaterial } from '../shaders/BarkMaterial.jsx'
import { LeafMaterial } from '../shaders/LeafMaterial'
import { getTerrainHeight } from '../../utils/TerrainHeight'
import Epiphytes from './Epiphytes'

const TreeConfig = {
  count: 400,
  area: 400,
  minHeight: 18,
  maxHeight: 45,
}

// Improved Trunk Geometry: High resolution with root flare and organic shaping
const TrunkGeometry = () => {
    return useMemo(() => {
        // High poly cylinder for vertex displacement
        const geo = new THREE.CylinderGeometry(0.3, 0.7, 1, 32, 64)
        geo.translate(0, 0.5, 0) // Pivot at bottom

        const pos = geo.attributes.position
        const v = new THREE.Vector3()

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)
            const y = v.y // 0 to 1

            // 1. Root Flare (Buttress roots)
            const flarePower = Math.max(0, 1.0 - y * 5.0);
            const flare = Math.pow(flarePower, 3.0) * 2.5;

            const radius = Math.sqrt(v.x*v.x + v.z*v.z);
            if (radius > 0.001) {
                v.x += (v.x / radius) * flare * 0.5;
                v.z += (v.z / radius) * flare * 0.5;
            }

            // 2. Organic Crookedness
            const bendX = Math.sin(y * 3.0) * 0.3 * y;
            const bendZ = Math.cos(y * 2.5) * 0.3 * y;
            v.x += bendX;
            v.z += bendZ;

            // 3. Surface Noise
            const noiseX = Math.sin(y * 20.0 + v.z * 10.0) * 0.02;
            const noiseZ = Math.cos(y * 18.0 + v.x * 10.0) * 0.02;
            v.x += noiseX;
            v.z += noiseZ;

            pos.setXYZ(i, v.x, v.y, v.z)
        }
        geo.computeVertexNormals()
        return geo
    }, [])
}

// Improved Leaf Cluster: Denser and more organic
const LeafClusterGeometry = () => {
    return useMemo(() => {
        // Base leaf shape
        const singleLeaf = new THREE.PlaneGeometry(1.2, 1.8, 3, 5) // Larger leaves
        singleLeaf.translate(0, 0.9, 0) // Pivot at bottom

        const pos = singleLeaf.attributes.position
        const v = new THREE.Vector3()

        // Bend the leaf
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)
            const yNorm = v.y / 1.8;
            const droop = Math.pow(yNorm, 2.0) * 0.5;
            v.z += droop;
            v.x *= (1.0 - Math.pow(yNorm, 2.0) * 0.5);
            pos.setXYZ(i, v.x, v.y, v.z)
        }
        singleLeaf.computeVertexNormals()

        const cluster = new THREE.BufferGeometry()
        const leafCount = 16
        const geometries = []
        const dummy = new THREE.Object3D()

        for(let i=0; i<leafCount; i++) {
            const leaf = singleLeaf.clone()

            // Fibonacci sphere distribution roughly
            const phi = Math.acos(1 - 2 * (i + 0.5) / leafCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

            const r = 0.5 + Math.random() * 0.5
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = Math.abs(r * Math.sin(phi) * Math.sin(theta)); // Upper hemisphere prefer
            const z = r * Math.cos(phi);

            // Rotate to face outwards
            dummy.position.set(0, 0, 0);
            dummy.rotation.set(0, 0, 0);
            dummy.lookAt(x, y, z);
            dummy.updateMatrix();
            leaf.applyMatrix4(dummy.matrix);

            // Translate
            leaf.translate(x, y, z);

            geometries.push(leaf)
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

        cluster.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
        cluster.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3))
        cluster.setAttribute('uv', new THREE.BufferAttribute(mergedUV, 2))
        if(indices.length > 0) cluster.setIndex(indices)

        return cluster
    }, [])
}

// --- Palm Tree Geometry (Improved with Pinnate Fronds) ---
const usePalmGeometry = () => {
    return useMemo(() => {
        // 1. Palm Trunk - Thinner, taller, ringed
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 1, 12, 32)
        trunkGeo.translate(0, 0.5, 0)

        const pos = trunkGeo.attributes.position
        const v = new THREE.Vector3()

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)

            // Rings texture via displacement
            const ring = Math.sin(v.y * 60.0) * 0.01
            const r = Math.sqrt(v.x*v.x + v.z*v.z)
            if (r > 0.001) {
                v.x += (v.x/r) * ring
                v.z += (v.z/r) * ring
            }

            // Slight curve
            v.x += Math.sin(v.y * 2.0) * 0.1 * v.y

            pos.setXYZ(i, v.x, v.y, v.z)
        }
        trunkGeo.computeVertexNormals()

        // 2. Palm Fronds - Pinnate (Feather-like)
        // High resolution for shaping
        const frondGeo = new THREE.PlaneGeometry(0.8, 3.5, 32, 48)
        frondGeo.translate(0, 0.2, 0) // Pivot

        const fPos = frondGeo.attributes.position
        for (let i = 0; i < fPos.count; i++) {
            v.fromBufferAttribute(fPos, i)
            const yNorm = Math.max(0, (v.y + 0.5) / 4.0)

            // Taper width
            // v.x *= (1.0 - Math.pow(yNorm, 1.5)) * 0.5
            // But we do pinnate cuts first

            const xAbs = Math.abs(v.x);

            // Pinnate Cuts (Sawtooth)
            // Frequency increases towards tip
            const freq = 15.0 + yNorm * 10.0;
            const cut = Math.pow(Math.sin(v.y * freq), 2.0); // 0 to 1

            // Only affect edges, leave spine
            if (xAbs > 0.05) {
                // Pull vertices in based on cut
                // cut=1 -> full width, cut=0 -> spine
                // But we want sharp cuts.
                // Modulate width by cut
                const shape = (1.0 - Math.pow(yNorm, 1.5)) * 0.5; // Base shape width
                const width = shape * (0.2 + 0.8 * cut); // Modulated width

                // Adjust x to match width
                if (xAbs > 0.0) v.x = Math.sign(v.x) * Math.min(xAbs, width);
            } else {
                 // Spine taper
                 v.x *= (1.0 - Math.pow(yNorm, 1.5)) * 0.5;
            }

            // Arch
            v.z += Math.sin(yNorm * Math.PI) * 1.5
            v.y -= Math.pow(yNorm, 2.0) * 2.0

            // V-Shape cross section (gutter)
            v.z -= Math.abs(v.x) * 0.5;

            fPos.setXYZ(i, v.x, v.y, v.z)
        }
        frondGeo.computeVertexNormals()

        // Assemble crown
        const crown = new THREE.BufferGeometry()
        const frondCount = 9
        const geometries = [trunkGeo] // Start with trunk
        const dummy = new THREE.Object3D()

        for(let i=0; i<frondCount; i++) {
            const f = frondGeo.clone()
            const angle = (i / frondCount) * Math.PI * 2

            dummy.position.set(0, 0.95, 0) // Top of trunk
            dummy.rotation.set(0, angle, 0)
            dummy.rotateX(0.2) // Tilt out
            dummy.updateMatrix()

            f.applyMatrix4(dummy.matrix)
            geometries.push(f)
        }

        // Manual Merge Logic
        let totalVerts = 0
        geometries.forEach(g => totalVerts += g.attributes.position.count)

        const mergedPos = new Float32Array(totalVerts * 3)
        const mergedNorm = new Float32Array(totalVerts * 3)
        const mergedUV = new Float32Array(totalVerts * 2)
        const mergedColor = new Float32Array(totalVerts * 3)
        const indices = []
        let offset = 0

        // Colors
        const trunkColor = new THREE.Color("#5d4037")
        const frondColor = new THREE.Color("#4a6f1b")

        geometries.forEach((g, index) => {
            const p = g.attributes.position.array
            const n = g.attributes.normal.array
            const uv = g.attributes.uv.array
            const idx = g.index ? g.index.array : null

            mergedPos.set(p, offset * 3)
            mergedNorm.set(n, offset * 3)
            mergedUV.set(uv, offset * 2)

            // Vertex Colors
            // index 0 is trunk, rest are fronds
            const color = index === 0 ? trunkColor : frondColor
            for (let k = 0; k < g.attributes.position.count; k++) {
                mergedColor[offset * 3 + k * 3 + 0] = color.r
                mergedColor[offset * 3 + k * 3 + 1] = color.g
                mergedColor[offset * 3 + k * 3 + 2] = color.b
            }

            if (idx) {
                for(let j=0; j<idx.length; j++) indices.push(idx[j] + offset)
            } else {
                 for(let j=0; j<g.attributes.position.count; j++) indices.push(j + offset)
            }
            offset += g.attributes.position.count
        })

        const palm = new THREE.BufferGeometry()
        palm.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
        palm.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3))
        palm.setAttribute('uv', new THREE.BufferAttribute(mergedUV, 2))
        palm.setAttribute('color', new THREE.BufferAttribute(mergedColor, 3))
        if(indices.length > 0) palm.setIndex(indices)

        return palm
    }, [])
}


const Canopy = () => {
  const trunkGeo = TrunkGeometry()
  const leafClusterGeo = LeafClusterGeometry()
  const palmGeo = usePalmGeometry()

  const { trunks, leaves, palms } = useMemo(() => {
    const trunks = []
    const leaves = []
    const palms = []
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

      // 15% chance to be a Palm
      if (Math.random() < 0.15) {
          palms.push({
              position: [x, terrainH, z],
              scale: [3 + Math.random(), height * 0.8, 3 + Math.random()], // Palms are tall/thin but scale affects whole mesh
              rotation: [0, Math.random() * Math.PI * 2, 0]
          })
      } else {
          // Standard Tree
          const scaleBase = 2.5 + Math.random() * 2.5
          const rotation = Math.random() * Math.PI * 2

          trunks.push({
            position: [x, terrainH, z],
            scale: [scaleBase, height, scaleBase],
            rotation: [0, rotation, 0]
          })

          const clusterCount = 25 + Math.floor(Math.random() * 20)

          for (let c = 0; c < clusterCount; c++) {
              const hRatio = 0.4 + Math.random() * 0.6
              const clusterY = height * hRatio

              const maxR = 8.0 * (1.0 - Math.pow(hRatio - 0.4, 2.0));
              const r = Math.random() * maxR + 1.0
              const theta = Math.random() * Math.PI * 2

              const lx = x + Math.cos(theta) * r
              const lz = z + Math.sin(theta) * r

              leaves.push({
                  position: [lx, terrainH + clusterY, lz],
                  rotation: [Math.random()*0.5, Math.random()*Math.PI*2, Math.random()*0.5],
                  scale: 1.2 + Math.random() * 1.0,
                  color: leafColors[Math.floor(Math.random() * leafColors.length)]
              })
          }
      }
    }
    return { trunks, leaves, palms }
  }, [])

  return (
    <group>
      {/* Standard Trees */}
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

      {/* Palms (New) */}
      <Instances range={palms.length} geometry={palmGeo} castShadow receiveShadow>
         {/* Vertex colors enable distinction between trunk and leaves */}
         <LeafMaterial vertexColors uWindStrength={0.4} uUseAlphaMask={0.0} />
         {palms.map((data, i) => (
            <Instance
                key={`palm-${i}`}
                position={data.position}
                scale={data.scale}
                rotation={data.rotation}
            />
         ))}
      </Instances>

      <Epiphytes trunks={trunks} />
    </group>
  )
}

export default Canopy
