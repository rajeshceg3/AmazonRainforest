import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const CameraController = () => {
  const target = useRef(new THREE.Vector3(0, 2, 0))

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Slow drift
    state.camera.position.x = Math.sin(time * 0.2) * 2
    state.camera.position.z = 10 + Math.cos(time * 0.1) * 2

    // Gentle head sway / look at drift
    target.current.x = Math.sin(time * 0.3) * 0.5
    target.current.y = 2 + Math.cos(time * 0.2) * 0.3

    state.camera.lookAt(target.current)
  })

  return null
}

export default CameraController
