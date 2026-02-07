import { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'

const FernGeometry = () => {
  return useMemo(() => {
    // Create a simple fern-like shape by merging a few elongated planes
    const geometry = new THREE.BufferGeometry()

    const numLeaves = 5
    const vertices = []
    const normals = []
    const indices = []
    const uvs = []

    // Helper to add a leaf
    // A leaf is a simple triangle or quad. Let's do a triangle for simplicity and organic look (tapered).
    // Width: 0.5, Height: 2.0

    for (let i = 0; i < numLeaves; i++) {
      const angle = (i / numLeaves) * Math.PI * 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      // Base center
      const x0 = 0, y0 = 0, z0 = 0

      // Base left/right (small width at base)
      const wBase = 0.05
      const x1 = cos * wBase, z1 = sin * wBase, y1 = 0
      const x2 = -cos * wBase, z2 = -sin * wBase, y2 = 0 // Wait, this just mirrors.

      // Tip (curved outward)
      // Lean out by distance L
      const lean = 1.0
      const height = 1.5 + Math.random() * 0.5
      const xTip = cos * lean, zTip = sin * lean, yTip = height

      // Let's make a triangle: BaseLeft, BaseRight, Tip.
      // Actually, a quad is better for a leaf blade.
      // Base(-w), Base(+w), Tip(0)

      // To keep it simple, let's just use 3 vertices per leaf (Triangle)
      // But we need double side rendering.

      // Vertex 0: Base Left
      // Vertex 1: Base Right
      // Vertex 2: Tip

      // We need to rotate these points around Y by `angle`.
      // Let's define in local leaf space then rotate.
      // Local:
      // P0: (-0.1, 0, 0)
      // P1: (0.1, 0, 0)
      // P2: (0, height, 0.5) // Lean out in Z

      const p0 = new THREE.Vector3(-0.1, 0, 0)
      const p1 = new THREE.Vector3(0.1, 0, 0)
      const p2 = new THREE.Vector3(0, height, 0.8) // curve out

      // Rotate around Y
      p0.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      p1.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      p2.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)

      // Add to vertices
      const baseIndex = vertices.length / 3

      vertices.push(p0.x, p0.y, p0.z)
      vertices.push(p1.x, p1.y, p1.z)
      vertices.push(p2.x, p2.y, p2.z)

      // Normals (approximate up/out)
      // Just use (0,1,0) for now or compute face normal
      const n = new THREE.Vector3()
      const vA = new THREE.Vector3().subVectors(p1, p0)
      const vB = new THREE.Vector3().subVectors(p2, p0)
      n.crossVectors(vA, vB).normalize()

      vertices.push(p0.x, p0.y, p0.z)
      vertices.push(p2.x, p2.y, p2.z)
      vertices.push(p1.x, p1.y, p1.z) // Back face

      // Front face
      indices.push(baseIndex, baseIndex + 1, baseIndex + 2)
      // Back face
      indices.push(baseIndex + 3, baseIndex + 4, baseIndex + 5)

      // Normals
      normals.push(n.x, n.y, n.z)
      normals.push(n.x, n.y, n.z)
      normals.push(n.x, n.y, n.z)

      const nBack = n.clone().negate()
      normals.push(nBack.x, nBack.y, nBack.z)
      normals.push(nBack.x, nBack.y, nBack.z)
      normals.push(nBack.x, nBack.y, nBack.z)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    // geometry.setIndex(indices) // Actually I just pushed vertices for triangles, no need for index if unindexed draw?
    // Wait, indices.push implies indexed geometry.
    // If I use setIndex, vertices should be unique. But I duplicated them for back face to have correct normals.
    // Actually, I pushed 6 vertices per leaf.
    // So I can just not use indices and use drawArrays (triangles).
    // Or use indices [0, 1, 2, 3, 4, 5...]

    return geometry
  }, [])
}

const ForestFloor = () => {
  const count = 500

  // Custom Fern Geometry
  const fernGeo = FernGeometry()

  // Ground Geometry with Noise
  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 64, 64)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i) // In PlaneGeometry, Y is the second coordinate.
      // Generate some noise
      // large low frequency noise + small high freq
      const h = Math.sin(x * 0.2) * Math.sin(y * 0.15) * 2.0
              + Math.sin(x * 0.5 + y * 0.5) * 0.5
              + (Math.random() - 0.5) * 0.1

      pos.setZ(i, h) // Plane is XY, Z is displacement.
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <group>
      {/* Ground Plane */}
      <mesh
        geometry={groundGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#0f220f"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Fern Foliage using Instances */}
      <Instances range={count} geometry={fernGeo}>
        <meshStandardMaterial color="#2d5a27" side={THREE.DoubleSide} />
        {Array.from({ length: count }).map((_, i) => {
             const x = (Math.random() - 0.5) * 60
             const z = (Math.random() - 0.5) * 60
             // Calculate ground height at this position roughly
             const h = Math.sin(x * 0.2) * Math.sin(z * 0.15) * 2.0
                     + Math.sin(x * 0.5 + z * 0.5) * 0.5

             return (
              <Instance
                key={i}
                position={[
                  x,
                  h, // Place on ground
                  z
                ]}
                rotation={[0, Math.random() * Math.PI * 2, 0]}
                scale={0.8 + Math.random() * 0.5}
              />
            )
        })}
      </Instances>
    </group>
  )
}

export default ForestFloor
