import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { SoundscapeManager } from './Soundscapes'

const AudioController = ({ started }) => {
  const { camera } = useThree()
  const managerRef = useRef(null)

  useEffect(() => {
    if (!started) return

    // Initialize the SoundscapeManager
    if (!managerRef.current) {
        managerRef.current = new SoundscapeManager()
    }

    return () => {
      // Cleanup when component unmounts or started changes (though started only goes false -> true)
      if (managerRef.current) {
        managerRef.current.dispose()
        managerRef.current = null
      }
    }
  }, [started])

  useFrame(() => {
    if (managerRef.current) {
      managerRef.current.update(camera.position.y)
    }
  })

  return null
}

export default AudioController
