import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const FurMaterial = shaderMaterial(
  {
    uColor: new THREE.Color('#8c7b6c'),
    uColorTip: new THREE.Color('#a89785'),
    uTime: 0,
    uScale: 20.0,
    uFurLength: 0.1
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vNoise;
    uniform float uTime;
    uniform float uScale;
    uniform float uFurLength;

    // Simplex noise (standard implementation)
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
      // Animate noise slightly for "breathing" or wind
      float n = snoise(uv * uScale + vec2(0.0, uTime * 0.1));
      vNoise = n;
      vec3 pos = position + normal * n * uFurLength;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    uniform vec3 uColorTip;
    varying float vNoise;

    void main() {
      float t = vNoise * 0.5 + 0.5;

      // Mix root and tip
      vec3 color = mix(uColor, uColorTip, t);

      // Shadowing for roots
      color = mix(color * 0.5, color, t);

      gl_FragColor = vec4(color, 1.0);
    }
  `
)

export default FurMaterial
