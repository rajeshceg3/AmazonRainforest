import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import { getTerrainHeight } from '../../utils/TerrainHeight'

// Custom shader injection for Frog Skin (Spots + Wetness)
const FrogSkinMaterial = ({ color }) => {
  const shaderRef = useRef()

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 }
    shader.uniforms.uBaseColor = { value: new THREE.Color(color) }
    shader.uniforms.uSpotColor = { value: new THREE.Color('#050505') } // Nearly black

    shader.fragmentShader = `
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform vec3 uSpotColor;
      ${shader.fragmentShader}
    `

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      // Voronoi-like Spots
      vec2 st = vUv * 8.0;
      vec2 i = floor(st);
      vec2 f = fract(st);

      float minDist = 1.0;

      // Simple hash
      for(int y=-1; y<=1; y++) {
        for(int x=-1; x<=1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 p = 0.5 + 0.5 * sin(dot(i + neighbor, vec2(12.9898, 78.233)) * 43758.5453 + vec2(0.0, 1.0));
            vec2 diff = neighbor + p - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
        }
      }

      float spots = smoothstep(0.25, 0.3, minDist);

      // Mix base color and spot color
      vec3 finalColor = mix(uSpotColor, uBaseColor, spots);

      // Add diffuseColor (lighting)
      diffuseColor.rgb *= finalColor;
      `
    )
    shaderRef.current = shader
  }

  useFrame((state) => {
      if (shaderRef.current) {
          shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime
      }
  })

  return (
    <meshStandardMaterial
      onBeforeCompile={onBeforeCompile}
      roughness={0.1} // Wet skin
      metalness={0.0}
      envMapIntensity={1.5}
      defines={{ USE_UV: '' }} // Ensure UVs are passed
    />
  )
}

const FrogGeometry = () => {
    return useMemo(() => {
        // Sculpted Sphere
        const geo = new THREE.SphereGeometry(0.12, 32, 32)
        const pos = geo.attributes.position
        const v = new THREE.Vector3()

        for(let i=0; i<pos.count; i++){
            v.fromBufferAttribute(pos, i)

            // Flatten bottom
            if(v.y < -0.05) v.y *= 0.1

            // Elongate body slightly
            v.z *= 1.3

            // Eye bulges
            // Eyes are at +y, +/-x, +z
            const isEye = Math.abs(v.x) > 0.04 && v.y > 0.06 && v.z > 0.05
            if(isEye) {
                v.y += 0.05
                v.x *= 1.1
                v.z += 0.02
            }

            // Throat pouch (slight bulge at bottom front)
            if (v.y < 0 && v.z > 0.05 && Math.abs(v.x) < 0.05) {
                v.z += 0.03
                v.y -= 0.02
            }

            pos.setXYZ(i, v.x, v.y, v.z)
        }
        geo.computeVertexNormals()
        return geo
    }, [])
}

const PoisonDartFrog = ({ count = 30 }) => {
  const meshRef = useRef()
  const frogs = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i++) {
        // Random position near water (y < 2) or on forest floor
        let x = (Math.random() - 0.5) * 100
        let z = (Math.random() - 0.5) * 100
        let y = getTerrainHeight(x, z)

        // Prefer lower areas (near water/logs)
        if (y > 5) continue;

        // Colors: Blue, Red, Yellow
        const r = Math.random()
        let color = '#0055ff' // Blue Jeans
        if (r > 0.6) color = '#ff3300' // Strawberry
        else if (r > 0.3) color = '#ffcc00' // Golden

        arr.push({
            position: new THREE.Vector3(x, y, z),
            velocity: new THREE.Vector3(),
            state: 'idle', // idle, jump, air, land
            timer: Math.random() * 10,
            color: color,
            scale: 0.8 + Math.random() * 0.4,
            rotation: Math.random() * Math.PI * 2
        })
    }
    return arr
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, delta) => {
      if (!meshRef.current) return

      const time = state.clock.elapsedTime

      frogs.forEach((frog, i) => {
          // Logic
          frog.timer -= delta

          if (frog.state === 'idle') {
              if (frog.timer <= 0) {
                  // Jump!
                  frog.state = 'jump'
                  frog.timer = 0.5 // Jump duration approx

                  // Jump vector
                  const angle = frog.rotation + (Math.random() - 0.5) * 1.0
                  const dist = 2.0 + Math.random() * 2.0
                  frog.velocity.set(Math.sin(angle) * dist, 4.0, Math.cos(angle) * dist)

                  // Rotate to face jump direction
                  frog.rotation = angle
              }
          } else if (frog.state === 'jump') {
               // In air physics
               frog.position.x += frog.velocity.x * delta
               frog.position.y += frog.velocity.y * delta
               frog.position.z += frog.velocity.z * delta
               frog.velocity.y -= 9.8 * delta // Gravity

               const groundH = getTerrainHeight(frog.position.x, frog.position.z)

               if (frog.position.y <= groundH) {
                   frog.position.y = groundH
                   frog.state = 'idle'
                   frog.timer = 2.0 + Math.random() * 5.0 // Wait before next jump
                   frog.velocity.set(0,0,0)
               }
          }

          // Update Instance Matrix
          dummy.position.copy(frog.position)

          // Align to ground normal roughly (simplified: just upright)
          dummy.rotation.set(0, frog.rotation, 0)

          // Jump arc rotation (pitch up when jumping, down when falling)
          if (frog.state === 'jump') {
              const pitch = Math.max(-0.5, Math.min(0.5, frog.velocity.y * 0.2))
              dummy.rotateX(-pitch)
          }

          dummy.scale.setScalar(frog.scale)

          // Breathing animation when idle
          if (frog.state === 'idle') {
              const breath = Math.sin(time * 10.0 + i) * 0.05
              dummy.scale.set(frog.scale + breath*0.1, frog.scale + breath, frog.scale + breath*0.1)
          }

          dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, dummy.matrix)
      })

      meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Separate frogs by color for batching (simplified: just one batch for now, maybe use white and tint?)
  // Instances from Drei allows per-instance color, but custom shader needs uniformity or attribute.
  // We can use the 'color' attribute of InstancedMesh which is passed to shader as 'vColor' or 'instanceColor'.
  // We need to set it.

  useEffect(() => {
      if(meshRef.current) {
          const tempColor = new THREE.Color()
          frogs.forEach((frog, i) => {
              tempColor.set(frog.color)
              meshRef.current.setColorAt(i, tempColor)
          })
          meshRef.current.instanceColor.needsUpdate = true
      }
  }, [frogs])

  const frogGeo = FrogGeometry()

  return (
    <instancedMesh ref={meshRef} args={[frogGeo, null, frogs.length]} castShadow receiveShadow>
       {/* We pass a base color, but instanceColor attribute will override/multiply if we use vertex colors.
           However, our custom shader uses 'uBaseColor'. We should change the shader to use 'vColor' (instance color). */}
       <FrogSkinMaterialWithInstanceColor />
    </instancedMesh>
  )
}

// Updated Shader to use Instance Color
const FrogSkinMaterialWithInstanceColor = () => {
    const shaderRef = useRef()

    const onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      // shader.uniforms.uBaseColor removed, we use vColor (incoming vertex color from instance)
      shader.uniforms.uSpotColor = { value: new THREE.Color('#050505') }

      shader.fragmentShader = `
        uniform float uTime;
        uniform vec3 uSpotColor;
        ${shader.fragmentShader}
      `

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        // Standard color fragment applies diffuseColor *= vColor usually.
        // We want to apply spots ON TOP of that vColor.

        // Voronoi Spots
        vec2 st = vUv * 8.0;
        vec2 i = floor(st);
        vec2 f = fract(st);

        float minDist = 1.0;
        for(int y=-1; y<=1; y++) {
          for(int x=-1; x<=1; x++) {
              vec2 neighbor = vec2(float(x), float(y));
              vec2 p = 0.5 + 0.5 * sin(dot(i + neighbor, vec2(12.9898, 78.233)) * 43758.5453 + vec2(0.0, 1.0));
              vec2 diff = neighbor + p - f;
              float dist = length(diff);
              minDist = min(minDist, dist);
          }
        }

        float spots = smoothstep(0.25, 0.3, minDist);

        // diffuseColor.rgb is already white (base) * vColor (instance) at this point in standard pipeline?
        // Actually <color_fragment> sets diffuseColor.rgb *= vColor;
        // So we just need to mix it with black spots.

        diffuseColor.rgb *= vColor; // Apply instance color explicitly if not already

        diffuseColor.rgb = mix(uSpotColor, diffuseColor.rgb, spots);
        `
      )
      shaderRef.current = shader
    }

    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    return (
      <meshStandardMaterial
        onBeforeCompile={onBeforeCompile}
        roughness={0.1}
        metalness={0.0}
        envMapIntensity={1.5}
        defines={{ USE_UV: '' }}
      />
    )
  }

export default PoisonDartFrog
