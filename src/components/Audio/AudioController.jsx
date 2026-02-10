import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SoundscapeManager } from './Soundscapes'

const AudioController = ({ started }) => {
  const { camera } = useThree()
  const managerRef = useRef(null)
  const lastPos = useRef(new THREE.Vector3())

  useEffect(() => {
    if (!started) return

    // Initialize position to avoid startup pop
    lastPos.current.copy(camera.position)

    // Initialize the SoundscapeManager
    if (!managerRef.current) {
        managerRef.current = new SoundscapeManager()
        window.soundscapeManager = managerRef.current
    }

    return () => {
      // Cleanup when component unmounts or started changes (though started only goes false -> true)
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

      managerRef.current.update(currentPos, speed)

      lastPos.current.copy(currentPos)
    }
  })

  return null
}

export default AudioController
