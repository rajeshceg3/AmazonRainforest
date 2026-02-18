import React, { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function FeatherMaterial({
    uColor = new THREE.Color('#d02020'),
    uColorTip = new THREE.Color('#ff4040'),
    uRachisColor = new THREE.Color('#ffffff'),
    uWindStrength = 0.1,
    uScale = 1.0,
    ...props
}) {
  const materialRef = useRef()
  const uniforms = useRef({
    uTime: { value: 0 },
    uColor: { value: uColor },
    uColorTip: { value: uColorTip },
    uRachisColor: { value: uRachisColor },
    uWindStrength: { value: uWindStrength },
    uScale: { value: uScale }
  })

  useLayoutEffect(() => {
    if (uniforms.current) {
        uniforms.current.uColor.value = uColor
        uniforms.current.uColorTip.value = uColorTip
        uniforms.current.uRachisColor.value = uRachisColor
        uniforms.current.uWindStrength.value = uWindStrength
        uniforms.current.uScale.value = uScale
    }
  }, [uColor, uColorTip, uRachisColor, uWindStrength, uScale])

  useFrame((state) => {
    if (uniforms.current) {
        uniforms.current.uTime.value = state.clock.elapsedTime
    }
  })

  const onBeforeCompile = useMemo(() => (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime
      shader.uniforms.uColor = uniforms.current.uColor
      shader.uniforms.uColorTip = uniforms.current.uColorTip
      shader.uniforms.uRachisColor = uniforms.current.uRachisColor
      shader.uniforms.uWindStrength = uniforms.current.uWindStrength
      shader.uniforms.uScale = uniforms.current.uScale

      const noiseFunc = `
        vec3 feather_permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float feather_snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = feather_permute( feather_permute( i.y + vec3(0.0, i1.y, 1.0 ))
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

      // --- Vertex Shader ---
      shader.vertexShader = `
        uniform float uTime;
        uniform float uWindStrength;
        ${noiseFunc}
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Flutter effect
        float flutter = feather_snoise(uv * 5.0 + uTime * 5.0) * uWindStrength * 0.1 * uv.y; // More at tip
        transformed.z += flutter;

        // Slight curvature (cup shape)
        transformed.z += pow(abs(uv.x - 0.5) * 2.0, 2.0) * 0.1;
        `
      )

      // --- Fragment Shader ---
      shader.fragmentShader = `
        uniform vec3 uColor;
        uniform vec3 uColorTip;
        uniform vec3 uRachisColor;
        uniform float uScale;
        ${noiseFunc}
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>

        // Coordinates
        vec2 uvCoords = vUv;
        float x = abs(uvCoords.x - 0.5) * 2.0; // 0 (center) to 1 (edge)
        float y = uvCoords.y; // 0 (base) to 1 (tip)

        // Feather Shape Envelope
        // Base width: wider near bottom, taper to tip
        float envelope = sin(pow(y, 0.6) * 3.14159);
        // Add noise to edge (barbs)
        float barbNoise = feather_snoise(vec2(y * 50.0 * uScale, x * 10.0));
        float maxW = envelope * 0.8 + barbNoise * 0.1;

        // Discard
        if (x > maxW) discard;

        // Color Gradient
        vec3 col = mix(uColor, uColorTip, y);

        // Rachis (Center Shaft)
        float rachisWidth = 0.05 * (1.0 - y); // Taper shaft
        if (x < rachisWidth) {
            col = uRachisColor;
        } else {
            // Barb Texture (Stripes)
            float barbPattern = sin((y * 40.0 * uScale - x * 20.0) * 3.14);
            col *= (0.9 + 0.1 * barbPattern);

            // Fake AO on rachis edges
            float rachisEdge = smoothstep(rachisWidth, rachisWidth + 0.05, x);
            col *= (0.8 + 0.2 * rachisEdge);
        }

        diffuseColor.rgb = col;
        `
      )

      // Bump map logic for normals?
      // Standard material handles normal map if provided, but we want procedural.
      // We can perturb 'normal' in fragment shader before lighting.
      shader.fragmentShader = shader.fragmentShader.replace(
          '#include <normal_fragment_begin>',
          `
          #include <normal_fragment_begin>

          // Procedural Normal perturbation
          // Barbs go out and up
          float barbDir = (vUv.x > 0.5) ? -1.0 : 1.0;
          vec3 barbNormal = normalize(vec3(barbDir * 0.5, 0.2, 1.0));

          // Mix with geometric normal
          // This is a hacky way to modify normal without dFdx

          // Better: Perturb normal based on noise derivative approximation
          float n1 = feather_snoise(vec2(vUv.y * 50.0, vUv.x * 10.0));
          float n2 = feather_snoise(vec2(vUv.y * 50.0 + 0.1, vUv.x * 10.0));
          float dN = (n2 - n1) * 2.0; // Slope in Y

          // Apply to view-space normal 'normal'
          // This requires tangent space, which is complex in onBeforeCompile without includes.
          // Let's stick to color detail for now as it's safer.
          `
      )
  }, [])

  return (
    <meshStandardMaterial
      ref={materialRef}
      side={THREE.DoubleSide}
      onBeforeCompile={onBeforeCompile}
      defines={{ USE_UV: '' }}
      roughness={0.7}
      metalness={0.1}
      {...props}
    />
  )
}
