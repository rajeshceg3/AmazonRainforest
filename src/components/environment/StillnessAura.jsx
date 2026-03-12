import React, { useRef, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const StillnessAura = () => {
    const { camera } = useThree()
    const pointsRef = useRef()
    const lightRef = useRef()

    // State to track stillness
    const lastPos = useRef(new THREE.Vector3())
    const stillnessTimer = useRef(0)
    const activeStillness = useRef(0) // 0 to 1

    const count = 300

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color('#ffdd88') }, // Warm golden light
                uSize: { value: 80.0 },
                uOpacity: { value: 0.0 } // Controlled by stillness
            },
            vertexShader: `
                uniform float uTime;
                uniform float uSize;
                uniform float uOpacity;
                attribute float aScale;
                attribute vec3 aOffset;
                attribute float aSpeed;
                attribute float aRadius;

                varying float vAlpha;

                void main() {
                    // Start from camera position (local space is 0,0,0 relative to group)
                    vec3 pos = position;

                    // Orbital motion
                    float angle = uTime * aSpeed + aOffset.x * 10.0;

                    // Spiral inwards/outwards gently based on offset
                    float currentRadius = aRadius + sin(uTime * 0.5 + aOffset.y) * 0.5;

                    pos.x += cos(angle) * currentRadius;
                    pos.z += sin(angle) * currentRadius;

                    // Vertical bobbing
                    pos.y += sin(uTime * 0.8 + aOffset.z * 10.0) * (currentRadius * 0.5);

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;

                    gl_PointSize = uSize * aScale * uOpacity / -mvPosition.z;

                    // Fade out particles that get too far or too close
                    float dist = length(pos);
                    vAlpha = smoothstep(0.0, 1.5, dist) * smoothstep(5.0, 3.0, dist) * uOpacity;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;

                void main() {
                    float d = distance(gl_PointCoord, vec2(0.5));
                    if (d > 0.5) discard;

                    // Soft glowing core
                    float strength = pow(1.0 - (d * 2.0), 3.0);

                    gl_FragColor = vec4(uColor, strength * vAlpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    }, [])

    const [positions, scales, offsets, speeds, radii] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const sc = new Float32Array(count)
        const off = new Float32Array(count * 3)
        const spd = new Float32Array(count)
        const rad = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            // Start at origin (relative to camera)
            pos[i * 3] = 0
            pos[i * 3 + 1] = (Math.random() - 0.5) * 4 // Spread vertically
            pos[i * 3 + 2] = 0

            sc[i] = 0.5 + Math.random() * 1.5

            off[i * 3] = Math.random()
            off[i * 3 + 1] = Math.random()
            off[i * 3 + 2] = Math.random()

            spd[i] = (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.5)
            rad[i] = 1.0 + Math.random() * 3.0
        }
        return [pos, sc, off, spd, rad]
    }, [count])

    useFrame((state, delta) => {
        // Track camera movement
        const currentPos = camera.position
        const distMoved = currentPos.distanceTo(lastPos.current)
        lastPos.current.copy(currentPos)

        // Threshold for "stillness"
        if (distMoved < 0.01) {
            stillnessTimer.current += delta
        } else {
            stillnessTimer.current = 0
        }

        // Calculate target stillness (0 to 1)
        // Starts fading in after 5 seconds of stillness, peaks at 10 seconds
        let targetStillness = 0
        if (stillnessTimer.current > 5.0) {
            targetStillness = THREE.MathUtils.clamp((stillnessTimer.current - 5.0) / 5.0, 0, 1)
        }

        // Smoothly interpolate current stillness
        activeStillness.current = THREE.MathUtils.lerp(activeStillness.current, targetStillness, delta * 0.5)

        // Update uniforms and group position
        if (pointsRef.current) {
            pointsRef.current.position.copy(camera.position) // Follow camera
            pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
            pointsRef.current.material.uniforms.uOpacity.value = activeStillness.current
        }

        // Update lighting
        if (lightRef.current) {
            lightRef.current.position.copy(camera.position)
            lightRef.current.intensity = activeStillness.current * 1.5 // Max intensity 1.5
        }

        // Update Audio Manager
        if (window.soundscapeManager && window.soundscapeManager.setStillness) {
            window.soundscapeManager.setStillness(activeStillness.current)
        }

        // Dispatch UI event for Overlay
        window.dispatchEvent(new CustomEvent('stillnessUpdate', { detail: activeStillness.current }))
    })

    return (
        <group>
            <points ref={pointsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-aScale" count={count} array={scales} itemSize={1} />
                    <bufferAttribute attach="attributes-aOffset" count={count} array={offsets} itemSize={3} />
                    <bufferAttribute attach="attributes-aSpeed" count={count} array={speeds} itemSize={1} />
                    <bufferAttribute attach="attributes-aRadius" count={count} array={radii} itemSize={1} />
                </bufferGeometry>
                <primitive object={material} attach="material" />
            </points>
            <pointLight ref={lightRef} color="#ffccaa" distance={10} decay={2} intensity={0} />
        </group>
    )
}

export default StillnessAura
