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
            // Flash intensity curve: sudden spike then decay
            // Maybe a flicker?
            // Let's do a simple decay for now
            const progress = elapsed / flashDuration
            // flickering random factor
            const flicker = Math.random() > 0.5 ? 1 : 0.5
            light.current.intensity = 800 * (1 - progress) * flicker
        }
    } else {
        if (time >= nextFlashTime.current) {
            isFlashing.current = true
            flashStartTime.current = time
            light.current.intensity = 800

            // Randomize position in the sky
            light.current.position.set(
                (Math.random() - 0.5) * 300,
                100 + Math.random() * 50, // High up
                (Math.random() - 0.5) * 300
            )
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
