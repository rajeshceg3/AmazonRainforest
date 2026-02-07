import { Canvas } from '@react-three/fiber'
import { Sky, ContactShadows, Environment } from '@react-three/drei'
import CameraController from './CameraController'
import ForestFloor from './environment/ForestFloor'
import Canopy from './environment/Canopy'
import Butterfly from './entities/Butterfly'
import Jaguar from './entities/Jaguar'
import Rain from './environment/Rain'
import Fireflies from './environment/Fireflies'

const Scene = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 10], fov: 45 }}
      style={{ background: '#051605' }} // Deep forest dark green
    >
      {/* Fog for depth and atmosphere */}
      <fog attach="fog" args={['#051605', 8, 35]} />

      <ambientLight intensity={0.25} />
      <directionalLight
        position={[5, 20, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]} // Higher res shadows
        shadow-bias={-0.0001}
      />

      <CameraController />

      <ForestFloor />
      <Canopy />
      <Rain count={1500} />
      <Fireflies count={100} />

      {/* Moved Jaguar slightly closer to camera focus but still grounded */}
      <Jaguar position={[1, 0, -4]} />

      <Butterfly position={[-1.5, 2, -4]} />
      <Butterfly position={[2, 3, -6]} />
      <Butterfly position={[0, 3.5, -9]} />

      <Environment preset="forest" background={false} />

      {/* Soft contact shadows for grounding objects */}
      <ContactShadows
        opacity={0.6}
        scale={40}
        blur={2}
        far={2.0}
        resolution={512}
        color="#000000"
      />
    </Canvas>
  )
}

export default Scene
