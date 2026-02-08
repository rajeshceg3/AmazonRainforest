import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Rain = ({ count = 4000 }) => {
  const mesh = useRef()

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#aaccff') },
        uHeight: { value: 25.0 }, // Rain falls from 25
        uSpeed: { value: 12.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uHeight;
        uniform float uSpeed;

        attribute float aRandom; // Per-instance random speed factor

        varying float vAlpha;

        void main() {
          // Decompose matrix
          mat4 instMat = instanceMatrix;
          vec3 instTrans = instMat[3].xyz;
          mat3 instRot = mat3(instMat); // Upper 3x3 is rotation/scale

          // Animate Y translation
          float speed = uSpeed + aRandom * 5.0;

          // Original Y from matrix acts as offset
          // We subtract time * speed
          float y = instTrans.y - uTime * speed;

          // Wrap around uHeight
          // We want range roughly 0 to 25.
          float newY = mod(y, uHeight);

          // Apply rotation to local vertex position
          vec3 rotatedPos = instRot * position;

          // Combine: Rotated Position + Translated Position (with animated Y)
          vec3 worldPos = rotatedPos + vec3(instTrans.x, newY, instTrans.z);

          vec4 mvPosition = viewMatrix * modelMatrix * vec4(worldPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Distance fade for softness
          float dist = length(mvPosition.xyz);
          vAlpha = smoothstep(35.0, 10.0, dist) * 0.5;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  }, [])

  // Setup instances
  const { instances, randoms } = useMemo(() => {
    const temp = []
    const randoms = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 400
      const y = Math.random() * 25
      const z = (Math.random() - 0.5) * 400
      temp.push({ x, y, z })
      randoms[i] = Math.random()
    }
    return { instances: temp, randoms }
  }, [count])

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    instances.forEach((data, i) => {
      dummy.position.set(data.x, data.y, data.z)
      // Random rotation around Y so streaks don't all align
      dummy.rotation.y = Math.random() * Math.PI
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }, [instances])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <planeGeometry args={[0.02, 0.8]}>
        <instancedBufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </planeGeometry>
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}

export default Rain
