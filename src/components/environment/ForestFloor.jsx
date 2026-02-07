import { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'

const FernGeometry = () => {
  return useMemo(() => {
    const geometry = new THREE.BufferGeometry()

    const numLeaves = 7
    const vertices = []

    for(let i=0; i<numLeaves; i++) {
        const angle = (i / numLeaves) * Math.PI * 2

        const height = 1.0 + Math.random() * 0.5
        const width = 0.2
        const lean = 0.6

        // Tip position
        const xTip = Math.sin(angle) * lean
        const zTip = Math.cos(angle) * lean
        const yTip = height * 0.8 // slightly curved down? No, up for now.

        // Base L/R
        const xL = Math.sin(angle - 0.15) * width
        const zL = Math.cos(angle - 0.15) * width

        const xR = Math.sin(angle + 0.15) * width
        const zR = Math.cos(angle + 0.15) * width

        // Mid point for curve?
        // Let's just do 1 triangle for simplicity but double sided

        // Triangle 1: BaseL, BaseR, Tip
        vertices.push(xL, 0, zL)
        vertices.push(xR, 0, zR)
        vertices.push(xTip, yTip, zTip)

        // Backside
        vertices.push(xL, 0, zL)
        vertices.push(xTip, yTip, zTip)
        vertices.push(xR, 0, zR)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    return geometry
  }, [])
}

const GrassGeometry = () => {
    return useMemo(() => {
        const geometry = new THREE.PlaneGeometry(0.08, 0.4, 1, 1)
        geometry.translate(0, 0.2, 0) // Pivot at bottom
        return geometry
    }, [])
}

const ForestFloor = () => {
  const fernCount = 400
  const grassCount = 2000

  const fernGeo = FernGeometry()
  const grassGeo = GrassGeometry()

  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(120, 120, 128, 128)
    const pos = geo.attributes.position
    const colors = []

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i) // Plane Y is Z in world

      // Noise function (simulated)
      const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 0.5
                  + (Math.sin(x * 0.3 + y * 0.2)) * 0.2

      const h = noise * 2.5

      pos.setZ(i, h)

      // Vertex Color based on height
      // Low: Darker soil (brown/green)
      // High: Lighter green

      // Base color logic
      // Dark base: 0.05, 0.1, 0.05
      // Height factor adds lighter green/brown

      const r = 0.05 + Math.random() * 0.02 + (h < -1 ? 0.02 : 0)
      const g = 0.12 + (h + 2) * 0.04 + Math.random() * 0.03
      const b = 0.05 + Math.random() * 0.02

      colors.push(r, g, b)
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  // Helper to get height at x, z to place objects on ground
  // Must match the noise function in groundGeo where Plane Y maps to World -Z
  const getHeight = (x, z) => {
      const y = -z
      return (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 0.5 * 2.5
             + (Math.sin(x * 0.3 + y * 0.2)) * 0.2 * 2.5
  }

  return (
    <group>
        <mesh geometry={groundGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial
                vertexColors
                roughness={1.0}
                metalness={0.0}
            />
        </mesh>

        {/* Grass */}
        <Instances range={grassCount} geometry={grassGeo}>
            <meshStandardMaterial color="#4a6f1b" side={THREE.DoubleSide} />
            {Array.from({ length: grassCount }).map((_, i) => {
                const x = (Math.random() - 0.5) * 80
                const z = (Math.random() - 0.5) * 80
                const h = getHeight(x, z)
                return (
                    <Instance
                        key={`grass-${i}`}
                        position={[x, h, z]}
                        rotation={[0, Math.random() * Math.PI, 0]}
                        scale={[1, 0.8 + Math.random() * 1.0, 1]}
                    />
                )
            })}
        </Instances>

        {/* Ferns */}
        <Instances range={fernCount} geometry={fernGeo} castShadow receiveShadow>
             <meshStandardMaterial color="#2d5a27" side={THREE.DoubleSide} />
             {Array.from({ length: fernCount }).map((_, i) => {
                 const x = (Math.random() - 0.5) * 80
                 const z = (Math.random() - 0.5) * 80
                 const h = getHeight(x, z)
                 return (
                     <Instance
                        key={`fern-${i}`}
                        position={[x, h, z]}
                        rotation={[0, Math.random() * Math.PI * 2, 0]}
                        scale={0.5 + Math.random() * 0.5}
                     />
                 )
             })}
        </Instances>
    </group>
  )
}
export default ForestFloor
