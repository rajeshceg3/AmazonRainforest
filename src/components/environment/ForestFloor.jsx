import { useMemo, useCallback } from 'react'
import { extend } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import TerrainMaterial from '../shaders/TerrainMaterial'

extend({ TerrainMaterial })

const FernGeometry = () => {
  return useMemo(() => {
    const geometry = new THREE.BufferGeometry()

    const numLeaves = 7
    const vertices = []

    for(let i=0; i<numLeaves; i++) {
        const angle = (i / numLeaves) * Math.PI * 2

        const height = 1.0 + Math.random() * 0.5
        const width = 0.25
        const lean = 0.8

        // Tip position
        const xTip = Math.sin(angle) * lean
        const zTip = Math.cos(angle) * lean
        const yTip = height * 0.7

        // Base L/R
        const xL = Math.sin(angle - 0.2) * width
        const zL = Math.cos(angle - 0.2) * width

        const xR = Math.sin(angle + 0.2) * width
        const zR = Math.cos(angle + 0.2) * width

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
        // Tapered and bent plane for grass blade
        const geometry = new THREE.PlaneGeometry(0.1, 0.8, 2, 4)
        const pos = geometry.attributes.position

        for(let i=0; i<pos.count; i++){
             const y = pos.getY(i) // -0.4 to 0.4 usually
             // Normalize 0 (bottom) to 1 (top)
             // Y is centered, so -0.4 is bottom, 0.4 is top
             const normY = Math.max(0, (y + 0.4) / 0.8)

             // Taper width: 1.0 at bottom, 0.0 at top
             const widthScale = 1.0 - Math.pow(normY, 1.5)
             pos.setX(i, pos.getX(i) * widthScale)

             // Bend Z: 0 at bottom, increases with height
             const bend = normY * normY * 0.3
             pos.setZ(i, pos.getZ(i) + bend)
        }

        geometry.computeVertexNormals()
        geometry.translate(0, 0.4, 0) // Pivot at bottom
        return geometry
    }, [])
}

const ForestFloor = () => {
  const fernCount = 1000
  const grassCount = 10000

  const fernGeo = FernGeometry()
  const grassGeo = GrassGeometry()

  const getHeight = useCallback((x, z) => {
      const y = -z // Map world Z to noise Y
      return (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 0.5 * 2.5
             + (Math.sin(x * 0.3 + y * 0.2)) * 0.2 * 2.5
  }, [])

  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(400, 400, 512, 512)
    const pos = geo.attributes.position
    // Keep noise logic for height, remove vertex colors
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i) // Plane Y is Z in world (rotated later)

      // Apply noise displacement based on X and Y (which maps to world X and -Z)
      // This ensures the ground matches the object placement logic in getHeight
      const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 0.5
                  + (Math.sin(x * 0.3 + y * 0.2)) * 0.2

      const h = noise * 2.5
      pos.setZ(i, h)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  // Precompute instance data with color variation
  const grassData = useMemo(() => {
      const data = []
      const baseColor = new THREE.Color("#4a6f1b")
      for(let i=0; i<grassCount; i++) {
          const x = (Math.random() - 0.5) * 400
          const z = (Math.random() - 0.5) * 400
          const h = getHeight(x, z)

          const color = baseColor.clone()
          // Vary hue slightly and lightness significantly
          color.offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.2)

          data.push({
              position: [x, h, z],
              rotation: [0, Math.random() * Math.PI, 0],
              scale: [1 + Math.random()*0.5, 0.8 + Math.random() * 0.5, 1],
              color: color
          })
      }
      return data
  }, [grassCount, getHeight])

  const fernData = useMemo(() => {
      const data = []
      const baseColor = new THREE.Color("#2d5a27")
      for(let i=0; i<fernCount; i++) {
          const x = (Math.random() - 0.5) * 400
          const z = (Math.random() - 0.5) * 400
          const h = getHeight(x, z)

          const color = baseColor.clone()
          color.offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.15)

          data.push({
              position: [x, h, z],
              rotation: [0, Math.random() * Math.PI * 2, 0],
              scale: [0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5], // uniform scale mostly
              color: color
          })
      }
      return data
  }, [fernCount, getHeight])


  return (
    <group>
        <mesh geometry={groundGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <terrainMaterial uScale={0.1} uColorSoil={new THREE.Color("#2b1d0e")} uColorMoss={new THREE.Color("#1a331a")} />
        </mesh>

        {/* Grass */}
        <Instances range={grassCount} geometry={grassGeo}>
            <meshStandardMaterial color="#ffffff" vertexColors side={THREE.DoubleSide} roughness={0.8} />
            {grassData.map((data, i) => (
                <Instance
                    key={`grass-${i}`}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                    color={data.color}
                />
            ))}
        </Instances>

        {/* Ferns */}
        <Instances range={fernCount} geometry={fernGeo} castShadow receiveShadow>
             <meshStandardMaterial color="#ffffff" vertexColors side={THREE.DoubleSide} roughness={0.8} />
             {fernData.map((data, i) => (
                 <Instance
                    key={`fern-${i}`}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                    color={data.color}
                 />
             ))}
        </Instances>
    </group>
  )
}
export default ForestFloor
