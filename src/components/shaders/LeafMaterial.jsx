import React, { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function LeafMaterial(props) {
  const materialRef = useRef()

  // Uniforms must be stable ref
  const uniforms = useRef({
    uTime: { value: 0 },
    uWindStrength: { value: 0.5 }, // Increased strength for visibility
    uWindSpeed: { value: 1.5 }
  })

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    // We need to patch the shader before compilation
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime
      shader.uniforms.uWindStrength = uniforms.current.uWindStrength
      shader.uniforms.uWindSpeed = uniforms.current.uWindSpeed

      shader.vertexShader = `
uniform float uTime;
uniform float uWindStrength;
uniform float uWindSpeed;
` + shader.vertexShader

      // Inject wind logic into the vertex shader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Calculate world position proxy for wind phase
        vec3 worldPosProxy = vec3(0.0);

        #ifdef USE_INSTANCING
          // instanceMatrix is an attribute containing the transform for this instance
          // modelMatrix is a uniform containing the transform for the InstancedMesh
          // We transform (0,0,0) local to world
          worldPosProxy = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #else
          worldPosProxy = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif

        // Wind phase based on position and time
        float windPhase = uTime * uWindSpeed + worldPosProxy.x * 0.05 + worldPosProxy.z * 0.05;

        // Complex wind wave
        float wind = sin(windPhase) + cos(windPhase * 2.3) * 0.5;
        wind *= uWindStrength;

        // Apply wind to the vertex 'transformed' (which is local position)
        // We assume the leaf pivot is at y=0, so deformation increases with y
        // If the geometry is centered, we might need to adjust.
        // Assuming we build geometry where y=0 is the stem.

        float bend = wind * pow(max(0.0, position.y + 0.5), 2.0) * 0.2;

        transformed.x += bend;
        transformed.z += bend * 0.5;

        // Add some high frequency flutter
        float flutter = sin(uTime * 10.0 + position.x * 20.0) * 0.05 * position.y;
        transformed.y += flutter;
        `
      )
    }

    material.needsUpdate = true
  }, [])

  useFrame((state) => {
    if (uniforms.current) {
      uniforms.current.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <meshStandardMaterial
      ref={materialRef}
      side={THREE.DoubleSide}
      transparent
      alphaTest={0.5}
      {...props}
    />
  )
}
