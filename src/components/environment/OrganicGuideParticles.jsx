import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// This component replaces the random Sparkles with a particle system
// that subtly flows toward the river (X=0) or points of interest
const OrganicGuideParticles = ({ count = 4000 }) => {
  const meshRef = useRef()
  const { camera } = useThree()

  // Initialize particles
  const [positions, phases, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const phs = new Float32Array(count)
    const spd = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Spawn within a reasonable radius of the center/river
      pos[i * 3] = (Math.random() - 0.5) * 400 // X
      pos[i * 3 + 1] = Math.random() * 30      // Y (height)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400 // Z

      phs[i] = Math.random() * Math.PI * 2
      spd[i] = 0.2 + Math.random() * 0.5
    }
    return [pos, phs, spd]
  }, [count])

  // Custom shader material for the particles
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#ccffcc") },
        uSize: { value: 10.0 } // Adjust size based on pixel ratio if needed
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        attribute float phase;
        attribute float speed;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Basic drift based on phase
          float t = uTime * speed;

          // Sway
          pos.x += sin(t + phase) * 0.5;
          pos.z += cos(t + phase * 2.0) * 0.5;

          // Organic flow toward river (X=0)
          // The further away from X=0, the stronger the pull, but it's very subtle
          float pullStrength = 0.05 * speed;
          if (pos.x > 0.0) {
            pos.x -= pullStrength;
          } else {
            pos.x += pullStrength;
          }

          // Slow vertical drift
          pos.y += sin(t * 0.5 + phase) * 0.2;

          // Wrap around logic (keep near camera/center)
          // For simplicity in a vertex shader, if they drift too far, we just let them drift
          // but the initial spread is wide enough to last a while.
          // To do proper wrapping, we usually need a simulation texture or pass camera pos.

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size attenuation
          gl_PointSize = uSize * (20.0 / -mvPosition.z);

          // Fade in/out based on sine wave
          vAlpha = (sin(t * 0.2 + phase) * 0.5 + 0.5) * 0.4; // Max 0.4 opacity
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          // Soft circle
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Glow edge
          float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [])

  // Manual CPU update for wrapping particles around the camera to ensure infinite flow
  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime()

    if (meshRef.current) {
      const positionsAttr = meshRef.current.geometry.attributes.position
      const posArray = positionsAttr.array
      const camPos = camera.position

      let needsUpdate = false
      for (let i = 0; i < count; i++) {
        const xIdx = i * 3
        const zIdx = i * 3 + 2

        // Very subtle CPU drift to supplement shader
        // Guiding particles towards x=0 (the river) slightly
        const distToRiver = posArray[xIdx]
        if (Math.abs(distToRiver) > 5) {
            posArray[xIdx] -= Math.sign(distToRiver) * delta * 0.5 * speeds[i]
            needsUpdate = true
        }

        // Wrap around if they get too far from camera
        if (Math.abs(posArray[xIdx] - camPos.x) > 200) {
          posArray[xIdx] = camPos.x + (Math.random() > 0.5 ? 200 : -200)
          needsUpdate = true
        }
        if (Math.abs(posArray[zIdx] - camPos.z) > 200) {
          posArray[zIdx] = camPos.z + (Math.random() > 0.5 ? 200 : -200)
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        positionsAttr.needsUpdate = true
      }
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-phase"
          count={phases.length}
          array={phases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-speed"
          count={speeds.length}
          array={speeds}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

export default OrganicGuideParticles
