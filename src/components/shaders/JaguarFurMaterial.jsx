import React, { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'

export function JaguarFurMaterial({ uColor = new THREE.Color('#d49b5c'), uSpotColor = new THREE.Color('#2b1d0e'), uScale = 4.0, ...props }) {
  const materialRef = useRef()
  const uniforms = useRef({
    uColor: { value: uColor },
    uSpotColor: { value: uSpotColor },
    uScale: { value: uScale }
  })

  useLayoutEffect(() => {
    if (uniforms.current) {
      uniforms.current.uColor.value = uColor
      uniforms.current.uSpotColor.value = uSpotColor
      uniforms.current.uScale.value = uScale
    }
  }, [uColor, uSpotColor, uScale])

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uColor = uniforms.current.uColor
      shader.uniforms.uSpotColor = uniforms.current.uSpotColor
      shader.uniforms.uScale = uniforms.current.uScale

      // Common Noise Function
      const noiseFunc = `
        // Simplex Noise (2D)
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
      `

      // Vertex Shader
      shader.vertexShader = `
        uniform float uScale;
        varying float vDisplacement;
        ${noiseFunc}
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        // Fur displacement
        // Use uv * 20.0 for high frequency fur
        float n = snoise(uv * uScale * 20.0);
        vDisplacement = n;

        // Displace along normal
        // objectNormal is defined in begin_normal
        transformed += objectNormal * n * 0.01;
        `
      )

      // Fragment Shader
      shader.fragmentShader = `
        uniform vec3 uColor;
        uniform vec3 uSpotColor;
        uniform float uScale;
        varying float vDisplacement;
        ${noiseFunc}
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        // Spot Pattern
        float n = snoise(vUv * uScale);

        // Irregular spots
        float edgeNoise = snoise(vUv * uScale * 10.0) * 0.1;
        float spots = smoothstep(0.3 + edgeNoise, 0.5 + edgeNoise, n);

        vec3 finalColor = mix(uColor, uSpotColor, spots);

        // Fur shading (fake AO from displacement)
        float fur = vDisplacement * 0.5 + 0.5;
        finalColor = mix(finalColor * 0.8, finalColor * 1.1, fur);

        diffuseColor.rgb = finalColor;
        `
      )
    }

    material.needsUpdate = true
  }, [])

  return (
    <meshStandardMaterial
      ref={materialRef}
      roughness={0.6}
      metalness={0.1}
      defines={{ USE_UV: '' }}
      {...props}
    />
  )
}
