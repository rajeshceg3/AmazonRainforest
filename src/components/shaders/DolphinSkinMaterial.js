import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const DolphinSkinMaterial = shaderMaterial(
  {
    uColorBase: new THREE.Color('#eecbcb'), // Pink
    uColorPatch: new THREE.Color('#a89f9f'), // Grey patches
    uScale: 3.0,
    uTime: 0
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorBase;
    uniform vec3 uColorPatch;
    uniform float uScale;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

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

    void main() {
      // Noise for patches
      float n = snoise(vUv * uScale);
      float patchAmount = smoothstep(0.4, 0.7, n);

      vec3 color = mix(uColorBase, uColorPatch, patchAmount);

      // Lighting
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Rim / Fresnel (Wet look)
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

      // Specular (fake light from top-right)
      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
      vec3 halfVector = normalize(lightDir + viewDir);
      float NdotH = max(dot(normal, halfVector), 0.0);
      float spec = pow(NdotH, 64.0);

      // Ambient
      vec3 ambient = color * 0.6;
      // Diffuse
      float diff = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = color * diff * 0.6;

      vec3 final = ambient + diffuse + vec3(spec) * 0.5 + vec3(fresnel) * 0.3;

      gl_FragColor = vec4(final, 1.0);
    }
  `
)

export default DolphinSkinMaterial
