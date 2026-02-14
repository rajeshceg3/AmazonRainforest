import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FallingLeaves = ({ count = 300 }) => {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Store position and speed for each leaf
  const data = useMemo(() => {
      return new Array(count).fill().map(() => ({
          x: (Math.random() - 0.5) * 400,
          y: Math.random() * 40,
          z: (Math.random() - 0.5) * 400,
          speed: 0.02 + Math.random() * 0.05,
          rotSpeedX: (Math.random() - 0.5) * 2,
          rotSpeedY: (Math.random() - 0.5) * 2,
          phase: Math.random() * Math.PI * 2
      }))
  }, [count])

  useFrame((state, delta) => {
      if (!mesh.current) return

      const time = state.clock.elapsedTime

      data.forEach((d, i) => {
          // Fall
          d.y -= d.speed

          // Reset
          if (d.y < -1) { // Let it go slightly underground
              d.y = 40
              d.x = (Math.random() - 0.5) * 400
              d.z = (Math.random() - 0.5) * 400
          }

          // Drift (Swaying back and forth)
          const drift = Math.sin(time * 0.5 + d.phase) * 0.02
          d.x += drift
          d.z += Math.cos(time * 0.3 + d.phase) * 0.01

          // Rotation (Tumbling)
          dummy.position.set(d.x, d.y, d.z)
          dummy.rotation.set(
              time * d.rotSpeedX,
              time * d.rotSpeedY,
              Math.sin(time + d.phase) // Flutter
          )
          dummy.scale.setScalar(1.0)

          dummy.updateMatrix()
          mesh.current.setMatrixAt(i, dummy.matrix)
      })
      mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false}>
      <planeGeometry args={[0.3, 0.4]} />
      <meshBasicMaterial color="#d49b5c" side={THREE.DoubleSide} transparent opacity={0.8} />
    </instancedMesh>
  )
}

export default FallingLeaves
