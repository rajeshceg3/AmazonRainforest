import React, { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shared Geometry and Material Logic
const leafGeometry = new THREE.PlaneGeometry(0.12, 0.3, 2, 4)
leafGeometry.translate(0, 0.15, 0) // Pivot at bottom

// Create a custom material based on MeshStandardMaterial
const VineLeafMaterial = new THREE.MeshStandardMaterial({
  color: "#5e8c31",
  side: THREE.DoubleSide,
  roughness: 0.6,
  metalness: 0.1,
  transparent: false, // We use discard, so alphaTest acts as cutoff. Set transparent false to write depth?
                      // Actually if we discard, we don't need sorting, so opaque (transparent: false) is better for depth buffer.
                      // But we need to disable culling? DoubleSide handles that.
})

// Inject wind logic and procedural shape
const leafUniforms = {
  uTime: { value: 0 },
  uWindStrength: { value: 0.3 },
  uWindSpeed: { value: 1.0 }
}

VineLeafMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = leafUniforms.uTime
  shader.uniforms.uWindStrength = leafUniforms.uWindStrength
  shader.uniforms.uWindSpeed = leafUniforms.uWindSpeed

  // --- Vertex Shader ---
  shader.vertexShader = `
    uniform float uTime;
    uniform float uWindStrength;
    uniform float uWindSpeed;
    varying vec2 vCustomUv;
  ` + shader.vertexShader

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    vCustomUv = uv;

    // Wind Logic
    // World pos estimation
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    float windPhase = uTime * uWindSpeed + worldPos.x * 0.5 + worldPos.z * 0.5;
    float wind = sin(windPhase) * uWindStrength;

    // Bend based on Y height of the leaf (local)
    float bend = wind * position.y * 2.0;

    transformed.x += bend;
    transformed.z += bend * 0.5;

    // Flutter
    transformed.y += sin(uTime * 15.0 + worldPos.x) * 0.02 * position.y;
    `
  )

  // --- Fragment Shader ---
  shader.fragmentShader = `
    varying vec2 vCustomUv;
  ` + shader.fragmentShader

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <alphatest_fragment>',
    `
    // Procedural Leaf Shape
    float lx = (vCustomUv.x - 0.5) * 2.0; // -1 to 1
    float ly = vCustomUv.y; // 0 to 1

    // Shape: Simple leaf (sine wave width)
    float maxW = sin(ly * 3.14159) * 0.9;

    // Discard pixels outside the leaf shape
    if (abs(lx) > maxW) discard;

    // Gradient for fake AO/vein
    float dist = abs(lx);
    // Darker in center (vein) and edges?
    // float shadow = 1.0 - dist * 0.5;
    // diffuseColor.rgb *= shadow;

    #include <alphatest_fragment>
    `
  )
}


const Vine = ({ position, length, delay }) => {
  const groupRef = useRef()

  // Generate leaf transforms
  const leaves = useMemo(() => {
    return Array.from({ length: Math.floor(length / 2) }).map((_, i) => {
      // Helix pattern
      const t = i / (length/2)
      const angle = t * Math.PI * 4
      const y = -i * 0.4 - 0.2
      return {
        position: [Math.sin(angle)*0.1, y, Math.cos(angle)*0.1],
        rotation: [Math.random() + 0.5, angle, Math.random() * 0.5],
        scale: 0.8 + Math.random() * 0.4
      }
    })
  }, [length])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    leafUniforms.uTime.value = time

    if (groupRef.current) {
      const swing = Math.sin(time * 0.5 + delay) * 0.05
      groupRef.current.rotation.z = swing
      groupRef.current.rotation.x = Math.cos(time * 0.3 + delay) * 0.05
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Vine Stem */}
      <mesh position={[0, -length / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.02, 0.01, length, 5]} />
        <meshStandardMaterial color="#3e2b1f" roughness={1.0} />
      </mesh>

      {/* Leaves */}
      {leaves.map((leaf, i) => (
        <mesh
          key={i}
          position={leaf.position}
          rotation={leaf.rotation}
          scale={[leaf.scale, leaf.scale, leaf.scale]}
          geometry={leafGeometry}
          material={VineLeafMaterial}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  )
}

const Understory = () => {
  const vineCount = 80

  const vines = useMemo(() => {
    return Array.from({ length: vineCount }).map(() => ({
      position: [
        (Math.random() - 0.5) * 350,
        18 + Math.random() * 8, // Hanging from canopy height
        (Math.random() - 0.5) * 350
      ],
      length: 8 + Math.random() * 12,
      delay: Math.random() * Math.PI * 2
    }))
  }, [])

  return (
    <group>
      {vines.map((props, i) => (
        <Vine key={i} {...props} />
      ))}
    </group>
  )
}

export default Understory
