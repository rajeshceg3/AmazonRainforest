/* eslint-disable react-hooks/immutability */
import React, { useRef, useMemo, useLayoutEffect } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useWaterNormals } from '../../utils/WaterNormals'
import * as THREE from 'three'

const River = () => {
  const meshRef = useRef()
  const materialRef = useRef()
  const baseNormalMap = useWaterNormals(1024)
  const normalMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])
  const distortionMap = useMemo(() => baseNormalMap.clone(), [baseNormalMap])

  // Uniforms for shader animation
  const uniforms = useRef({
    uTime: { value: 0 },
  })

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()

    // Update uniform time
    if (uniforms.current) {
        uniforms.current.uTime.value = t
    }

    // Animate texture offset for flow
    normalMap.offset.x += delta * 0.05
    normalMap.offset.y += delta * 0.02

    // Animate distortion map in opposite direction for turbulence
    distortionMap.offset.x -= delta * 0.02
    distortionMap.offset.y -= delta * 0.01
  })

  useLayoutEffect(() => {
    if (!materialRef.current) return

    const material = materialRef.current

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime

      // Helper functions
      const waveFuncs = `
        uniform float uTime;

        float getWaveHeight(vec2 p) {
            float time = uTime * 0.5;
            float wave1 = sin(p.x * 0.05 + time) * 0.5;
            float wave2 = cos(p.y * 0.1 + time * 1.6) * 0.2;
            float wave3 = sin((p.x + p.y) * 0.05 + time * 0.6) * 0.3;
            return wave1 + wave2 + wave3;
        }

        float getWaveDerivativeX(vec2 p) {
            float time = uTime * 0.5;
            float dw1 = 0.025 * cos(p.x * 0.05 + time);
            float dw3 = 0.015 * cos((p.x + p.y) * 0.05 + time * 0.6);
            return dw1 + dw3;
        }

        float getWaveDerivativeY(vec2 p) {
            float time = uTime * 0.5;
            float dw2 = -0.02 * sin(p.y * 0.1 + time * 1.6);
            float dw3 = 0.015 * cos((p.x + p.y) * 0.05 + time * 0.6);
            return dw2 + dw3;
        }
      `

      shader.vertexShader = `
        ${waveFuncs}
      ` + shader.vertexShader

      // Inject Normal Calculation
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        // Calculate new normal based on wave derivatives
        float dx = getWaveDerivativeX(position.xy);
        float dy = getWaveDerivativeY(position.xy);

        // Tangent vectors
        vec3 tX = vec3(1.0, 0.0, dx);
        vec3 tY = vec3(0.0, 1.0, dy);

        // Normal is cross product of tangents
        // Ensure correct winding order for "Up"
        vec3 newNormal = normalize(cross(tX, tY));

        objectNormal = newNormal;
        `
      )

      // Inject Vertex Displacement
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        float h = getWaveHeight(position.xy);
        transformed.z += h;
        `
      )
    }
  }, [])

  return (
    <group position={[0, -0.5, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* High resolution plane for vertex displacement */}
        <planeGeometry args={[400, 400, 256, 256]} />
        <MeshReflectorMaterial
          ref={materialRef}
          envMapIntensity={0.8}
          normalMap={normalMap}
          normalScale={[1.0, 1.0]}
          color="#031203"
          roughness={0.45}
          metalness={0.1}
          blur={[300, 100]}
          mixBlur={6.0}
          mixStrength={1.2}
          mixContrast={1.0}
          resolution={1024}
          mirror={0.5}
          depthScale={3.0}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          depthToBlurRatioBias={0.25}
          distortion={3.5}
          distortionMap={distortionMap}
          debug={0}
          defines={{ USE_UV: '' }}
        />
      </mesh>
    </group>
  )
}

export default River
