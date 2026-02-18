import React, { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getTerrainHeight } from '../../utils/TerrainHeight'

const WingMaterial = () => {
    const shaderRef = useRef()
    useFrame((state) => {
        if(shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime
    })

    return (
        <shaderMaterial
            ref={shaderRef}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            uniforms={{
                uTime: { value: 0 },
                uColor: { value: new THREE.Color('#88ccff') } // Iridescent blueish
            }}
            vertexShader={`
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    // Flap geometry slightly
                    vec3 pos = position;
                    // simple rotation simulation handled in fragment mostly for blur
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `}
            fragmentShader={`
                uniform float uTime;
                uniform vec3 uColor;
                varying vec2 vUv;

                void main() {
                    // Fast sine wave for opacity/blur simulation
                    // Hummingbird wings beat at 50Hz+
                    float flap = sin(uTime * 150.0 + vUv.y * 10.0);
                    float alpha = 0.3 + 0.4 * abs(flap);

                    // Radial fade for wing shape
                    float dist = length(vUv - vec2(0.5, 0.0)); // Pivot at 0.5, 0
                    float shape = 1.0 - smoothstep(0.0, 1.0, dist);

                    gl_FragColor = vec4(uColor, alpha * shape);
                }
            `}
        />
    )
}

const HummingbirdModel = () => {
    // Green iridescent body
    const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: "#22aa44",
        roughness: 0.2,
        metalness: 0.8,
        emissive: "#004400",
        emissiveIntensity: 0.2
    }), [])

    return (
        <group>
            {/* Body */}
            <mesh position={[0, 0, 0]} material={bodyMat}>
                <capsuleGeometry args={[0.08, 0.15, 4, 8]} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.12, 0.05]} material={bodyMat}>
                <sphereGeometry args={[0.07, 8, 8]} />
            </mesh>
            {/* Beak */}
            <mesh position={[0, 0.14, 0.15]} rotation={[0.4, 0, 0]}>
                <cylinderGeometry args={[0.005, 0.02, 0.2, 8]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            {/* Wings */}
            <mesh position={[0.1, 0.05, -0.05]} rotation={[0, 0, -0.5]}>
                <planeGeometry args={[0.3, 0.1]} />
                <WingMaterial />
            </mesh>
            <mesh position={[-0.1, 0.05, -0.05]} rotation={[0, 0, 0.5]}>
                <planeGeometry args={[0.3, 0.1]} />
                <WingMaterial />
            </mesh>
        </group>
    )
}

const Hummingbird = ({ position = [0, 5, 0] }) => {
  const ref = useRef()
  // State: Hovering or Darting
  // Target position
  const target = useRef(new THREE.Vector3(...position))
  const state = useRef({ mode: 'hover', timer: 0 })
  const velocity = useRef(new THREE.Vector3())

  useFrame((stateCtx, delta) => {
      if (!ref.current) return

      const time = stateCtx.clock.elapsedTime

      // Update timer
      state.current.timer -= delta

      if (state.current.timer <= 0) {
          // Switch state
          if (state.current.mode === 'hover') {
              // Dart to new location
              state.current.mode = 'dart'
              state.current.timer = 0.5 + Math.random() * 1.0

              // Find new target nearby
              const r = 5 + Math.random() * 5
              const theta = Math.random() * Math.PI * 2
              const phi = Math.random() * Math.PI

              const x = ref.current.position.x + r * Math.sin(phi) * Math.cos(theta)
              const z = ref.current.position.z + r * Math.sin(phi) * Math.sin(theta)
              let y = ref.current.position.y + (Math.random() - 0.5) * 4.0

              // Stay within bounds
              const ground = getTerrainHeight(x, z)
              y = Math.max(ground + 1, Math.min(y, 15)) // Stay low-ish

              target.current.set(x, y, z)

          } else {
              // Hover
              state.current.mode = 'hover'
              state.current.timer = 1.0 + Math.random() * 2.0
          }
      }

      // Movement
      const currentPos = ref.current.position
      const dir = new THREE.Vector3().subVectors(target.current, currentPos)
      const dist = dir.length()

      if (dist > 0.1) {
          dir.normalize()
          const speed = state.current.mode === 'dart' ? 12.0 : 2.0 // Fast dart, slow adjustment

          // Smooth acceleration
          velocity.current.lerp(dir.multiplyScalar(speed), 5.0 * delta)
      } else {
          velocity.current.lerp(new THREE.Vector3(0,0,0), 5.0 * delta)
      }

      ref.current.position.add(velocity.current.clone().multiplyScalar(delta))

      // Look direction
      if (velocity.current.length() > 0.1) {
          const lookTarget = currentPos.clone().add(velocity.current)
          ref.current.lookAt(lookTarget)
      }

      // Bobbing while hovering
      if (state.current.mode === 'hover') {
          ref.current.position.y += Math.sin(time * 10) * 0.005
      }
  })

  return (
    <group ref={ref} position={position}>
        <HummingbirdModel />
        {/* Simple point light for iridescence glow */}
        <pointLight distance={1} intensity={0.5} color="#aaffaa" />
    </group>
  )
}

export default Hummingbird
