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

      // Use REPLACE for normal_fragment_begin to properly access computed normals
      // But we want to modify 'normal' after it's computed?
      // normal_fragment_begin computes 'normal' from geometry or normal map.
      // We append our bump mapping.

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        `
        #include <normal_fragment_begin>

        #ifdef USE_UV
            // Generate height for bump mapping
            float h_n = snoise(vUv * 20.0);
            float h_n2 = snoise(vUv * 100.0);
            float h = h_n * 0.5 + h_n2 * 0.2;

            // Calculate derivatives for normal perturbation
            // We use dFdx/dFdy on the height field
            float dHx = dFdx(h);
            float dHy = dFdy(h);

            // Strength of bump (Reduced to 2.0)
            float bumpScale = 2.0;

            // Apply to normal (approximate view space perturbation)
            // Note: 'normal' here is View Space normal.
            // Perturbing X/Y works for small bumps on surfaces facing camera.
            normal.x -= dHx * bumpScale;
            normal.y -= dHy * bumpScale;
            normal = normalize(normal);
        #endif
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        #ifdef USE_UV
            // Re-calculate noise for color
            float n_c = snoise(vUv * 20.0);
            float n2_c = snoise(vUv * 100.0);

            // Mix factor for soil/moss
            float mixFactor = smoothstep(-0.2, 0.3, n_c + n2_c * 0.2);

            // Brightened colors
            vec3 soil = uColorSoil * 2.5;
            vec3 moss = uColorMoss * 2.0;

            // Texture variation
            soil *= (0.8 + 0.4 * n2_c); // Gritty soil
            moss *= (0.9 + 0.2 * snoise(vUv * 50.0 + 5.0)); // Moss variation

            // Apply mix
            diffuseColor.rgb = mix(soil, moss, mixFactor);
        #endif
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
