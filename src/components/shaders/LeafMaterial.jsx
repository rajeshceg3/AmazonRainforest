import React, { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function LeafMaterial({ uWindStrength = 0.5, uWindSpeed = 1.5, ...props }) {
  const materialRef = useRef()

  // Uniforms must be stable ref
  const uniforms = useRef({
    uTime: { value: 0 },
    uWindStrength: { value: uWindStrength },
    uWindSpeed: { value: uWindSpeed }
  })

  // Update uniforms when props change
  useLayoutEffect(() => {
    if (uniforms.current) {
      uniforms.current.uWindStrength.value = uWindStrength
      uniforms.current.uWindSpeed.value = uWindSpeed
    }
  }, [uWindStrength, uWindSpeed])

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    // We need to patch the shader before compilation
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime
      shader.uniforms.uWindStrength = uniforms.current.uWindStrength
      shader.uniforms.uWindSpeed = uniforms.current.uWindSpeed

      // --- Vertex Shader ---
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

      // --- Fragment Shader ---
      // Inject Simplex Noise Function
      shader.fragmentShader = `
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>

        // Leaf Texture / Variation
        // Use vUv if available, otherwise screen position or something else?
        // Standard Material usually has vUv if USE_UV is defined.

        #ifdef USE_UV
          float n = snoise(vUv * 5.0);
          float vein = snoise(vUv * 20.0);

          // Base variation
          diffuseColor.rgb *= (0.9 + 0.2 * n);

          // Veins (subtle)
          diffuseColor.rgb *= (0.95 + 0.1 * vein);

          // Darker center/stem (approx)
          float dist = abs(vUv.x - 0.5);
          diffuseColor.rgb *= (1.0 - dist * 0.3);

          // --- SOFT EDGE MASK ---
          // Smoothstep edges to avoid hard polygons
          // We apply a soft alpha fade at the edges of the UV space
          float edgeWidth = 0.08;
          float alphaX = smoothstep(0.0, edgeWidth, vUv.x) * smoothstep(1.0, 1.0 - edgeWidth, vUv.x);
          float alphaY = smoothstep(0.0, edgeWidth, vUv.y) * smoothstep(1.0, 1.0 - edgeWidth, vUv.y);

          // Combine
          diffuseColor.a *= alphaX * alphaY;
        #endif

        // Simple Subsurface Scattering Approximation (Backlighting)
        // Check if light is behind the leaf relative to camera
        // Using view vector and normal

        // This is a rough hack in Forward rendering without custom uniforms for light dir
        // But we can simulate "translucency" by brightening the backface

        if (!gl_FrontFacing) {
            diffuseColor.rgb *= 1.3; // Make backface brighter (simulating light passing through)
            diffuseColor.rgb += vec3(0.1, 0.2, 0.0); // Add some green tint
        }
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
      defines={{ USE_UV: '' }} // Force UVs
      {...props}
    />
  )
}
