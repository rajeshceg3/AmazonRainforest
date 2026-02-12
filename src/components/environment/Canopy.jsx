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
