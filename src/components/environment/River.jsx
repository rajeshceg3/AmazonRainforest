import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorStart: new THREE.Color('#1a4d5e'),
    uColorEnd: new THREE.Color('#3b5e68')
  },
  // Vertex Shader
  `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;

    // Simplex noise function
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

      float elevation = snoise(vec2(position.x * 0.2 + uTime * 0.2, position.y * 0.2 + uTime * 0.2)) * 0.5;
      elevation += snoise(vec2(position.x * 0.8 + uTime * 0.5, position.y * 0.8 + uTime * 0.5)) * 0.1;

      vec3 newPosition = position;
      newPosition.z += elevation;

      vElevation = elevation;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColorStart;
    uniform vec3 uColorEnd;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      // Mix colors based on elevation for depth effect
      float mixStrength = (vElevation + 0.5) * 1.5;
      vec3 color = mix(uColorStart, uColorEnd, mixStrength);

      // Add simple specular highlight approximation
      float specular = step(0.9, vElevation + 0.6); // Simple threshold for shine
      color += vec3(specular * 0.5);

      gl_FragColor = vec4(color, 0.9);
    }
  `
)

extend({ WaterMaterial })

const River = () => {
  const materialRef = useRef()

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime += delta
    }
  })

  return (
    <group position={[0, -0.5, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400, 512, 512]} />
        <waterMaterial ref={materialRef} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default River
