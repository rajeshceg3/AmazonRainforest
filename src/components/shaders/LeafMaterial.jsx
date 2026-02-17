import React, { useLayoutEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function LeafMaterial({ uWindStrength = 0.5, uWindSpeed = 1.0, uUseAlphaMask = 0.0, uTranslucency = 0.6, ...props }) {
  const materialRef = useRef()

  // Uniforms ref to hold values and be accessible in useFrame
  const uniforms = useRef({
    uTime: { value: 0 },
    uWindStrength: { value: uWindStrength },
    uWindSpeed: { value: uWindSpeed },
    uUseAlphaMask: { value: uUseAlphaMask },
    uTranslucency: { value: uTranslucency }
  })

  // Update uniforms when props change
  useLayoutEffect(() => {
    if (uniforms.current) {
        uniforms.current.uWindStrength.value = uWindStrength
        uniforms.current.uWindSpeed.value = uWindSpeed
        uniforms.current.uUseAlphaMask.value = uUseAlphaMask
        uniforms.current.uTranslucency.value = uTranslucency
    }
  }, [uWindStrength, uWindSpeed, uUseAlphaMask, uTranslucency])

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
      shader.uniforms.uTranslucency = uniforms.current.uTranslucency

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

        // FBM
        float leaf_fbm(vec2 p) {
            float total = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for (int i = 0; i < 4; i++) {
                total += leaf_snoise(p * frequency) * amplitude;
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            return total;
        }
      `

      // --- Vertex Shader Injection ---
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uTime;
        uniform float uWindStrength;
        uniform float uWindSpeed;
        varying vec3 vInstanceWorldPos;
        ${noiseFunc}
        `
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Calculate world position manually including instance matrix
        float randomPhase = 0.0;

        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
          // Use instance position for random phase
          randomPhase = sin(instanceMatrix[3][0] * 12.9898 + instanceMatrix[3][2] * 78.233);
        #else
          vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
        #endif

        vInstanceWorldPos = worldPos.xyz;

        float windNoise = leaf_snoise(worldPos.xz * 0.1 + uTime * uWindSpeed * 0.5);
        float windGust = smoothstep(0.0, 1.0, windNoise);

        // Bend factor based on UV.y (assuming pivot at bottom 0, top 1)
        // or for centered planes (pivot center), we might use (uv.y - 0.5)?
        // In ForestFloor, ferns pivot at bottom.
        // Let's assume geometry is set up for pivot at y=0 or similar.
        // Actually ForestFloor geometries are translated so y=0 is bottom.
        // So transformed.y is height.
        // But here we use 'bend' logic.

        float bend = transformed.y * uWindStrength * (0.1 + windGust * 0.2);

        // Apply simple bending (rotate around X/Z)
        // transformed.x += ...

        transformed.x += sin(uTime * 2.0 + worldPos.x + randomPhase * 10.0) * bend;
        transformed.z += cos(uTime * 1.5 + worldPos.z + randomPhase * 10.0) * bend;
        transformed.y += sin(uTime * 3.0 + worldPos.x * 0.5 + randomPhase * 5.0) * bend * 0.5;
        `
      )

      // --- Fragment Shader Injection ---
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uTime;
        uniform float uUseAlphaMask;
        uniform float uTranslucency;
        varying vec3 vInstanceWorldPos;
        ${noiseFunc}
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>

        #ifdef USE_UV
            // Organic variation using FBM
            float n = leaf_fbm(vUv * 10.0);

            // Veins (darker lines)
            float vein = smoothstep(0.4, 0.55, abs(n - 0.5) * 2.0);

            // Add subtle noise to diffuse
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.6, vein * 0.3);

            // Cloud Shadows
            float cloudNoise = leaf_snoise(vInstanceWorldPos.xz * 0.01 + vec2(uTime * 0.05, 0.0));
            float cloudShadow = smoothstep(0.0, 0.6, cloudNoise);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.4, cloudShadow * 0.7);

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

      // Inject SSS into Emissive (after lights calculation setup)
      // totalEmissiveRadiance is defined in lights_fragment_begin
      shader.fragmentShader = shader.fragmentShader.replace(
          '#include <lights_fragment_begin>',
          `
          #include <lights_fragment_begin>

          #ifdef USE_UV
            // Calculate SSS
            // Sun Direction (hardcoded to match Scene.jsx light: 80, 100, 30)
            vec3 sunDir = normalize(vec3(80.0, 100.0, 30.0));
            vec3 viewDir = normalize(cameraPosition - vInstanceWorldPos);

            // Transmission: Light passing through (Backlit)
            // dot(viewDir, -sunDir) is 1 when looking at sun through leaf.
            float trans = max(0.0, dot(viewDir, -sunDir));

            // Power curve to focus the effect
            trans = pow(trans, 3.0);

            // Vein Mask (re-calculate or approximate)
            // Using same FBM logic as above (cheap enough)
            float n_sss = leaf_fbm(vUv * 10.0);
            float vein_sss = smoothstep(0.4, 0.55, abs(n_sss - 0.5) * 2.0);

            // Veins block light
            trans *= (1.0 - vein_sss * 0.8);

            // SSS Color (Yellowish-Green boost)
            vec3 sssColor = vec3(0.5, 0.7, 0.1) * 2.0 * trans * uTranslucency;

            // Add to totalEmissiveRadiance
            totalEmissiveRadiance += sssColor;
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
