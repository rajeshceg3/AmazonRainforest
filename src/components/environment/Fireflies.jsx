import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Fireflies = ({ count = 200 }) => {
  const points = useRef()

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#ffffe0') }, // Light yellow
        uSize: { value: 100.0 } // base size
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        attribute float aScale;
        attribute vec3 aRandomness;

        void main() {
          vec3 pos = position;

          // Add subtle floating movement
          // Use randomness to make each firefly move differently
          pos.x += sin(uTime * 0.5 + aRandomness.x * 10.0) * 0.5;
          pos.y += cos(uTime * 0.3 + aRandomness.y * 10.0) * 0.5;
          pos.z += sin(uTime * 0.4 + aRandomness.z * 10.0) * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size attenuation
          gl_PointSize = uSize * aScale / -mvPosition.z;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;

          // Glow effect
          float strength = 1.0 - (d * 2.0);
          strength = pow(strength, 2.0);

          gl_FragColor = vec4(uColor, strength);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [])

  const [positions, scales, randomness] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sc = new Float32Array(count)
    const rnd = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400
      pos[i * 3 + 1] = 1 + Math.random() * 8 // Height 1 to 9
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400

      sc[i] = Math.random()

      rnd[i * 3] = Math.random()
      rnd[i * 3 + 1] = Math.random()
      rnd[i * 3 + 2] = Math.random()
    }
    return [pos, sc, rnd]
  }, [count])

  useFrame((state) => {
    if (points.current) {
      points.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={count}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandomness"
          count={count}
          array={randomness}
          itemSize={3}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

export default Fireflies
