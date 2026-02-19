import * as THREE from 'three'

/**
 * Creates a cylinder geometry with variable radius and automatic skinning weights.
 * @param {number} length - Total length of the cylinder (along Y axis).
 * @param {number} boneCount - Number of bones to create weights for.
 * @param {number} radialSegments - Number of radial segments (around).
 * @param {number} heightSegments - Number of height segments (along length).
 * @param {function} radiusFunction - Function (t: 0..1) => radius.
 */
export function createVariableRadiusCylinderGeometry(length, boneCount, radialSegments, heightSegments, radiusFunction) {
  // Use CylinderGeometry as base
  // Top radius 1, Bottom radius 1 (we will modify), height = length
  // openEnded = false (caps)
  const geometry = new THREE.CylinderGeometry(1, 1, length, radialSegments, heightSegments, true)

  // Shift geometry so base is at y=0, top is at y=length
  // Cylinder is centered at 0, extends -length/2 to length/2
  geometry.translate(0, length / 2, 0)

  const positionAttribute = geometry.attributes.position
  const vertex = new THREE.Vector3()

  // Array for skinning
  const skinIndices = []
  const skinWeights = []

  const segmentLength = length / (boneCount - 1)

  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.fromBufferAttribute(positionAttribute, i)

    // Normalize Y (0 to 1)
    const t = THREE.MathUtils.clamp(vertex.y / length, 0, 1)

    // Apply Radius Function
    const radius = radiusFunction(t)

    // Current radius is sqrt(x^2 + z^2) approx 1.0 (since we created with radius 1)
    // We want to scale x and z to 'radius'
    // But we need to preserve direction.
    // Cylinder geometry creates vertices at radius 1.
    // So we just multiply x and z by radius.
    vertex.x = (vertex.x / 1.0) * radius
    vertex.z = (vertex.z / 1.0) * radius

    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)

    // Calculate Skin Weights
    // Find which bone segment this vertex belongs to
    // Bones are at 0, segmentLength, 2*segmentLength ...

    let boneIndex = Math.floor(vertex.y / segmentLength)
    // Clamp boneIndex to [0, boneCount - 2]
    // Because we blend between boneIndex and boneIndex + 1
    boneIndex = Math.min(boneIndex, boneCount - 2)
    boneIndex = Math.max(0, boneIndex) // Safety

    const boneY = boneIndex * segmentLength
    const dist = vertex.y - boneY
    const weightNext = dist / segmentLength // 0 to 1
    const weightCurr = 1.0 - weightNext

    // Push indices and weights (4 per vertex)
    skinIndices.push(boneIndex, boneIndex + 1, 0, 0)
    skinWeights.push(weightCurr, weightNext, 0, 0)
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))

  geometry.computeVertexNormals()

  return geometry
}
