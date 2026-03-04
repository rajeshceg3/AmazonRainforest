import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SoundscapeManager } from './Soundscapes'

const AudioController = ({ started }) => {
  const { camera } = useThree()
  const managerRef = useRef(null)
  const lastPos = useRef(new THREE.Vector3())
  const lastY = useRef(10) // Init high

  useEffect(() => {
    if (!started) return

    // Initialize position to avoid startup pop
    lastPos.current.copy(camera.position)
    lastY.current = camera.position.y

    // Initialize the SoundscapeManager
    if (!managerRef.current) {
        managerRef.current = new SoundscapeManager()
        // Expose globally so entities can access master bus if needed (e.g. hummingbirds)
        window.soundscapeManager = managerRef.current
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.dispose()
        managerRef.current = null
        window.soundscapeManager = null
      }
    }
  }, [started])

  useFrame((state, delta) => {
    if (managerRef.current) {
      const currentPos = camera.position
      // Calculate speed (units per second)
      const dist = currentPos.distanceTo(lastPos.current)

      // Filter out large jumps (teleportation) or first frame
      const speed = (dist < 50) ? dist / Math.max(delta, 0.001) : 0

      // Simulate brush proximity (e.g. low to ground in the forest)
      // If Y is near the ground level (terrain is undulating but mostly near 0)
      // and not near the river path (X near 0)
      const inBrush = currentPos.y < 2.5 && Math.abs(currentPos.x) > 15;

      managerRef.current.update(currentPos, speed, inBrush)

      // Splash Logic: Water level approx 0.8
      const waterLevel = 0.8
      if ((lastY.current > waterLevel && currentPos.y <= waterLevel) ||
          (lastY.current < waterLevel && currentPos.y >= waterLevel)) {
           managerRef.current.triggerSplash(currentPos)
      }
      lastY.current = currentPos.y

      lastPos.current.copy(currentPos)
    }
  })

  return null
}

export default AudioController
