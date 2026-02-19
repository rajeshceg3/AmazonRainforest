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

      const noiseFuncs = `
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

        // FBM
        float fbm(vec2 p) {
            float total = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for (int i = 0; i < 5; i++) {
                total += snoise(p * frequency) * amplitude;
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            return total;
        }
      `

      // Vertex Shader Injection
      shader.vertexShader = `
        varying vec3 vWorldPosition;
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        // Terrain is a single mesh, so modelMatrix is valid
        vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
        vWorldPosition = worldPos.xyz;
        `
      )

      // Fragment Shader Injection
      shader.fragmentShader = `
        varying vec3 vWorldPosition;
        uniform float uScale;
        uniform vec3 uColorSoil;
        uniform vec3 uColorMoss;
        ${noiseFuncs}
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        `
        #include <normal_fragment_begin>

        #ifdef USE_UV
            // Generate height for bump mapping using FBM
            float h_n = fbm(vUv * 20.0);
            float h = h_n * 0.5;

            // Calculate derivatives for normal perturbation
            float dHx = dFdx(h);
            float dHy = dFdy(h);

            // Strength of bump
            float bumpScale = 3.0;

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

        float wetness = 0.0;

        #ifdef USE_UV
            // Calculate slope
            // We need View Up vector.
            vec3 viewUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
            float slope = dot(vNormal, viewUp); // 1.0 = flat, 0.0 = vertical

            // Re-calculate noise for color
            float n_soil = fbm(vUv * 15.0);
            float n_moss = fbm(vUv * 8.0 + 5.0);
            float n_rock = fbm(vUv * 30.0 + 10.0);

            // Colors
            vec3 soilColor = uColorSoil * (0.8 + 0.4 * n_soil);
            vec3 mossColor = uColorMoss * (0.9 + 0.3 * n_moss);
            vec3 rockColor = vec3(0.3, 0.3, 0.35) * (0.5 + 0.5 * n_rock); // Greyish rock

            // Mixing Logic
            // Base is soil
            vec3 finalColor = soilColor;

            // Add moss (patches on flat ground)
            float mossMix = smoothstep(0.4, 0.6, n_moss);
            // Moss prefers flat ground
            mossMix *= smoothstep(0.7, 0.9, slope);

            finalColor = mix(finalColor, mossColor, mossMix);

            // Add rock (on steep slopes or random patches)
            float slopeRock = 1.0 - smoothstep(0.7, 0.9, slope);
            float patchRock = smoothstep(0.6, 0.8, n_rock);

            float rockMix = max(slopeRock, patchRock * 0.5);

            finalColor = mix(finalColor, rockColor, rockMix);

            // --- Wetness Logic ---
            // Darken near water level (approx -0.5)
            // Start transition at 0.5, full wet at -0.5
            wetness = smoothstep(0.5, -0.6, vWorldPosition.y);

            // Darken wet soil
            finalColor = mix(finalColor, finalColor * 0.4, wetness);

            diffuseColor.rgb = finalColor;
        #endif
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          `
          #include <roughnessmap_fragment>
          // Reduce roughness where wet (make glossier)
          // Default roughness is passed as uniform usually or material property
          roughnessFactor = mix(roughnessFactor, 0.2, wetness);
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
