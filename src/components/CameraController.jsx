import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

const CameraController = () => {
  const target = useRef(new THREE.Vector3(0, 2, 0)) // LookAt target
  const cameraY = useRef(2) // Target Y position of camera

  useEffect(() => {
    const handleScroll = (e) => {
      // Sensitivity
      const delta = e.deltaY * 0.01
      // Clamp between River/Floor (1) and Canopy (25)
      cameraY.current = Math.min(Math.max(cameraY.current + delta, 1), 25)
    }

    // Also handle touch for mobile
    let touchStartY = 0
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }
    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY
      const delta = (touchStartY - touchY) * 0.05
      cameraY.current = Math.min(Math.max(cameraY.current + delta, 1), 25)
      touchStartY = touchY
    }

    window.addEventListener('wheel', handleScroll)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Smooth interpolation for Y
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, cameraY.current, 0.05)

    // Slow drift in X and Z
    // Amount of drift depends on height (more movement in canopy)
    const driftScale = 0.5 + (state.camera.position.y / 25) * 0.5

    state.camera.position.x = Math.sin(time * 0.2) * 2 * driftScale
    state.camera.position.z = 10 + Math.cos(time * 0.1) * 2

    // Look at target logic
    // We want to look slightly ahead but mostly level, maybe slightly down
    target.current.x = Math.sin(time * 0.3) * 0.5
    target.current.y = state.camera.position.y * 0.9 // Look slightly down relative to camera
    target.current.z = 0

    state.camera.lookAt(target.current)
  })

  return null
}

export default CameraController
