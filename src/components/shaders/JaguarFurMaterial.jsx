import React, { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'

export function JaguarFurMaterial({ uColor = new THREE.Color('#d49b5c'), uSpotColor = new THREE.Color('#2b1d0e'), uScale = 2.0, ...props }) {
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
        // Simplex Noise (3D)
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        float snoise(vec3 v){
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
          i = mod(i, 289.0 );
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 1.0/7.0;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }
      `

      // Vertex Shader Injection
      shader.vertexShader = `
        uniform float uScale;
        varying float vDisplacement;
        varying vec3 vPos;
        ${noiseFunc}
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vPos = position;

        // Fur displacement
        // Use position instead of uv to avoid poles pinching
        float n = snoise(position * uScale * 10.0); // 3D noise
        vDisplacement = n;

        // Displace along normal
        transformed += objectNormal * n * 0.015;
        `
      )

      // Fragment Shader Injection
      shader.fragmentShader = `
        uniform vec3 uColor;
        uniform vec3 uSpotColor;
        uniform float uScale;
        varying float vDisplacement;
        varying vec3 vPos;
        ${noiseFunc}
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        // Spot Pattern using 3D position (Local Space)
        float n = snoise(vPos * uScale);

        // Irregular spots
        float edgeNoise = snoise(vPos * uScale * 5.0) * 0.1;
        float spots = smoothstep(0.3 + edgeNoise, 0.5 + edgeNoise, n);

        vec3 finalColor = mix(uColor, uSpotColor, spots);

        // Fur shading (fake AO from displacement)
        float fur = vDisplacement * 0.5 + 0.5;
        finalColor = mix(finalColor * 0.8, finalColor * 1.1, fur);

        // Soft Rim Light (Fake)
        // Using view direction vs normal would be better, but vPos based gradient is cheaper/safer here
        // Simple top-down gradient for "sun"
        float topGradient = smoothstep(-1.0, 1.0, vPos.y);
        finalColor += vec3(0.1, 0.08, 0.05) * topGradient;

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
