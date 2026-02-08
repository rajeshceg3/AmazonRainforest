import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

const WaterLilies = ({ count = 40 }) => {
  const lilyData = useMemo(() => {
    return new Array(count).fill().map(() => {
      // In the water, avoiding center slightly for river flow?
      const x = (Math.random() - 0.5) * 12
      const z = (Math.random() - 0.5) * 400
      const scale = 0.5 + Math.random() * 0.5
      const y = -0.49 // Just above water

      const rotation = [-Math.PI / 2, 0, Math.random() * Math.PI * 2]

      return { position: [x, y, z], scale, rotation }
    })
  }, [count])

  return (
    <Instances range={count}>
      <circleGeometry args={[1, 16]} />
      <meshStandardMaterial color="#2d5a27" roughness={0.3} side={THREE.DoubleSide} />
      {lilyData.map((data, i) => (
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

export default WaterLilies
