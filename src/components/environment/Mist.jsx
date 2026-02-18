import React from 'react'
import { Cloud } from '@react-three/drei'

const Mist = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Low lying river mist - concentrated along Z axis at X=0 */}
      <Cloud
        opacity={0.05} // Reduced opacity significantly as camera is inside the volume
        speed={0.08} // Slow drift
        width={15} // Narrow spread along X (River width)
        depth={120} // Long spread along Z
        segments={20} // Reduced segments to avoid overdraw
        position={[0, 1.5, 0]} // Just above water
        color="#cceeff" // Slightly blueish
        depthTest={true}
      />

      {/* General atmospheric ground haze */}
      <Cloud
        opacity={0.05}
        speed={0.04}
        width={100} // Wide area
        depth={100}
        segments={15} // Sparse
        position={[20, 4, 20]} // Offset slightly
        color="#ffffff"
        depthTest={true}
      />

      <Cloud
        opacity={0.05}
        speed={0.04}
        width={100} // Wide area
        depth={100}
        segments={15} // Sparse
        position={[-20, 4, -20]} // Offset slightly
        color="#ffffff"
        depthTest={true}
      />
    </group>
  )
}

export default Mist
