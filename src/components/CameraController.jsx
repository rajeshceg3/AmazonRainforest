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
const DAMPING = 8.0
const ACCEL = 60.0

const CameraController = () => {
  const { camera, gl } = useThree()

  // State
  const isLocked = useRef(false)
  const moveState = useRef({
    forward: 0, backward: 0, left: 0, right: 0,
    sprint: false, jump: false
  })
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

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

  // Initialize camera rotation from current camera
  useEffect(() => {
    euler.current.setFromQuaternion(camera.quaternion)
    euler.current.z = 0

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

    const onMouseMove = (e) => {
      if (isLocked.current) {
        euler.current.y -= e.movementX * LOOK_SPEED
        euler.current.x -= e.movementY * LOOK_SPEED
        euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x))
      }
    }

    const onClick = () => {
      // Only lock if not using touch (avoid conflict on hybrid devices if needed, but usually fine)
      gl.domElement.requestPointerLock()
    }

    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement
    }

    // Touch Handlers
    const onTouchStart = (e) => {
      e.preventDefault()
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        const splitX = window.innerWidth * 0.4 // 40% left for move, 60% right for look

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
      e.preventDefault()
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchLeftId.current) {
            touchLeftCurrent.current.set(t.clientX, t.clientY)
        }
        if (t.identifier === touchRightId.current) {
            const dx = t.clientX - touchRightCurrent.current.x
            const dy = t.clientY - touchRightCurrent.current.y

            euler.current.y -= dx * TOUCH_LOOK_SPEED
            euler.current.x -= dy * TOUCH_LOOK_SPEED
            euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x))

            touchRightCurrent.current.set(t.clientX, t.clientY)
        }
      }
    }

    const onTouchEnd = (e) => {
      e.preventDefault()
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
    gl.domElement.addEventListener('touchstart', onTouchStart, { passive: false })
    gl.domElement.addEventListener('touchmove', onTouchMove, { passive: false })
    gl.domElement.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      gl.domElement.removeEventListener('click', onClick)
      gl.domElement.removeEventListener('touchstart', onTouchStart)
      gl.domElement.removeEventListener('touchmove', onTouchMove)
      gl.domElement.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl])

  useFrame((state, delta) => {
    // 1. Calculate Input Direction
    direction.current.set(0, 0, 0)

    // Keyboard Input
    const forward = moveState.current.forward - moveState.current.backward
    const right = moveState.current.right - moveState.current.left

    // Touch Input (Virtual Stick)
    let touchForward = 0
    let touchRight = 0

    if (touchLeftId.current !== null) {
        const dx = touchLeftCurrent.current.x - touchLeftStart.current.x
        const dy = touchLeftCurrent.current.y - touchLeftStart.current.y
        const maxDist = 50

        touchRight = THREE.MathUtils.clamp(dx / maxDist, -1, 1)
        touchForward = THREE.MathUtils.clamp(-dy / maxDist, -1, 1)
    }

    // Combine Inputs
    const fwd = THREE.MathUtils.clamp(forward + touchForward, -1, 1)
    const rgt = THREE.MathUtils.clamp(right + touchRight, -1, 1)

    // Direction relative to camera yaw
    if (fwd !== 0 || rgt !== 0) {
        const moveDir = new THREE.Vector3(rgt, 0, -fwd)
        moveDir.applyEuler(new THREE.Euler(0, euler.current.y, 0))
        direction.current.copy(moveDir).normalize()
    }

    // 2. Physics & Velocity
    const speed = moveState.current.sprint ? RUN_SPEED : WALK_SPEED
    const hasInput = fwd !== 0 || rgt !== 0

    if (hasInput) {
        velocity.current.x += direction.current.x * ACCEL * delta
        velocity.current.z += direction.current.z * ACCEL * delta
    }

    velocity.current.x -= velocity.current.x * DAMPING * delta
    velocity.current.z -= velocity.current.z * DAMPING * delta

    const hSpeed = Math.sqrt(velocity.current.x**2 + velocity.current.z**2)
    if (hSpeed > speed) {
        const ratio = speed / hSpeed
        velocity.current.x *= ratio
        velocity.current.z *= ratio
    }

    velocity.current.y -= GRAVITY * delta

    // 3. Update Position
    camera.position.x += velocity.current.x * delta
    camera.position.z += velocity.current.z * delta
    camera.position.y += velocity.current.y * delta

    // 4. Terrain Collision
    const terrainH = getTerrainHeight(camera.position.x, camera.position.z)
    const eyeH = terrainH + 1.8

    if (camera.position.y < eyeH) {
        camera.position.y = eyeH
        velocity.current.y = 0
        moveState.current.jump = false
    }

    // 5. FX: Head Bob
    if (hasInput && camera.position.y <= eyeH + 0.1) {
        const bobFreq = moveState.current.sprint ? 18 : 12
        const bobAmp = moveState.current.sprint ? 0.15 : 0.08
        bobPhase.current += delta * bobFreq
        camera.position.y += Math.sin(bobPhase.current) * bobAmp
    }

    // 6. FX: Banking
    const targetRoll = -rgt * 0.05
    currentRoll.current = THREE.MathUtils.lerp(currentRoll.current, targetRoll, 5.0 * delta)
    euler.current.z = currentRoll.current

    // 7. Apply Rotation
    camera.quaternion.setFromEuler(euler.current)

    // 8. World Bounds Clamp
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -200, 200)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -200, 200)
  })

  return null
}

export default CameraController
