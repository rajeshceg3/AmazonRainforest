import React, { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function FurMaterial({ uColor = new THREE.Color('#8c7b6c'), uColorTip = new THREE.Color('#a89785'), uScale = 20.0, uFurLength = 0.1, ...props }) {
  const materialRef = useRef()
  const uniforms = useRef({
    uTime: { value: 0 },
    uColor: { value: uColor },
    uColorTip: { value: uColorTip },
    uScale: { value: uScale },
    uFurLength: { value: uFurLength }
  })

  useLayoutEffect(() => {
    if (uniforms.current) {
      uniforms.current.uColor.value = uColor
      uniforms.current.uColorTip.value = uColorTip
      uniforms.current.uScale.value = uScale
      uniforms.current.uFurLength.value = uFurLength
    }
  }, [uColor, uColorTip, uScale, uFurLength])

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime
      shader.uniforms.uColor = uniforms.current.uColor
      shader.uniforms.uColorTip = uniforms.current.uColorTip
      shader.uniforms.uScale = uniforms.current.uScale
      shader.uniforms.uFurLength = uniforms.current.uFurLength

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

      shader.vertexShader = `
        uniform float uTime;
        uniform float uScale;
        uniform float uFurLength;
        varying float vNoise;
        ${noiseFunc}
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float n = snoise(uv * uScale + vec2(0.0, uTime * 0.1));
        vNoise = n;

        vec3 pos = position + objectNormal * n * uFurLength;
        transformed = pos;
        `
      )

      shader.fragmentShader = `
        uniform vec3 uColor;
        uniform vec3 uColorTip;
        varying float vNoise;
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        float t = vNoise * 0.5 + 0.5;
        vec3 finalColor = mix(uColor, uColorTip, t);

        // Shadowing for roots
        finalColor = mix(finalColor * 0.5, finalColor, t);

        diffuseColor.rgb = finalColor;
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
      roughness={0.8}
      metalness={0.1}
      {...props}
    />
  )
}
