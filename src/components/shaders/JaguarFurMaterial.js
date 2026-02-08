import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const JaguarFurMaterial = shaderMaterial(
  {
    uColor: new THREE.Color('#d49b5c'), // Golden
    uSpotColor: new THREE.Color('#2b1d0e'), // Dark Brown/Black
    uTime: 0,
    uScale: 4.0
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vDisplacement;
    varying vec3 vNormal;
    varying vec3 vPos;
    uniform float uScale;

    // Simplex noise (standard)
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

    void main() {
      vUv = uv;
      vNormal = normal;
      vPos = position;

      // Small displacement for fur texture
      float n = snoise(vec2(uv.x * uScale * 20.0, uv.y * uScale * 20.0));
      vDisplacement = n;

      vec3 pos = position + normal * n * 0.01;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    uniform vec3 uSpotColor;
    varying vec2 vUv;
    varying float vDisplacement;
    varying vec3 vPos;
    uniform float uScale;

    // Simplex noise (standard)
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

    void main() {
      // Spot pattern
      // We mix UVs to avoid simple tiling if possible, or just use UVs
      float n = snoise(vUv * uScale);

      // Create irregular spots
      float spots = smoothstep(0.3, 0.5, n);

      // Add some noise to the spot edges
      float edgeNoise = snoise(vUv * uScale * 10.0) * 0.1;
      spots = smoothstep(0.3 + edgeNoise, 0.5 + edgeNoise, n);

      vec3 finalColor = mix(uColor, uSpotColor, spots);

      // Fur shading from displacement
      float fur = vDisplacement * 0.5 + 0.5;
      finalColor = mix(finalColor * 0.8, finalColor * 1.1, fur);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)

export default JaguarFurMaterial
