import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { getTerrainHeight } from '../utils/TerrainHeight'

const CameraController = () => {
  const target = useRef(new THREE.Vector3(0, 2, 0)) // LookAt target
  const cameraY = useRef(10) // Start higher for better view
  const cameraX = useRef(0)
  const cameraZ = useRef(10) // Initial Z offset

  // Movement state
  const isDragging = useRef(false)
  const lastMouseX = useRef(0)
  const lastMouseY = useRef(0)

  // Keyboard State
  const keys = useRef({ w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false })

  // FX State
  const bobPhase = useRef(0)
  const currentRoll = useRef(0)

  useEffect(() => {
    const handleScroll = (e) => {
      // Sensitivity - Slowed down for smoother, weightier feel
      const delta = e.deltaY * 0.005
      // Clamp between River/Floor (1) and Canopy (40 - increased ceiling)
      cameraY.current = Math.min(Math.max(cameraY.current + delta, 1), 40)
    }

    const handleKeyDown = (e) => {
        if (keys.current.hasOwnProperty(e.key)) {
            keys.current[e.key] = true
        }
    }

    const handleKeyUp = (e) => {
        if (keys.current.hasOwnProperty(e.key)) {
            keys.current[e.key] = false
        }
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
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  useFrame((state, delta) => {
    // Keyboard Movement - Slowed to realistic walking pace (4.0 units/sec)
    const moveSpeed = 4.0 * delta // Units per second
    const vx = (keys.current.d || keys.current.ArrowRight ? 1 : 0) - (keys.current.a || keys.current.ArrowLeft ? 1 : 0)
    const vz = (keys.current.s || keys.current.ArrowDown ? 1 : 0) - (keys.current.w || keys.current.ArrowUp ? 1 : 0)

    // Update target position based on input
    cameraX.current += vx * moveSpeed
    cameraZ.current += vz * moveSpeed

    // Clamp X/Z to world bounds
    cameraX.current = Math.min(Math.max(cameraX.current, -200), 200)
    cameraZ.current = Math.min(Math.max(cameraZ.current, -200), 200)

    // Terrain Collision Logic
    const groundH = getTerrainHeight(cameraX.current, cameraZ.current)
    const minAlt = groundH + 1.8 // Eye level approx 1.8m

    // Soft clamp Y to stay above ground
    if (cameraY.current < minAlt) {
        cameraY.current = THREE.MathUtils.lerp(cameraY.current, minAlt, 10.0 * delta)
    }

    // Smooth interpolation - Increased inertia for physical presence
    // Increase lerp speed slightly for responsiveness if using keys, but keep it weighty
    const lerpSpeed = (vx !== 0 || vz !== 0) ? 3.0 * delta : 1.5 * delta

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, cameraX.current, lerpSpeed)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, cameraY.current, lerpSpeed)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraZ.current, lerpSpeed)

    // Head Bob (Only when close to ground and moving)
    const isMoving = vx !== 0 || vz !== 0
    const isLow = state.camera.position.y < 8 // Only bob when near ground

    if (isMoving && isLow) {
        bobPhase.current += delta * 14.0 // Walking frequency
        const bobY = Math.sin(bobPhase.current) * 0.15 // Amplitude
        state.camera.position.y += bobY
    }

    // Dynamic pitch based on altitude
    const t = THREE.MathUtils.clamp((state.camera.position.y - 1.8) / 38.2, 0, 1)
    const lookOffsetZ = THREE.MathUtils.lerp(-20, -5, t)

    target.current.set(
        state.camera.position.x,
        Math.max(groundH, state.camera.position.y - 5),
        state.camera.position.z + lookOffsetZ
    )

    state.camera.lookAt(target.current)

    // Banking (Roll) - Applied after lookAt
    const targetRoll = -vx * 0.05
    currentRoll.current = THREE.MathUtils.lerp(currentRoll.current, targetRoll, 5.0 * delta)
    state.camera.rotation.z = currentRoll.current
  })

  return null
}

export default CameraController
