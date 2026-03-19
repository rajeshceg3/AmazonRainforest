import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { LilyPadMaterial } from '../shaders/LilyPadMaterial'

const WaterLilies = ({ count = 40 }) => {
  const lilyData = useMemo(() => {
    return new Array(count).fill().map(() => {
      // In the water, avoiding center slightly for river flow?
      const x = (Math.random() - 0.5) * 12
      const z = (Math.random() - 0.5) * 400
      const scale = 0.5 + Math.random() * 0.5
      const y = -0.48 // Just above water (water is -0.5)

      const rotation = [-Math.PI / 2, 0, Math.random() * Math.PI * 2]

      return { position: [x, y, z], scale, rotation }
    })
  }, [count])

  const geometry = useMemo(() => {
      // Pac-man shape: Circle with a wedge missing
      // Radius 1, 32 segments, start angle 0.3, length 2PI - 0.6
      const geo = new THREE.CircleGeometry(1, 32, 0.3, Math.PI * 2 - 0.6)
      // Add global bounding sphere to encompass all lilies so frustum culling works correctly
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 400)
      // UVs are automatically generated for CircleGeometry (radial or planar?)
      // CircleGeometry UVs: center is 0.5,0.5. Rim is circle.
      // This works perfectly for my shader logic (radial distance).
      return geo
  }, [])

  return (
    <Instances range={count} geometry={geometry}>
      <LilyPadMaterial />
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
