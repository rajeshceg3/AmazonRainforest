import React, { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'

export function RockMaterial({ uColor = new THREE.Color('#5a5046'), uMossColor = new THREE.Color('#3a4f2d'), uScale = 2.0, ...props }) {
  const materialRef = useRef()
  const uniforms = useRef({
    uColor: { value: uColor },
    uMossColor: { value: uMossColor },
    uScale: { value: uScale }
  })

  useLayoutEffect(() => {
    if (uniforms.current) {
      uniforms.current.uColor.value = uColor
      uniforms.current.uMossColor.value = uMossColor
      uniforms.current.uScale.value = uScale
    }
  }, [uColor, uMossColor, uScale])

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uColor = uniforms.current.uColor
      shader.uniforms.uMossColor = uniforms.current.uMossColor
      shader.uniforms.uScale = uniforms.current.uScale

      // Simplex Noise 3D function
      const noiseFunc = `
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

      // Vertex Shader: Strong Displacement
      shader.vertexShader = `
        uniform float uScale;
        varying float vNoise;
        varying vec3 vWorldPos;
        ${noiseFunc}
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Base noise for large shape
        float n1 = snoise(position * uScale * 0.5);
        // Detail noise
        float n2 = snoise(position * uScale * 2.0);

        float displacement = n1 * 0.3 + n2 * 0.1;
        vNoise = n1; // Pass to fragment for coloring

        // Flatten bottom slightly (optional, but maybe better for placement)
        // if (position.y < -0.2) displacement *= 0.5;

        transformed += normal * displacement;

        // Recalculate normal approximation (simple)
        // Since we don't have neighbors easily in vertex shader without texture lookup,
        // we rely on the high-res mesh and flat shading or just accept smoothed normals are slightly off.
        // But for rocks, roughness handles it.
        `
      )

      // Fragment Shader: Coloring
      shader.fragmentShader = `
        uniform vec3 uColor;
        uniform vec3 uMossColor;
        varying float vNoise;
        ${noiseFunc}
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        // Mix base color with noise variation
        vec3 rockColor = uColor * (0.8 + 0.4 * vNoise);

        // Moss on top
        // Use normal.y (world space up) if available, but here we use vNormal (view space) converted?
        // Let's use noise for moss patches.
        // Or better, use vNoise passed from vertex

        float mossMix = smoothstep(0.2, 0.5, vNoise + 0.2); // Moss on bumps

        vec3 finalColor = mix(rockColor, uMossColor, mossMix * 0.5); // Subtle moss

        diffuseColor.rgb = finalColor;
        `
      )
    }

    material.needsUpdate = true
  }, [])

  return (
    <meshStandardMaterial
      ref={materialRef}
      roughness={0.8}
      metalness={0.1}
      defines={{ USE_UV: '' }}
      {...props}
    />
  )
}
