import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

const CameraController = () => {
  const target = useRef(new THREE.Vector3(0, 2, 0)) // LookAt target
  const cameraY = useRef(10) // Start higher for better view
  const cameraX = useRef(0)
  const cameraZ = useRef(10) // Initial Z offset

  // Movement state
  const isDragging = useRef(false)
  const lastMouseX = useRef(0)
  const lastMouseY = useRef(0)

  useEffect(() => {
    const handleScroll = (e) => {
      // Sensitivity
      const delta = e.deltaY * 0.01
      // Clamp between River/Floor (1) and Canopy (40 - increased ceiling)
      cameraY.current = Math.min(Math.max(cameraY.current + delta, 1), 40)
    }

    const handleMouseDown = (e) => {
      isDragging.current = true
      lastMouseX.current = e.clientX
      lastMouseY.current = e.clientY
    }

    const handleMouseMove = (e) => {
      if (!isDragging.current) return

      const deltaX = (e.clientX - lastMouseX.current) * 0.1
      const deltaY = (e.clientY - lastMouseY.current) * 0.1

      // Dragging moves the camera in X and Z
      // Drag left/right -> Move X (Standard Push/Drone controls)
      cameraX.current += deltaX
      // Drag up/down -> Move Z (Standard Push/Drone controls)
      cameraZ.current += deltaY

      // Clamp to world bounds (-200 to 200)
      cameraX.current = Math.min(Math.max(cameraX.current, -200), 200)
      cameraZ.current = Math.min(Math.max(cameraZ.current, -200), 200)

      lastMouseX.current = e.clientX
      lastMouseY.current = e.clientY
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    // Touch support
    const handleTouchStart = (e) => {
      isDragging.current = true
      lastMouseX.current = e.touches[0].clientX
      lastMouseY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e) => {
      if (!isDragging.current) return

      const clientX = e.touches[0].clientX
      const clientY = e.touches[0].clientY

      const deltaX = (clientX - lastMouseX.current) * 0.1
      const deltaY = (clientY - lastMouseY.current) * 0.1

      cameraX.current += deltaX
      cameraZ.current += deltaY

      cameraX.current = Math.min(Math.max(cameraX.current, -200), 200)
      cameraZ.current = Math.min(Math.max(cameraZ.current, -200), 200)

      lastMouseX.current = clientX
      lastMouseY.current = clientY
    }

    const handleTouchEnd = () => {
      isDragging.current = false
    }

    window.addEventListener('wheel', handleScroll)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  useFrame((state) => {
    // Smooth interpolation
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, cameraX.current, 0.05)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, cameraY.current, 0.05)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraZ.current, 0.05)

    // Dynamic pitch based on altitude
    // At low altitude (y=1), we look forward (z-20) for immersion (horizon view).
    // At high altitude (y=40), we look closer to vertical (z-5) for map view.
    const t = THREE.MathUtils.clamp((state.camera.position.y - 1) / 39, 0, 1)
    const lookOffsetZ = THREE.MathUtils.lerp(-20, -5, t)

    target.current.set(
        state.camera.position.x,
        Math.max(0, state.camera.position.y - 5), // Look at ground or lower
        state.camera.position.z + lookOffsetZ
    )

    state.camera.lookAt(target.current)
  })

  return null
}

export default CameraController
