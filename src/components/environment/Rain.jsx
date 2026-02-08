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
        uSpeed: { value: 20.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uHeight;
        uniform float uSpeed;

        attribute float aRandom;

        varying float vAlpha;

        // Rotation matrix around Y axis
        mat3 rotateY(float angle) {
            float s = sin(angle);
            float c = cos(angle);
            return mat3(
                c, 0.0, s,
                0.0, 1.0, 0.0,
                -s, 0.0, c
            );
        }

        void main() {
          // Decompose matrix to get initial position
          mat4 instMat = instanceMatrix;
          vec3 instPos = instMat[3].xyz;

          // Animate Y translation
          float speed = uSpeed + aRandom * 5.0;
          float yOffset = uTime * speed;

          // Calculate current Y in world space (relative to initial pos)
          // We assume initial positions are scattered in Y from 0 to 25
          float currentY = instPos.y - yOffset;

          // Wrap around uHeight
          // range [0, 25]
          // modulo math: mod(x, y) returns x - y * floor(x/y)
          float wrappedY = mod(currentY, uHeight);

          // Construct current world position center
          vec3 center = vec3(instPos.x, wrappedY, instPos.z);

          // Billboarding: Rotate around Y to face camera
          vec3 viewVector = cameraPosition - center;
          float angle = atan(viewVector.x, viewVector.z);

          // Apply rotation to local position
          // We assume plane is facing Z initially (normal is Z)
          // Actually PlaneGeometry is facing Z (vertices in XY plane).
          // We want to rotate it so its normal faces camera.
          // atan(x, z) gives angle from Z axis.

          vec3 localPos = rotateY(angle) * position;

          // Final world position
          vec3 worldPos = center + localPos;

          vec4 mvPosition = viewMatrix * vec4(worldPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Distance fade for softness
          float dist = length(mvPosition.xyz);
          // Fade out when close (so it doesn't clip weirdly) and when far
          float alphaFade = smoothstep(1.0, 5.0, dist) * (1.0 - smoothstep(150.0, 200.0, dist));
          vAlpha = 0.6 * alphaFade;
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
      {/* Thinner and longer streaks for realistic rain */}
      <planeGeometry args={[0.03, 1.5]} />
      <instancedBufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}

export default Rain
