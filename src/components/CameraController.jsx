import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

const CameraController = () => {
  const target = useRef(new THREE.Vector3(0, 2, 0)) // LookAt target

  // Target positions (for lerping)
  const cameraY = useRef(10) // Start higher for better view
  const cameraX = useRef(0)
  const cameraZ = useRef(10) // Initial Z offset

  // Smoothed actual position (for physics/bob)
  const smoothedPos = useRef(new THREE.Vector3(0, 10, 10))

  // Look Around State
  const pitch = useRef(0) // Up/Down offset
  const yaw = useRef(0)   // Left/Right offset

  // Bobbing State
  const bobTime = useRef(0)

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

      if (e.buttons === 2 || e.shiftKey) {
          // Right-Click Drag: Look Around (Pitch/Yaw)
          // Yaw (X motion) -> Rotate view left/right
          yaw.current -= deltaX * 0.5
          // Pitch (Y motion) -> Rotate view up/down
          pitch.current += deltaY * 0.5

          // Clamp look angles (approximate units)
          pitch.current = Math.min(Math.max(pitch.current, -10), 30) // Allow looking up at canopy (30)
          yaw.current = Math.min(Math.max(yaw.current, -30), 30)
      } else {
          // Left-Click Drag: Move Position
          // Drag left/right -> Move X
          cameraX.current += deltaX
          // Drag up/down -> Move Z
          cameraZ.current += deltaY

          // Clamp to world bounds (-200 to 200)
          cameraX.current = Math.min(Math.max(cameraX.current, -200), 200)
          cameraZ.current = Math.min(Math.max(cameraZ.current, -200), 200)
      }

      lastMouseX.current = e.clientX
      lastMouseY.current = e.clientY
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    // Context Menu prevent default
    const handleContextMenu = (e) => {
        e.preventDefault()
    }

    // Touch support (Basic move only for now)
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
    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  useFrame((state) => {
    // 1. Lerp Smoothed Position towards Target Position
    smoothedPos.current.x = THREE.MathUtils.lerp(smoothedPos.current.x, cameraX.current, 0.05)
    smoothedPos.current.y = THREE.MathUtils.lerp(smoothedPos.current.y, cameraY.current, 0.05)
    smoothedPos.current.z = THREE.MathUtils.lerp(smoothedPos.current.z, cameraZ.current, 0.05)

    // 2. Calculate Velocity for Head Bob
    // Speed is distance between current smooth pos and target pos (proxy for movement intensity)
    const dx = cameraX.current - smoothedPos.current.x
    const dz = cameraZ.current - smoothedPos.current.z
    const speed = Math.sqrt(dx*dx + dz*dz)

    let bobOffset = 0
    // Only bob if moving fast enough and near ground (walking)
    // If flying high (drone), no bob? Or slight banking?
    // Let's keep bob for "physical" feel everywhere, but reduce it at height?
    if (speed > 0.1) {
        bobTime.current += speed * 0.5 // Adjust frequency
        // Amplitude based on speed
        const amp = Math.min(speed * 0.1, 0.2)
        bobOffset = Math.sin(bobTime.current) * amp
    } else {
        // Decay bob to 0? Or just stop.
        // Snap to 0 slowly?
        // For simplicity, just stop adding to bobTime, offset freezes/cycles.
        // Ideally we lerp amplitude to 0.
        bobOffset = Math.sin(bobTime.current) * 0.0 // No bob when still
    }

    // 3. Apply Position + Bob
    state.camera.position.copy(smoothedPos.current)
    state.camera.position.y += bobOffset

    // 4. Calculate LookAt Target
    // Dynamic pitch based on altitude (Base behavior)
    // At low altitude (y=1), we look forward (z-20)
    // At high altitude (y=40), we look down (z-5)
    const t = THREE.MathUtils.clamp((state.camera.position.y - 1) / 39, 0, 1)
    const baseLookZ = THREE.MathUtils.lerp(-20, -5, t)
    const baseLookY = Math.max(0, state.camera.position.y - 5)

    // Add User Pitch/Yaw
    target.current.set(
        state.camera.position.x + yaw.current,
        baseLookY + pitch.current,
        state.camera.position.z + baseLookZ
    )

    state.camera.lookAt(target.current)
  })

  return null
}

export default CameraController
