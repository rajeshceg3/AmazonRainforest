import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'

const ForestFloor = () => {
  const count = 100
  return (
    <group>
      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a2e1a" />
      </mesh>

      {/* Basic Foliage using Instances */}
      <Instances range={count}>
        <coneGeometry args={[0.2, 1, 3]} />
        <meshStandardMaterial color="#2d5a27" />
        {Array.from({ length: count }).map((_, i) => (
          <Instance
            key={i}
            position={[
              (Math.random() - 0.5) * 40,
              0.5,
              (Math.random() - 0.5) * 40
            ]}
            rotation={[0, Math.random() * Math.PI, 0]}
            scale={0.5 + Math.random()}
          />
        ))}
      </Instances>
    </group>
  )
}

export default ForestFloor
