import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getTerrainHeight } from '../utils/TerrainHeight'

const WALK_SPEED = 4.0
const RUN_SPEED = 10.0
const LOOK_SPEED = 0.002
const TOUCH_LOOK_SPEED = 0.005
const JUMP_FORCE = 8.0
const GRAVITY = 20.0
const DAMPING = 8.0 // Reduced for weightier feel
const ACCEL = 50.0 // Adjusted for smoother acceleration
const INPUT_SMOOTHING = 8.0 // Lerp speed for input ramping
const TOUCH_DEADZONE = 35
const TOUCH_JOYSTICK_MAX_DIST = 50

// Reusable objects for useFrame
const _moveDir = new THREE.Vector3()
const _euler = new THREE.Euler(0, 0, 0, 'YXZ')

const CameraController = () => {
  const { camera, gl } = useThree()

  // State
  const isLocked = useRef(false)
  const isDragging = useRef(false)
  const dragStart = useRef(new THREE.Vector2())
  const lastMousePos = useRef(new THREE.Vector2())
  const hasDragged = useRef(false)
  const moveState = useRef({
    forward: 0, backward: 0, left: 0, right: 0,
    sprint: false, jump: false
  })

  // Physics & Input State
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const currentInput = useRef(new THREE.Vector2()) // Smoothed input (x=right, y=forward)
  const targetInput = useRef(new THREE.Vector2())  // Raw target input

  // Camera Orientation
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const targetEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  // Touch State
  const touchLeftId = useRef(null)
  const touchRightId = useRef(null)
  const touchLeftStart = useRef(new THREE.Vector2())
  const touchRightStart = useRef(new THREE.Vector2())
  const touchLeftCurrent = useRef(new THREE.Vector2())
  const touchRightCurrent = useRef(new THREE.Vector2())

  // FX State
  const bobPhase = useRef(0)
  const currentRoll = useRef(0)

  // Track if user has moved yet
  const hasDispatchedMove = useRef(false)

  // Initialize camera rotation from current camera
  useEffect(() => {
    euler.current.setFromQuaternion(camera.quaternion)
    euler.current.z = 0
    targetEuler.current.copy(euler.current)

    // Ensure touch actions don't trigger browser gestures
    gl.domElement.style.touchAction = 'none'
  }, [camera, gl])

  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = 1; break
        case 'KeyS': case 'ArrowDown': moveState.current.backward = 1; break
        case 'KeyA': case 'ArrowLeft': moveState.current.left = 1; break
        case 'KeyD': case 'ArrowRight': moveState.current.right = 1; break
        case 'ShiftLeft': case 'ShiftRight': moveState.current.sprint = true; break
        case 'Space':
          if(!moveState.current.jump) {
             velocity.current.y = JUMP_FORCE
             moveState.current.jump = true
          }
          break
      }
    }

    const onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = 0; break
        case 'KeyS': case 'ArrowDown': moveState.current.backward = 0; break
        case 'KeyA': case 'ArrowLeft': moveState.current.left = 0; break
        case 'KeyD': case 'ArrowRight': moveState.current.right = 0; break
        case 'ShiftLeft': case 'ShiftRight': moveState.current.sprint = false; break
      }
    }

    const onMouseDown = (e) => {
      if (!isLocked.current) {
        isDragging.current = true
        dragStart.current.set(e.clientX, e.clientY)
        lastMousePos.current.set(e.clientX, e.clientY)
        hasDragged.current = false
      }
    }

    const onMouseUp = () => {
      isDragging.current = false
    }

    const onMouseMove = (e) => {
      if (isLocked.current) {
        targetEuler.current.y -= e.movementX * LOOK_SPEED
        targetEuler.current.x -= e.movementY * LOOK_SPEED
        targetEuler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetEuler.current.x))
      } else if (isDragging.current) {
        const dx = e.clientX - lastMousePos.current.x
        const dy = e.clientY - lastMousePos.current.y

        // Use touch look speed for drag as it's pixel based
        targetEuler.current.y -= dx * TOUCH_LOOK_SPEED
        targetEuler.current.x -= dy * TOUCH_LOOK_SPEED
        targetEuler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetEuler.current.x))

        lastMousePos.current.set(e.clientX, e.clientY)

        if (Math.abs(e.clientX - dragStart.current.x) > 5 || Math.abs(e.clientY - dragStart.current.y) > 5) {
          hasDragged.current = true
        }
      }
    }

    const onClick = () => {
      if (!document.pointerLockElement && !hasDragged.current) {
        gl.domElement.requestPointerLock()
      }
    }

    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement
    }

    // Touch Handlers
    const onTouchStart = (e) => {
      // Prevent default to stop scrolling/zooming
      if (e.cancelable) e.preventDefault()

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        const splitX = window.innerWidth * 0.3 // 30% left for move, 70% right for look

        // Left Side -> Move (Virtual Stick)
        if (t.clientX < splitX && touchLeftId.current === null) {
          touchLeftId.current = t.identifier
          touchLeftStart.current.set(t.clientX, t.clientY)
          touchLeftCurrent.current.set(t.clientX, t.clientY)
        }
        // Right Side -> Look (Drag)
        else if (t.clientX >= splitX && touchRightId.current === null) {
          touchRightId.current = t.identifier
          touchRightStart.current.set(t.clientX, t.clientY)
          touchRightCurrent.current.set(t.clientX, t.clientY)
        }
      }
    }

    const onTouchMove = (e) => {
      if (e.cancelable) e.preventDefault()

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]

        // Update Left Stick
        if (t.identifier === touchLeftId.current) {
            touchLeftCurrent.current.set(t.clientX, t.clientY)
        }

        // Update Right Look
        if (t.identifier === touchRightId.current) {
            const dx = t.clientX - touchRightCurrent.current.x
            const dy = t.clientY - touchRightCurrent.current.y

            // Apply directly to targetEuler for responsiveness
            targetEuler.current.y -= dx * TOUCH_LOOK_SPEED
            targetEuler.current.x -= dy * TOUCH_LOOK_SPEED
            targetEuler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetEuler.current.x))

            touchRightCurrent.current.set(t.clientX, t.clientY)
        }
      }
    }

    const onTouchEnd = (e) => {
      if (e.cancelable) e.preventDefault()

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchLeftId.current) {
          touchLeftId.current = null
          touchLeftStart.current.set(0,0)
          touchLeftCurrent.current.set(0,0)
        }
        if (t.identifier === touchRightId.current) {
          touchRightId.current = null
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    gl.domElement.addEventListener('click', onClick)
    gl.domElement.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    gl.domElement.addEventListener('touchstart', onTouchStart, { passive: false })
    gl.domElement.addEventListener('touchmove', onTouchMove, { passive: false })
    gl.domElement.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      gl.domElement.removeEventListener('click', onClick)
      gl.domElement.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      gl.domElement.removeEventListener('touchstart', onTouchStart)
      gl.domElement.removeEventListener('touchmove', onTouchMove)
      gl.domElement.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl])

  useFrame((state, delta) => {
    // 1. Calculate Raw Target Input
    const kbdForward = moveState.current.forward - moveState.current.backward
    const kbdRight = moveState.current.right - moveState.current.left

    // Touch Input (Virtual Stick) with Curve
    let touchForward = 0
    let touchRight = 0

    if (touchLeftId.current !== null) {
        const rawDx = touchLeftCurrent.current.x - touchLeftStart.current.x
        const rawDy = touchLeftCurrent.current.y - touchLeftStart.current.y

        const dist = Math.sqrt(rawDx*rawDx + rawDy*rawDy)

        if (dist > TOUCH_DEADZONE) {
            // Normalize direction
            const normX = rawDx / dist
            const normY = rawDy / dist

            // Calculate magnitude (0 to 1)
            const magnitude = Math.min((dist - TOUCH_DEADZONE) / (TOUCH_JOYSTICK_MAX_DIST - TOUCH_DEADZONE), 1.0)

            // Apply squared curve for fine control
            const curvedMag = magnitude * magnitude

            touchRight = normX * curvedMag
            touchForward = -normY * curvedMag
        }
    }

    // Combine Inputs
    targetInput.current.x = THREE.MathUtils.clamp(kbdRight + touchRight, -1, 1)
    targetInput.current.y = THREE.MathUtils.clamp(kbdForward + touchForward, -1, 1)

    // Normalize if length > 1 to prevent faster diagonal movement
    if (targetInput.current.lengthSq() > 1) {
        targetInput.current.normalize()
    }

    // 2. Smooth Input
    currentInput.current.x = THREE.MathUtils.lerp(currentInput.current.x, targetInput.current.x, delta * INPUT_SMOOTHING)
    currentInput.current.y = THREE.MathUtils.lerp(currentInput.current.y, targetInput.current.y, delta * INPUT_SMOOTHING)

    // Direction relative to camera yaw
    direction.current.set(0, 0, 0)
    if (Math.abs(currentInput.current.x) > 0.001 || Math.abs(currentInput.current.y) > 0.001) {
        _moveDir.set(currentInput.current.x, 0, -currentInput.current.y)
        _euler.set(0, euler.current.y, 0)
        _moveDir.applyEuler(_euler)
        direction.current.copy(_moveDir) // Do not normalize, keep magnitude for speed control!

        // Dispatch event on first real movement to hide hints
        if (!hasDispatchedMove.current) {
            hasDispatchedMove.current = true
            window.dispatchEvent(new CustomEvent('userMoved'))
        }
    }

    // 3. Physics & Velocity
    const speed = moveState.current.sprint ? RUN_SPEED : WALK_SPEED

    // Apply acceleration based on smoothed direction magnitude
    if (direction.current.lengthSq() > 0.0001) {
        velocity.current.x += direction.current.x * ACCEL * delta
        velocity.current.z += direction.current.z * ACCEL * delta
    }

    velocity.current.x -= velocity.current.x * DAMPING * delta
    velocity.current.z -= velocity.current.z * DAMPING * delta

    // Cap horizontal speed
    const hSpeed = Math.sqrt(velocity.current.x**2 + velocity.current.z**2)
    // Dynamic max speed based on input magnitude (allows slow walking)
    const inputMag = currentInput.current.length()
    const currentMaxSpeed = speed * Math.max(inputMag, 0.2) // prevent 0 max speed

    if (hSpeed > currentMaxSpeed) {
        const ratio = currentMaxSpeed / hSpeed
        velocity.current.x *= ratio
        velocity.current.z *= ratio
    }

    velocity.current.y -= GRAVITY * delta

    // 4. Update Position
    camera.position.x += velocity.current.x * delta
    camera.position.z += velocity.current.z * delta
    camera.position.y += velocity.current.y * delta

    // 5. Terrain Collision
    const terrainH = getTerrainHeight(camera.position.x, camera.position.z)
    const eyeH = terrainH + 1.8

    if (camera.position.y < eyeH) {
        camera.position.y = eyeH
        velocity.current.y = 0
        moveState.current.jump = false
    }

    // 6. FX: Head Bob
    // Only bob if actually moving and on ground
    if (hSpeed > 0.5 && camera.position.y <= eyeH + 0.1) {
        const bobFreq = moveState.current.sprint ? 18 : 12
        const bobAmp = (moveState.current.sprint ? 0.15 : 0.08) * (hSpeed / speed) // Scale bob by speed
        bobPhase.current += delta * bobFreq
        camera.position.y += Math.sin(bobPhase.current) * bobAmp
    }

    // 7. FX: Banking
    const targetRoll = -currentInput.current.x * 0.05
    currentRoll.current = THREE.MathUtils.lerp(currentRoll.current, targetRoll, 5.0 * delta)
    euler.current.z = currentRoll.current

    // 8. Apply Rotation
    // Smooth Look (Slower lerp for weight)
    euler.current.x = THREE.MathUtils.lerp(euler.current.x, targetEuler.current.x, 10.0 * delta)
    euler.current.y = THREE.MathUtils.lerp(euler.current.y, targetEuler.current.y, 10.0 * delta)

    camera.quaternion.setFromEuler(euler.current)

    // 9. World Bounds Clamp
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -200, 200)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -200, 200)
  })

  return null
}

export default CameraController
