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
        uniform float uTime;
        uniform float uHeight;
        uniform float uSpeed;

        attribute float aRandom;

        varying float vAlpha;
        varying vec2 vUv;

        void main() {
          vUv = uv;

          // 1. Instance Position
          // Extract translation from instance matrix
          vec3 instPos = instanceMatrix[3].xyz;

          // Animate Falling
          float speed = uSpeed + aRandom * 15.0; // Varied speed
          float yOffset = uTime * speed;

          // Calculate wrapped Y
          // Assuming initial Y is 0 to uHeight?
          // Actually we spawn them in a box.
          // instPos.y is fixed. We subtract offset.
          // We need modulo to keep them in [0, uHeight] or relative.

          float currentY = instPos.y - yOffset;
          // Wrap around uHeight.
          // We want range [0, uHeight] roughly.
          float wrappedY = mod(currentY, uHeight);

          // If instPos.y varies, this works if we treat uHeight as the "domain size".
          // Let's assume uHeight is 30. wrappedY is 0..30.
          // We want rain to cover the scene.
          // We'll recenter it vertically if needed, but 0..30 is fine (ground to tree top).
          // Maybe shift it down a bit?
          // Let's just use it as is.

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

          // 3. Final Position
          vec3 worldPos = center + localPos;

          // 4. Wind / Tilt
          // Add slight slant based on wind
          float wind = 1.0; // Constant wind
          worldPos.x += (localPos.y) * wind * 0.5;
          // This tilts the streak.

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
      <planeGeometry args={[0.02, 2.0]} />
      <instancedBufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}

export default Rain
