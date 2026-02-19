import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { RockMaterial } from '../shaders/RockMaterial'

// Helper to create deformed rock geometry
const useRockGeometry = () => {
    return useMemo(() => {
        // High detail Icosahedron for base shape
        const geometry = new THREE.IcosahedronGeometry(1, 4) // detail 4 = ~2562 vertices

        const pos = geometry.attributes.position
        const v = new THREE.Vector3()

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i)

            // Deform shape using simple trig noise (pseudo-3D noise)
            const n1 = Math.sin(v.x * 2.0) * Math.cos(v.y * 2.0) * Math.sin(v.z * 2.0);
            const n2 = Math.cos(v.x * 5.0) * Math.sin(v.y * 5.0) * Math.cos(v.z * 5.0);

            // Large deformation
            const deformation = 1.0 + n1 * 0.3 + n2 * 0.1 + (Math.random() - 0.5) * 0.05;

            // Flatten bottom heavily to sit on ground
            if (v.y < -0.3) {
                 v.y *= 0.5;
                 // Add some spread at base
                 const spread = 1.0 + ((-0.3 - v.y) * 0.5);
                 v.x *= spread;
                 v.z *= spread;
            }

            v.multiplyScalar(deformation);
            pos.setXYZ(i, v.x, v.y, v.z)
        }

        geometry.computeVertexNormals()
        return geometry
    }, [])
}

const Rocks = ({ count = 60 }) => {
  const rockGeometry = useRockGeometry()

  const rockData = useMemo(() => {
    return new Array(count).fill().map(() => {
      // Position along the river banks
      // River is at X=0, width approx +/- 8
      const side = Math.random() > 0.5 ? 1 : -1

      // Distribute rocks naturally along banks
      const x = (8 + Math.random() * 8) * side
      const z = (Math.random() - 0.5) * 400

      const scaleBase = 0.5 + Math.random() * 1.5
      // Non-uniform scaling for variety
      const scale = [
          scaleBase * (0.8 + Math.random() * 0.4),
          scaleBase * (0.6 + Math.random() * 0.4), // Often flatter
          scaleBase * (0.8 + Math.random() * 0.4)
      ]

      const y = -0.5 + scaleBase * 0.2 // Partially submerged

      const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]

      return { position: [x, y, z], scale, rotation }
    })
  }, [count])

  return (
    <Instances range={count} geometry={rockGeometry} castShadow receiveShadow>
      <RockMaterial uScale={1.5} uColor={new THREE.Color("#4a4036")} uMossColor={new THREE.Color("#2d5a27")} />
      {rockData.map((data, i) => (
        <Instance
          key={i}
          position={data.position}
          scale={data.scale}
          rotation={data.rotation}
        />
      ))}
    </Instances>
  )
}

export default Rocks
