import React, { useLayoutEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function LeafMaterial({ uWindStrength = 0.5, uWindSpeed = 1.0, uUseAlphaMask = 0.0, ...props }) {
  const materialRef = useRef()

  // Uniforms ref to hold values and be accessible in useFrame
  const uniforms = useRef({
    uTime: { value: 0 },
    uWindStrength: { value: uWindStrength },
    uWindSpeed: { value: uWindSpeed },
    uUseAlphaMask: { value: uUseAlphaMask }
  })

  // Update uniforms when props change
  useLayoutEffect(() => {
    uniforms.current.uWindStrength.value = uWindStrength
    uniforms.current.uWindSpeed.value = uWindSpeed
    uniforms.current.uUseAlphaMask.value = uUseAlphaMask
  }, [uWindStrength, uWindSpeed, uUseAlphaMask])

  // Update time every frame
  useFrame((state) => {
    if (uniforms.current) {
        uniforms.current.uTime.value = state.clock.elapsedTime
    }
  })

  const onBeforeCompile = useMemo(() => (shader) => {
      // Link shader uniforms to our local uniforms ref
      shader.uniforms.uTime = uniforms.current.uTime
      shader.uniforms.uWindStrength = uniforms.current.uWindStrength
      shader.uniforms.uWindSpeed = uniforms.current.uWindSpeed
      shader.uniforms.uUseAlphaMask = uniforms.current.uUseAlphaMask

      // Common Noise Function (2D)
      const noiseFunc = `
        vec3 leaf_permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float leaf_snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = leaf_permute( leaf_permute( i.y + vec3(0.0, i1.y, 1.0 ))
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
      `

      // --- Vertex Shader Injection ---
      shader.vertexShader = `
        uniform float uTime;
        uniform float uWindStrength;
        uniform float uWindSpeed;
        varying vec3 vInstanceWorldPos;
        ${noiseFunc}
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Calculate world position manually including instance matrix
        #ifdef USE_INSTANCING
          vec4 worldPos = instanceMatrix * vec4(transformed, 1.0);
          worldPos = modelMatrix * worldPos;
        #else
          vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
        #endif

        vInstanceWorldPos = worldPos.xyz;

        float windNoise = leaf_snoise(worldPos.xz * 0.1 + uTime * uWindSpeed * 0.5);
        float windGust = smoothstep(0.0, 1.0, windNoise);

        float bend = uv.y * uWindStrength * (0.1 + windGust * 0.2);

        transformed.x += sin(uTime * 2.0 + worldPos.x) * bend;
        transformed.z += cos(uTime * 1.5 + worldPos.z) * bend;
        transformed.y += sin(uTime * 3.0 + worldPos.x * 0.5) * bend * 0.5;
        `
      )

      // --- Fragment Shader Injection ---
      shader.fragmentShader = `
        uniform float uTime;
        uniform float uUseAlphaMask;
        varying vec3 vInstanceWorldPos;
        ${noiseFunc}
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>

        #ifdef USE_UV
            // Organic variation
            float n = leaf_snoise(vUv * 10.0);
            float vein = smoothstep(0.4, 0.5, abs(n));
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.8, vein * 0.3);

            // Cloud Shadows
            float cloudNoise = leaf_snoise(vInstanceWorldPos.xz * 0.01 + vec2(uTime * 0.05, 0.0));
            float cloudShadow = smoothstep(0.0, 0.6, cloudNoise);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.4, cloudShadow * 0.7);

            // --- Fake Subsurface Scattering (SSS) ---
            // Sun Direction (hardcoded to match Scene.jsx light)
            vec3 sunDir = normalize(vec3(50.0, 100.0, 50.0));

            // View Direction (Camera to Fragment)
            vec3 worldViewDir = normalize(cameraPosition - vInstanceWorldPos);

            // Backlighting effect: Light is behind the leaf relative to camera
            // dot(view, sun) approaches 1.0 when looking into the sun
            float backLight = max(0.0, dot(worldViewDir, sunDir));

            // Power curve to focus the effect (halo)
            float sss = pow(backLight, 6.0);

            // Add SSS glow (Yellowish-Green)
            // Only apply if looking against the light
            diffuseColor.rgb += vec3(0.5, 0.7, 0.2) * sss * 0.8;

            // Soft Edge Alpha (Disabled if uUseAlphaMask <= 0.5)
            if (uUseAlphaMask > 0.5) {
                float dist = distance(vUv, vec2(0.5));
                float edgeNoise = leaf_snoise(vUv * 20.0) * 0.05;
                float alphaMask = 1.0 - smoothstep(0.4, 0.5, dist + edgeNoise * 0.2);
                diffuseColor.a *= alphaMask;
            }
        #endif
        `
      )
  }, [])

  return (
    <meshStandardMaterial
      ref={materialRef}
      side={THREE.DoubleSide}
      onBeforeCompile={onBeforeCompile}
      defines={{ USE_UV: '' }}
      {...props}
    />
  )
}
