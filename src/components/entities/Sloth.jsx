import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Simple fur shader material
const FurMaterial = shaderMaterial(
  {
    uColor: new THREE.Color('#8c7b6c'),
    uTime: 0
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vNoise;

    // Simplex noise (reused)
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
      // Slight vertex displacement for fluff
      float n = snoise(uv * 20.0);
      vNoise = n;
      vec3 pos = position + normal * n * 0.02;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    varying float vNoise;

    void main() {
      // Darken roots
      vec3 color = mix(uColor * 0.8, uColor * 1.2, vNoise * 0.5 + 0.5);
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ FurMaterial })

const Sloth = ({ position = [0, 10, 0] }) => {
  const group = useRef()
  const headRef = useRef()
  const armL = useRef()
  const armR = useRef()
  const legL = useRef()
  const legR = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Very slow sway
    if (group.current) {
      group.current.rotation.z = Math.sin(t * 0.2) * 0.1
      group.current.rotation.x = Math.sin(t * 0.15) * 0.05
    }

    // Slow head look
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.1) * 0.2
    }

    // Limbs slight adjust
    if (armL.current) armL.current.rotation.z = -0.5 + Math.sin(t * 0.1) * 0.05
  })

  const faceColor = "#e0d6c8"

  return (
    <group ref={group} position={position} rotation={[0, 0, Math.PI]}> {/* Hanging upside down */}
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.4, 0.9, 4, 16]} />
        <furMaterial />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0.4, -0.6, 0.2]} rotation={[0.5, 0, 0]}>
        <mesh castShadow>
           <sphereGeometry args={[0.3, 16, 16]} />
           <furMaterial />
        </mesh>
        {/* Face Mask */}
        <mesh position={[0, 0.05, 0.22]} rotation={[-0.2, 0, 0]}>
           <circleGeometry args={[0.2, 32]} />
           <meshStandardMaterial color={faceColor} />
        </mesh>
        {/* Eyes/Nose (Simple) */}
        <mesh position={[0.08, 0.05, 0.23]}>
           <circleGeometry args={[0.03]} />
           <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[-0.08, 0.05, 0.23]}>
           <circleGeometry args={[0.03]} />
           <meshBasicMaterial color="black" />
        </mesh>
         <mesh position={[0, -0.05, 0.23]}>
           <circleGeometry args={[0.04]} />
           <meshBasicMaterial color="black" />
        </mesh>
      </group>

      {/* Limbs (Curved to hold branch) */}
      {/* Front Left */}
      <group position={[0.3, 0.2, 0.3]} rotation={[0, 0, -0.5]} ref={armL}>
          <mesh position={[0, 0.4, 0]}>
             <capsuleGeometry args={[0.12, 0.8, 4, 8]} />
             <furMaterial />
          </mesh>
          {/* Claw */}
          <mesh position={[0, 0.9, 0]} rotation={[0.5, 0, 0]}>
              <coneGeometry args={[0.05, 0.2, 8]} />
              <meshStandardMaterial color="#333" />
          </mesh>
      </group>

      {/* Front Right */}
      <group position={[0.3, 0.2, -0.3]} rotation={[0, 0, -0.5]} ref={armR}>
          <mesh position={[0, 0.4, 0]}>
             <capsuleGeometry args={[0.12, 0.8, 4, 8]} />
             <furMaterial />
          </mesh>
          <mesh position={[0, 0.9, 0]} rotation={[0.5, 0, 0]}>
              <coneGeometry args={[0.05, 0.2, 8]} />
              <meshStandardMaterial color="#333" />
          </mesh>
      </group>

      {/* Back Left */}
      <group position={[-0.3, 0.2, 0.3]} rotation={[0, 0, 0.5]} ref={legL}>
          <mesh position={[0, 0.4, 0]}>
             <capsuleGeometry args={[0.12, 0.8, 4, 8]} />
             <furMaterial />
          </mesh>
          <mesh position={[0, 0.9, 0]} rotation={[0.5, 0, 0]}>
              <coneGeometry args={[0.05, 0.2, 8]} />
              <meshStandardMaterial color="#333" />
          </mesh>
      </group>

      {/* Back Right */}
      <group position={[-0.3, 0.2, -0.3]} rotation={[0, 0, 0.5]} ref={legR}>
          <mesh position={[0, 0.4, 0]}>
             <capsuleGeometry args={[0.12, 0.8, 4, 8]} />
             <furMaterial />
          </mesh>
          <mesh position={[0, 0.9, 0]} rotation={[0.5, 0, 0]}>
              <coneGeometry args={[0.05, 0.2, 8]} />
              <meshStandardMaterial color="#333" />
          </mesh>
      </group>
    </group>
  )
}

export default Sloth
