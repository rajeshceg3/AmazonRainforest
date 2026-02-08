import React, { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function BarkMaterial(props) {
  const materialRef = useRef()
  const uniforms = useRef({
    uTime: { value: 0 },
    uScale: { value: 4.0 },
    uNoiseScale: { value: 0.5 }
  })

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime
      shader.uniforms.uScale = uniforms.current.uScale
      shader.uniforms.uNoiseScale = uniforms.current.uNoiseScale

      shader.vertexShader = `
        uniform float uTime;
        uniform float uScale;
        uniform float uNoiseScale;

        // Simplex noise function
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
      ` + shader.vertexShader

      // Inject displacement logic
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Calculate world position for noise seeding
        vec3 worldPos = vec3(0.0);
        #ifdef USE_INSTANCING
          worldPos = (instanceMatrix * vec4(position, 1.0)).xyz + (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #else
          worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        #endif

        // 1. Large scale wobble (Curve)
        // We displace x/z based on y height and world position noise
        float heightFactor = max(0.0, position.y); // Assume y starts at 0

        // Unique seed per tree based on world XZ
        float seed = worldPos.x * 0.1 + worldPos.z * 0.1;

        // Add time for subtle sway (very slow)
        float sway = uTime * 0.5;

        float wobbleX = sin(heightFactor * 0.5 + seed + sway) * 0.5;
        float wobbleZ = cos(heightFactor * 0.3 + seed * 1.5 + sway * 0.8) * 0.5;

        // Apply wobble
        transformed.x += wobbleX * (heightFactor * 0.05);
        transformed.z += wobbleZ * (heightFactor * 0.05);

        // 2. Bark texture displacement (High frequency)
        float barkNoise = snoise(vec2(uv.x * uScale * 5.0, uv.y * uScale));

        // Add world noise to bark to break UV repetition
        float worldBark = snoise(worldPos.xz * 0.5 + worldPos.y * 0.1);
        barkNoise += worldBark * 0.2;

        // Displace along normal
        transformed += objectNormal * barkNoise * 0.1;
        `
      )

      // Inject noise function for fragment shader
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
        '#include <map_fragment>',
        `
        #include <map_fragment>

        // Bark Texture
        // High freq noise
        float n = snoise(vUv * vec2(20.0, 50.0)); // Stretched Y for vertical bark

        // Moss patches (low freq)
        float moss = snoise(vUv * 5.0 + n * 0.1);
        float mossMask = smoothstep(0.2, 0.6, moss);

        vec3 barkColor = diffuseColor.rgb;
        barkColor *= (0.7 + 0.6 * n); // Variation

        vec3 mossColor = vec3(0.2, 0.4, 0.1); // Green

        // Mix moss
        diffuseColor.rgb = mix(barkColor, mossColor, mossMask * 0.5); // Not fully covering
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
      color="#3d2817"
      roughness={0.9}
      metalness={0.1}
      defines={{ USE_UV: '' }}
      {...props}
    />
  )
}
