import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Rain = ({ count = 6000 }) => {
  const mesh = useRef()

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#aaccff') },
        uHeight: { value: 30.0 }, // Rain falls from 30
        uSpeed: { value: 25.0 }
      },
      vertexShader: `
        #include <common>

        uniform float uTime;
        uniform float uHeight;
        uniform float uSpeed;

        attribute float aRandom;

        varying float vAlpha;
        varying vec2 vUv;

        void main() {
          vUv = uv;

          // 1. Instance Position
          // Extract translation from instanceMatrix (column 3)
          vec3 instPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

          // Animate Falling
          float speed = uSpeed + aRandom * 15.0; // Varied speed
          float yOffset = uTime * speed;

          // Calculate wrapped Y
          float currentY = instPos.y - yOffset;
          float wrappedY = mod(currentY, uHeight);

          vec3 center = vec3(instPos.x, wrappedY, instPos.z);

          // 2. Billboarding (Constrained to Y axis)
          // Streak should face camera horizontally
          vec3 dir = normalize(cameraPosition - center);
          float angle = atan(dir.x, dir.z);

          float s = sin(angle);
          float c = cos(angle);

          // Rotate position around Y
          // Plane is XY. Normal is Z.
          // Rotating so Normal points to camera.
          vec3 localPos = position;

          // Manual rotation matrix application for Y axis
          float rx = localPos.x * c + localPos.z * s;
          float rz = -localPos.x * s + localPos.z * c;
          localPos.x = rx;
          localPos.z = rz;

          // 3. Wind / Tilt
          // Add slight slant based on wind
          float wind = 1.0; // Constant wind
          localPos.x += localPos.y * 0.5 * wind;

          // 4. Final Position
          vec3 worldPos = center + localPos;

          vec4 mvPosition = viewMatrix * vec4(worldPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Distance Fade
          float dist = length(mvPosition.xyz);
          float alphaFade = smoothstep(2.0, 5.0, dist) * (1.0 - smoothstep(120.0, 150.0, dist));
          vAlpha = 0.4 * alphaFade; // Base opacity 0.4
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        varying vec2 vUv;

        void main() {
          // Soft ends
          float gradient = 1.0 - abs(vUv.y - 0.5) * 2.0;
          gradient = pow(gradient, 2.0); // Sharper taper

          gl_FragColor = vec4(uColor, vAlpha * gradient);
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
      const y = Math.random() * 30 // 0 to 30
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
      {/* Very thin, long streaks */}
      <planeGeometry args={[0.02, 2.0]}>
        <instancedBufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </planeGeometry>
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}

export default Rain
