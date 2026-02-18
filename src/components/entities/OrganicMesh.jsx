import React, { useMemo, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import * as THREE from 'three'
import { createVariableRadiusCylinderGeometry } from '../../utils/OrganicGeometry'

const OrganicMesh = forwardRef(({ length = 1, segments = 5, radiusFunction = (t) => 0.2, children, ...props }, ref) => {
  const mesh = useRef()

  // Create Geometry and Skeleton
  const { geometry, skeleton, bones } = useMemo(() => {
    // Geometry
    // Higher radial segments for smoother look
    const geo = createVariableRadiusCylinderGeometry(length, segments, 16, segments * 4, radiusFunction)

    // Bones
    const bones = []
    const segmentLength = length / (segments - 1)

    // Create bones in a chain
    let prevBone = null
    for (let i = 0; i < segments; i++) {
      const bone = new THREE.Bone()
      // Positions are local.
      // Root bone at 0.
      // Subsequent bones at segmentLength relative to parent.
      bone.position.y = i === 0 ? 0 : segmentLength

      if (prevBone) {
        prevBone.add(bone)
      }
      bones.push(bone)
      prevBone = bone
    }

    const skeleton = new THREE.Skeleton(bones)

    return { geometry: geo, skeleton, bones }
  }, [length, segments, radiusFunction])

  // Bind skeleton
  useEffect(() => {
    if (mesh.current) {
      // Add root bone to mesh so it's part of the scene graph
      mesh.current.add(bones[0])
      mesh.current.bind(skeleton)
    }

    // Cleanup? We don't want to dispose geometry/skeleton manually as React handles unmount,
    // but Three.js objects might leak if not careful.
    // However, geometry is created in useMemo.

    return () => {
       // Optional cleanup if needed
    }
  }, [skeleton, bones])

  // Expose bones to parent
  useImperativeHandle(ref, () => ({
    bones,
    mesh: mesh.current,
    skeleton
  }))

  return (
    <skinnedMesh ref={mesh} geometry={geometry} {...props}>
      {children}
    </skinnedMesh>
  )
})

export default OrganicMesh
