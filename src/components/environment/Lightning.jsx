import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

// Helper to generate fractal lightning path
const generateBolt = (start, end, segments = 8, offsetAmount = 10) => {
    const points = [start, end]

    // Recursive midpoint displacement
    for (let i = 0; i < segments; i++) {
        const newPoints = []
        for (let j = 0; j < points.length - 1; j++) {
            const p1 = points[j]
            const p2 = points[j+1]
            const mid = new THREE.Vector3().lerpVectors(p1, p2, 0.5)

            // Random offset perpendicular to direction would be ideal,
            // but simple random offset works for chaos.
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * offsetAmount,
                (Math.random() - 0.5) * offsetAmount,
                (Math.random() - 0.5) * offsetAmount
            )
            mid.add(offset)

            newPoints.push(p1, mid)
        }
        newPoints.push(points[points.length - 1])
        points.splice(0, points.length, ...newPoints)

        offsetAmount *= 0.5 // Reduce offset for finer details
    }

    return points
}

const LightningBolt = ({ start, end, visible }) => {
    // Memoize geometry so it doesn't jitter every frame, only when 'start'/'end' changes
    // But we want it to change every flash.
    // We can use a 'seed' or just rely on start/end changing.

    const points = useMemo(() => {
        if (!visible) return []
        return generateBolt(start, end, 5, 15) // 5 iterations
    }, [start, end, visible])

    if (!visible) return null

    return (
        <Line
            points={points}
            color="white"
            lineWidth={3} // Thick core
            toneMapped={false} // Emissive look
            transparent
            opacity={0.8}
        />
    )
}

const Lightning = () => {
  const light = useRef()
  // Schedule first flash between 30s and 90s to ensure scene is calm initially
  const nextFlashTime = useRef(30 + Math.random() * 60)
  const isFlashing = useRef(false)
  const flashDuration = 0.2
  const flashStartTime = useRef(0)

  // State for bolt rendering
  const [boltData, setBoltData] = useState({
      start: new THREE.Vector3(0, 100, 0),
      end: new THREE.Vector3(0, 0, 0),
      visible: false
  })

  useFrame((state) => {
    if (!light.current) return
    const time = state.clock.elapsedTime

    if (isFlashing.current) {
        const elapsed = time - flashStartTime.current

        if (elapsed >= flashDuration) {
            light.current.intensity = 0
            isFlashing.current = false
            setBoltData(d => ({ ...d, visible: false }))

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

            const startPos = new THREE.Vector3(x, y, z)
            const endPos = new THREE.Vector3(x + (Math.random()-0.5)*50, 0, z + (Math.random()-0.5)*50)

            light.current.position.copy(startPos)
            light.current.intensity = 800

            // Trigger Bolt Visibility
            setBoltData({
                start: startPos,
                end: endPos,
                visible: true
            })

            // Trigger Sound
            const dist = state.camera.position.distanceTo(light.current.position)
            if (window.soundscapeManager && window.soundscapeManager.triggerThunder) {
                window.soundscapeManager.triggerThunder(dist)
            }
        }
    }
  })

  return (
    <group>
        <pointLight
          ref={light}
          color="#ffffff" // Stark white lightning
          intensity={0}   // Normally off
          distance={800}  // Long reach
          decay={2}
        />
        <LightningBolt
            start={boltData.start}
            end={boltData.end}
            visible={boltData.visible}
        />
    </group>
  )
}

export default Lightning
