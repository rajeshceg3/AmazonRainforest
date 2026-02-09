import React, { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function LeafMaterial({ uWindStrength = 0.5, uWindSpeed = 1.0, ...props }) {
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

        ${noiseFunc}
      ` + shader.vertexShader

      // Inject Wind Logic
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Get world position of the instance/object
        vec3 worldPos = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #ifdef USE_INSTANCING
          worldPos = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif

        // Noise inputs (Use XZ and Time)
        float time = uTime * uWindSpeed;

        // Large scale wind gusts (low frequency)
        float gust = leaf_snoise(worldPos.xz * 0.02 + vec2(time * 0.2, 0.0));
        gust = smoothstep(-0.2, 0.8, gust);

        // Small scale flutter (high frequency)
        float flutter = leaf_snoise(worldPos.xz * 0.5 + vec2(time * 1.5, 0.0));

        // Combined wind force
        float wind = (gust * 0.8 + flutter * 0.2) * uWindStrength;

        // Apply deformation
        float bendFactor = pow(max(0.0, position.y + 0.2), 1.5);

        // Direction: approximate diagonal
        vec3 windDir = normalize(vec3(1.0, 0.2, 0.5));

        transformed += windDir * wind * bendFactor * 0.5;
        transformed.x += flutter * bendFactor * 0.1;
        `
      )

      // --- Fragment Shader Injection ---
      shader.fragmentShader = `
        ${noiseFunc}
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>

        #ifdef USE_UV
            // Organic variation
            float n = leaf_snoise(vUv * 10.0);

            // Subtle vein pattern
            float vein = smoothstep(0.4, 0.5, abs(n));
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.8, vein * 0.3);

            // Soft Edge Alpha
            float dist = distance(vUv, vec2(0.5));
            float edgeNoise = leaf_snoise(vUv * 20.0) * 0.05;
            float alphaMask = 1.0 - smoothstep(0.4, 0.5, dist + edgeNoise * 0.2);

            diffuseColor.a *= alphaMask;
        #endif

        if (!gl_FrontFacing) {
            diffuseColor.rgb *= 1.5;
            diffuseColor.rgb += vec3(0.15, 0.2, 0.05);
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
      defines={{ USE_UV: '' }}
      {...props}
    />
  )
}
