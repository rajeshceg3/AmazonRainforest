import React, { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import { LeafMaterial } from '../shaders/LeafMaterial'

// Bromeliad Geometry
const EpiphyteGeometry = () => {
    return useMemo(() => {
        // Single Leaf: Long, tapered, curved
        const leaf = new THREE.PlaneGeometry(0.5, 2.0, 3, 6)
        leaf.translate(0, 1.0, 0) // Pivot bottom

        const pos = leaf.attributes.position
        const v = new THREE.Vector3()

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)

            // Taper width at top
            const yNorm = v.y / 2.0
            const widthScale = 1.0 - Math.pow(yNorm, 0.5)
            v.x *= widthScale

            // Curve out (Bend back)
            // z = y^2
            v.z += Math.pow(yNorm, 2.0) * 0.8

            // Curve cross-section (Gutter shape)
            v.z += Math.pow(Math.abs(v.x), 2.0) * 2.0

            pos.setXYZ(i, v.x, v.y, v.z)
        }
        leaf.computeVertexNormals()

        // Cluster (Rosette)
        const cluster = new THREE.BufferGeometry()
        const leafCount = 12
        const geometries = []
        const dummy = new THREE.Object3D()

        for(let i=0; i<leafCount; i++) {
            const l = leaf.clone()

            const angle = (i / leafCount) * Math.PI * 2
            dummy.rotation.set(Math.PI * 0.2, angle, 0) // Tilt out
            dummy.updateMatrix()
            l.applyMatrix4(dummy.matrix)

            geometries.push(l)
        }

        // Flower spike in center (Red cylinder/cone)
        // ... simplicity, just leaves for now, maybe vertex color for center?

        // Merge
        // (Similar merge logic as before or import utils if available, but I'll inline for safety)
        let totalVerts = 0
        geometries.forEach(g => totalVerts += g.attributes.position.count)

        const mergedPos = new Float32Array(totalVerts * 3)
        const mergedNorm = new Float32Array(totalVerts * 3)
        const mergedUV = new Float32Array(totalVerts * 2)
        const indices = []
        let offset = 0

        geometries.forEach(g => {
            mergedPos.set(g.attributes.position.array, offset * 3)
            mergedNorm.set(g.attributes.normal.array, offset * 3)
            mergedUV.set(g.attributes.uv.array, offset * 2)

            const idx = g.index ? g.index.array : []
            // Triangulate if no index? PlaneGeometry has index.
             for(let j=0; j<g.index.count; j++) {
                indices.push(g.index.array[j] + offset)
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

const Epiphytes = ({ trunks = [] }) => {
    const geo = EpiphyteGeometry()

    // Generate instances on trunks
    const instances = useMemo(() => {
        const arr = []
        if (!trunks || trunks.length === 0) return arr

        trunks.forEach(trunk => {
            // Chance to have epiphytes
            if (Math.random() > 0.4) {
                const count = 1 + Math.floor(Math.random() * 3)
                for(let i=0; i<count; i++) {
                    // Random height on trunk
                    // Trunk scale.y is height. Position is center?
                    // Canopy trunks: scale=[width, height, width], position=[x, y_base, z] usually?
                    // Let's assume passed trunk data is consistent with Canopy.jsx logic
                    // Canopy: position is [x, terrainH, z], scale is [w, h, w]. Pivot is bottom (geo translated).

                    const h = trunk.scale[1]
                    const yOffset = 2.0 + Math.random() * (h - 5.0) // Start above ground

                    if (yOffset > h) continue

                    const theta = Math.random() * Math.PI * 2
                    const r = trunk.scale[0] * 0.3 // Radius approx

                    const ex = Math.sin(theta) * r * 0.8
                    const ez = Math.cos(theta) * r * 0.8

                    arr.push({
                        position: [trunk.position[0] + ex, trunk.position[1] + yOffset, trunk.position[2] + ez],
                        rotation: [Math.random()*0.5, theta, Math.random()*0.5],
                        scale: 1.5 + Math.random() * 1.0,
                        color: new THREE.Color().setHSL(Math.random()*0.1 + 0.0, 0.8, 0.5) // Reddish/Orange/Green
                    })
                }
            }
        })
        return arr
    }, [trunks])

    return (
        <Instances range={instances.length} geometry={geo} castShadow receiveShadow>
            <LeafMaterial uUseAlphaMask={1.0} uWindStrength={0.2} />
            {instances.map((data, i) => (
                <Instance
                    key={i}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                    color={data.color}
                />
            ))}
        </Instances>
    )
}

export default Epiphytes
