import React, { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'

export function TerrainMaterial({ uScale = 0.1, uColorSoil = new THREE.Color('#3d2817'), uColorMoss = new THREE.Color('#2d5a27'), ...props }) {
  const materialRef = useRef()
  const uniforms = useRef({
    uScale: { value: uScale },
    uColorSoil: { value: uColorSoil },
    uColorMoss: { value: uColorMoss }
  })

  useLayoutEffect(() => {
    if (uniforms.current) {
      uniforms.current.uScale.value = uScale
      uniforms.current.uColorSoil.value = uColorSoil
      uniforms.current.uColorMoss.value = uColorMoss
    }
  }, [uScale, uColorSoil, uColorMoss])

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uScale = uniforms.current.uScale
      shader.uniforms.uColorSoil = uniforms.current.uColorSoil
      shader.uniforms.uColorMoss = uniforms.current.uColorMoss

      shader.fragmentShader = `
        uniform float uScale;
        uniform vec3 uColorSoil;
        uniform vec3 uColorMoss;

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
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        // Noise Generation
        // Use vUv * 20.0 as base frequency for 400x400 plane (approx 0.05 units freq)
        float n = snoise(vUv * 20.0);

        // Detail noise (grit)
        float n2 = snoise(vUv * 100.0);

        // Mix factor for soil/moss
        float mixFactor = smoothstep(-0.2, 0.3, n + n2 * 0.2);

        vec3 soil = uColorSoil;
        vec3 moss = uColorMoss;

        // Texture variation
        soil *= (0.8 + 0.4 * n2); // Gritty soil
        moss *= (0.9 + 0.2 * snoise(vUv * 50.0 + 5.0)); // Moss variation

        // Apply mix
        diffuseColor.rgb = mix(soil, moss, mixFactor);
        `
      )
    }

    material.needsUpdate = true
  }, [])

  return (
    <meshStandardMaterial
      ref={materialRef}
      roughness={0.9}
      metalness={0.1}
      defines={{ USE_UV: '' }}
      {...props}
    />
  )
}
