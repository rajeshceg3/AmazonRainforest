import React, { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function VineMaterial({ uWindStrength = 0.5, uWindSpeed = 1.0, ...props }) {
  const materialRef = useRef()
  const uniforms = useRef({
    uTime: { value: 0 },
    uWindStrength: { value: uWindStrength },
    uWindSpeed: { value: uWindSpeed }
  })

  useLayoutEffect(() => {
    if (uniforms.current) {
        uniforms.current.uWindStrength.value = uWindStrength
        uniforms.current.uWindSpeed.value = uWindSpeed
    }
  }, [uWindStrength, uWindSpeed])

  useLayoutEffect(() => {
    if (!materialRef.current) return
    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime
      shader.uniforms.uWindStrength = uniforms.current.uWindStrength
      shader.uniforms.uWindSpeed = uniforms.current.uWindSpeed

      shader.vertexShader = `
        uniform float uTime;
        uniform float uWindStrength;
        uniform float uWindSpeed;
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // World position for noise phase
        vec3 worldPos = vec3(0.0);
        #ifdef USE_INSTANCING
             worldPos = (instanceMatrix * vec4(position, 1.0)).xyz + (modelMatrix * vec4(0.0,0.0,0.0,1.0)).xyz;
        #else
             worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        #endif

        // Pivot Logic:
        // Assume geometry is translated so Top is at Y=0 and it hangs downwards (Y < 0).
        // Sway increases with distance from Top (abs(position.y)).

        float dist = abs(position.y);

        float windPhase = uTime * uWindSpeed + worldPos.x * 0.2 + worldPos.z * 0.2;

        // Main sway
        float sway = sin(windPhase) * uWindStrength;

        // Chaos/Noise
        float noise = sin(uTime * 2.0 + position.y * 0.5) * 0.1;

        // Combined offset
        // Exponential increase with distance to simulate pendulum/rope physics roughly
        float offset = (sway + noise) * pow(dist, 1.5) * 0.1;

        transformed.x += offset;
        transformed.z += offset * 0.5 * cos(uTime * 0.8); // Elliptical
        `
      )
    }
  }, [])

  useFrame((state) => {
    if (uniforms.current) {
      uniforms.current.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <meshStandardMaterial
      ref={materialRef}
      color="#4a3b2a"
      roughness={1.0}
      metalness={0.1}
      {...props}
    />
  )
}
