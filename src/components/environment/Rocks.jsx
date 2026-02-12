import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { RockMaterial } from '../shaders/RockMaterial'

const Rocks = ({ count = 60 }) => {
  const rockData = useMemo(() => {
    return new Array(count).fill().map(() => {
      // Position along the river banks
      // River is at X=0, width approx +/- 8
      const side = Math.random() > 0.5 ? 1 : -1
      const x = (8 + Math.random() * 8) * side
      const z = (Math.random() - 0.5) * 400
      const scale = 0.5 + Math.random() * 1.5
      const y = -0.5 + scale * 0.3 // Partially submerged or on bank

      const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]

      return { position: [x, y, z], scale, rotation }
    })
  }, [count])

  return (
    <Instances range={count}>
      <sphereGeometry args={[1, 64, 64]} />
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
