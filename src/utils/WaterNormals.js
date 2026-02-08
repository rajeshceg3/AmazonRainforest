import { useMemo } from 'react'
import * as THREE from 'three'

export function useWaterNormals(size = 512) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Fill with base normal color (0.5, 0.5, 1.0) -> RGB(128, 128, 255)
    ctx.fillStyle = '#8080ff'
    ctx.fillRect(0, 0, size, size)

    // Draw random "waves" (gradients)
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * size
        const y = Math.random() * size
        const r = Math.random() * 30 + 10

        // Random tilt
        const nx = Math.floor(128 + (Math.random() - 0.5) * 60)
        const ny = Math.floor(128 + (Math.random() - 0.5) * 60)

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${nx}, ${ny}, 255, 0.05)`
        ctx.fill()
    }

    // Blur to smooth out hard edges (simulating fluid surface)
    // Note: canvas blur filter is not supported in all envs, but usually ok in browsers
    // We can just rely on the overlap for smoothness.

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)

    return texture
  }, [size])
}
