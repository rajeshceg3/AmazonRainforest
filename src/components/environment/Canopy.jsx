import { useMemo } from 'react'
import { extend } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import BarkMaterial from '../shaders/BarkMaterial'

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

const LeafGeometry = () => {
    return useMemo(() => {
        // Cross planes for volume
        const geo = new THREE.BufferGeometry()
        const scale = 1.0

        // Plane 1
        const v1 = [
            -scale, -scale, 0,
             scale, -scale, 0,
             scale,  scale, 0,
            -scale, -scale, 0,
             scale,  scale, 0,
            -scale,  scale, 0
        ]
        // Plane 2 (Rotated 90 deg Y)
        const v2 = [
            0, -scale, -scale,
            0, -scale,  scale,
            0,  scale,  scale,
            0, -scale, -scale,
            0,  scale,  scale,
            0,  scale, -scale
        ]
        const vertices = [...v1, ...v2]
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        geo.computeVertexNormals()
        return geo
    }, [])
}

const Canopy = () => {
  const trunkGeo = WobblyTrunkGeometry()
  const leafGeo = LeafGeometry()

  const { trunks, leaves } = useMemo(() => {
    const trunks = []
    const leaves = []
    const leafColors = ["#1a4d1a", "#2d5a27", "#3e6b30", "#0f330f"]

    for (let i = 0; i < TreeConfig.count; i++) {
      const x = (Math.random() - 0.5) * TreeConfig.area
      const z = (Math.random() - 0.5) * TreeConfig.area
      const height = TreeConfig.minHeight + Math.random() * (TreeConfig.maxHeight - TreeConfig.minHeight)
      const scaleBase = 0.8 + Math.random() * 0.6
      const rotation = Math.random() * Math.PI * 2

      // Trunk
      trunks.push({
        position: [x, 0, z], // Pivot is at bottom
        scale: [scaleBase, height / 15, scaleBase], // 15 is ref height
        rotation: [0, rotation, 0]
      })

      // Canopy Clusters (Leaves)
      const clusterCount = 4 + Math.floor(Math.random() * 5)

      for (let c = 0; c < clusterCount; c++) {
          const clusterH = height * (0.5 + Math.random() * 0.5) // Top 50%
          // Dist from center
          const r = Math.random() * 4 * scaleBase
          const theta = Math.random() * Math.PI * 2

          const cx = x + Math.cos(theta) * r
          const cz = z + Math.sin(theta) * r
          const cy = clusterH

          const leavesInCluster = 25
          for(let L=0; L<leavesInCluster; L++) {
             // sphere distribution around cluster center
             const lr = Math.random() * 2.0
             const ltheta = Math.random() * Math.PI * 2
             const lphi = Math.random() * Math.PI

             leaves.push({
                 position: [
                     cx + lr * Math.sin(lphi) * Math.cos(ltheta),
                     cy + lr * Math.sin(lphi) * Math.sin(ltheta),
                     cz + lr * Math.cos(lphi)
                 ],
                 rotation: [Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI],
                 scale: 0.5 + Math.random() * 0.8,
                 color: leafColors[Math.floor(Math.random() * leafColors.length)]
             })
          }
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
      <Instances range={leaves.length} geometry={leafGeo} castShadow receiveShadow>
        <meshStandardMaterial side={THREE.DoubleSide} transparent opacity={0.95} alphaTest={0.5} />
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
