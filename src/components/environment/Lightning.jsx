import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const Lightning = () => {
  const light = useRef()
  // Schedule first flash between 30s and 90s to ensure scene is calm initially
  const nextFlashTime = useRef(30 + Math.random() * 60)
  const isFlashing = useRef(false)
  const flashDuration = 0.2
  const flashStartTime = useRef(0)

  useFrame((state) => {
    if (!light.current) return
    const time = state.clock.elapsedTime

    if (isFlashing.current) {
        const elapsed = time - flashStartTime.current

        if (elapsed >= flashDuration) {
            light.current.intensity = 0
            isFlashing.current = false
            // Schedule next flash: 60s to 120s interval (Rare)
            nextFlashTime.current = time + 60 + Math.random() * 60
        } else {
            // Flicker Logic
            const progress = elapsed / flashDuration
            let intensity = 800 * (1.0 - progress)

            // Hard coded flicker pattern for realism (Flash -> dim -> Flash -> fade)
            if (progress > 0.15 && progress < 0.25) intensity *= 0.1
            if (progress > 0.35 && progress < 0.45) intensity *= 1.2

            light.current.intensity = intensity
        }
    } else {
        if (time >= nextFlashTime.current) {
            isFlashing.current = true
            flashStartTime.current = time

            // Randomize position
            const x = (Math.random() - 0.5) * 300
            const y = 100 + Math.random() * 50
            const z = (Math.random() - 0.5) * 300

            light.current.position.set(x, y, z)
            light.current.intensity = 800

            // Trigger Sound
            const dist = state.camera.position.distanceTo(light.current.position)
            if (window.soundscapeManager && window.soundscapeManager.triggerThunder) {
                window.soundscapeManager.triggerThunder(dist)
            }
        }
    }
  })

  return (
    <pointLight
      ref={light}
      color="#ffffff" // Stark white lightning
      intensity={0}   // Normally off
      distance={800}  // Long reach
      decay={2}
    />
  )
}

export default Lightning
