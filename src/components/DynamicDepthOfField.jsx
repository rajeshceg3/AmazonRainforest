import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DepthOfField } from '@react-three/postprocessing'
import * as THREE from 'three'

const DynamicDepthOfField = () => {
  const dofRef = useRef()
  const { camera, scene } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const center = useRef(new THREE.Vector2(0, 0)) // Center of screen
  const targetFocus = useRef(0.01)
  const frameCount = useRef(0)

  useFrame((state, delta) => {
    if (!dofRef.current) return

    frameCount.current += 1
    if (frameCount.current % 10 === 0) {
      // Cast ray from center of camera
      raycaster.current.setFromCamera(center.current, camera)

      // Intersect with scene objects (you might want to filter this to only specific 'fauna' objects if performance is an issue)
      const intersects = raycaster.current.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        // Find the first valid intersection (avoiding post-processing or invisible planes)
        const hit = intersects.find(i => i.object.type === 'Mesh' || i.object.type === 'InstancedMesh')

        if (hit) {
          // Map real world distance to DepthOfField focusDistance (approximate mapping)
          const dist = hit.distance
          // The DoF focusDistance is normalized, usually between 0 and 1, where 1 is the far clipping plane
          // Need to normalize the distance based on camera near/far
          const normalizedDist = Math.max(0.01, Math.min(dist / camera.far, 1.0))
          targetFocus.current = normalizedDist
        } else {
          // Default far focus
          targetFocus.current = 0.01
        }
      } else {
        targetFocus.current = 0.01
      }
    }

    // Update focus distance on the effect directly
    // Using a ref to track the current visual focus to interpolate
    if (!dofRef.current.currentFocus) {
      dofRef.current.currentFocus = 0.01;
    }

    dofRef.current.currentFocus = THREE.MathUtils.lerp(
      dofRef.current.currentFocus,
      targetFocus.current,
      delta * 4.0
    );

    // Apply to postprocessing effect instance
    dofRef.current.focusDistance = dofRef.current.currentFocus;
  })

  return (
    <DepthOfField
      ref={dofRef}
      target={null} // use focusDistance directly
      focusDistance={0.01}
      focalLength={0.02}
      bokehScale={1.5}
      height={480}
    />
  )
}

export default DynamicDepthOfField
