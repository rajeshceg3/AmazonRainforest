import { useMemo } from 'react'
import { extend } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import BarkMaterial from '../shaders/BarkMaterial'
import { LeafMaterial } from '../shaders/LeafMaterial'

extend({ BarkMaterial })

const TreeConfig = {
  count: 150,
  area: 400,
  minHeight: 12,
  maxHeight: 25,
}

const WobblyTrunkGeometry = () => {
    return useMemo(() => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.3, 4, 0.2),
            new THREE.Vector3(-0.2, 8, -0.3),
            new THREE.Vector3(0.1, 12, 0.1),
            new THREE.Vector3(0, 15, 0)
        ])
        return new THREE.TubeGeometry(curve, 16, 0.4, 8, false)
    }, [])
}

const LeafClusterGeometry = () => {
    return useMemo(() => {
        // Create a single curved leaf
        const singleLeaf = new THREE.PlaneGeometry(0.8, 1.2, 4, 8)
        singleLeaf.translate(0, 0.6, 0) // Pivot at bottom

        const pos = singleLeaf.attributes.position
        const v = new THREE.Vector3()

        // Bend the single leaf
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)
            // Bend along length (Y)
            const bend = Math.pow(v.y, 1.5) * 0.5
            v.z += bend
            // Curve across width (X)
            v.z += Math.pow(v.x, 2) * -0.5
            // Taper width at top
            if(v.y > 0.5) {
                v.x *= (1.2 - v.y) * 2.0; // Simple taper
            }
            pos.setXYZ(i, v.x, v.y, v.z)
        }
        singleLeaf.computeVertexNormals()

        // Merge 4 leaves into a cluster
        const cluster = new THREE.BufferGeometry()
        const leafCount = 5
        const geometries = []

        for(let i=0; i<leafCount; i++) {
            const leaf = singleLeaf.clone()
            // Rotate around Y
            const angle = (i / leafCount) * Math.PI * 2 + (Math.random() - 0.5)
            leaf.rotateY(angle)
            // Tilt out slightly
            leaf.rotateX(Math.PI * 0.15)
            leaf.rotateZ((Math.random()-0.5) * 0.2)
            geometries.push(leaf)
        }

        // Manually merge
        // Since we can't depend on BufferGeometryUtils, we just create a new geometry from the list
        // Actually, just use one geometry and draw multiple instances per cluster?
        // No, 'Instances' component draws the *cluster* as one instance.

        // Simple manual merge
        let totalVerts = 0
        geometries.forEach(g => totalVerts += g.attributes.position.count)

        const mergedPos = new Float32Array(totalVerts * 3)
        const mergedNorm = new Float32Array(totalVerts * 3)
        const mergedUV = new Float32Array(totalVerts * 2)
        const indices = []

        let offset = 0
        let indexOffset = 0

        geometries.forEach(g => {
            const p = g.attributes.position.array
            const n = g.attributes.normal.array
            const uv = g.attributes.uv.array
            const idx = g.index.array

            mergedPos.set(p, offset * 3)
            mergedNorm.set(n, offset * 3)
            mergedUV.set(uv, offset * 2)

            for(let j=0; j<idx.length; j++) {
                indices.push(idx[j] + offset)
            }

            offset += g.attributes.position.count
        })

        cluster.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
        cluster.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3))
        cluster.setAttribute('uv', new THREE.BufferAttribute(mergedUV, 2))
        cluster.setIndex(indices)

        return cluster
    }, [])
}

const Canopy = () => {
  const trunkGeo = WobblyTrunkGeometry()
  const leafClusterGeo = LeafClusterGeometry()

  const { trunks, leaves } = useMemo(() => {
    const trunks = []
    const leaves = []
    // Varied greens
    const leafColors = ["#2d4a22", "#3a5f2d", "#4c7a3b", "#1e3618", "#5e8c4b"]

    for (let i = 0; i < TreeConfig.count; i++) {
      const x = (Math.random() - 0.5) * TreeConfig.area
      const z = (Math.random() - 0.5) * TreeConfig.area
      const height = TreeConfig.minHeight + Math.random() * (TreeConfig.maxHeight - TreeConfig.minHeight)
      const scaleBase = 0.8 + Math.random() * 0.6
      const rotation = Math.random() * Math.PI * 2

      // Trunk
      trunks.push({
        position: [x, 0, z],
        scale: [scaleBase, height / 15, scaleBase],
        rotation: [0, rotation, 0]
      })

      // Canopy Clusters (Leaves)
      // Increase cluster count for density
      const clusterCount = 12 + Math.floor(Math.random() * 8)

      for (let c = 0; c < clusterCount; c++) {
          const clusterH = height * (0.6 + Math.random() * 0.4) // Top 40%
          // Dist from center - wider at bottom of canopy
          const rMax = 5 * scaleBase * (1.0 - (clusterH - height*0.6)/(height*0.4) * 0.5)
          const r = Math.random() * rMax
          const theta = Math.random() * Math.PI * 2

          const cx = x + Math.cos(theta) * r
          const cz = z + Math.sin(theta) * r
          const cy = clusterH

          leaves.push({
              position: [cx, cy, cz],
              rotation: [Math.random()*0.5, Math.random()*Math.PI*2, Math.random()*0.5],
              scale: 0.8 + Math.random() * 0.5,
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
        <barkMaterial uScale={4.0} uColor={new THREE.Color("#3d2817")} />
        {trunks.map((data, i) => (
          <Instance key={`trunk-${i}`} position={data.position} scale={data.scale} rotation={data.rotation} />
        ))}
      </Instances>

      {/* Leaves */}
      <Instances range={leaves.length} geometry={leafClusterGeo} castShadow receiveShadow>
        <LeafMaterial color="#ffffff" />
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
