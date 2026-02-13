import React, { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'

export function LilyPadMaterial({ uColor = new THREE.Color('#4a6f1b'), uRimColor = new THREE.Color('#8b5a2b'), ...props }) {
  const materialRef = useRef()
  const uniforms = useRef({
    uColor: { value: uColor },
    uRimColor: { value: uRimColor }
  })

  useLayoutEffect(() => {
    if (uniforms.current) {
      uniforms.current.uColor.value = uColor
      uniforms.current.uRimColor.value = uRimColor
    }
  }, [uColor, uRimColor])

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uColor = uniforms.current.uColor
      shader.uniforms.uRimColor = uniforms.current.uRimColor

      const noiseFunc = `
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

      shader.fragmentShader = `
        uniform vec3 uColor;
        uniform vec3 uRimColor;
        ${noiseFunc}
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        #ifdef USE_UV
            vec2 center = vec2(0.5, 0.5);
            vec2 uv = vUv;

            // Distance from center
            float d = length(uv - center) * 2.0; // 0 to 1 roughly

            // Angle for veins
            vec2 diff = uv - center;
            float angle = atan(diff.y, diff.x);

            // Veins: radiating lines
            float veinNoise = snoise(uv * 10.0);
            float veins = sin(angle * 20.0 + veinNoise * 2.0);
            veins = smoothstep(0.8, 1.0, veins); // Thin lines

            // Color mixing
            vec3 color = uColor;

            // Darker veins
            color = mix(color, uColor * 0.5, veins * 0.3 * d); // Veins stronger near edge

            // Rim color (brownish/yellow)
            float rim = smoothstep(0.8, 1.0, d);
            color = mix(color, uRimColor, rim);

            // Noise overlay
            float n = snoise(uv * 20.0);
            color *= (0.9 + 0.2 * n);

            diffuseColor.rgb = color;
        #endif
        `
      )
    }

    material.needsUpdate = true
  }, [])

  return (
    <meshStandardMaterial
      ref={materialRef}
      roughness={0.4}
      metalness={0.0}
      side={THREE.DoubleSide}
      defines={{ USE_UV: '' }}
      {...props}
    />
  )
}
