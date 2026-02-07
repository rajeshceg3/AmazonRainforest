import { Canvas } from '@react-three/fiber'
import { Sky, ContactShadows, Environment } from '@react-three/drei'
import CameraController from './CameraController'
import ForestFloor from './environment/ForestFloor'
import Canopy from './environment/Canopy'
import Butterfly from './entities/Butterfly'
import Jaguar from './entities/Jaguar'
import Rain from './environment/Rain'

const Scene = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 10], fov: 45 }}
      style={{ background: '#051605' }} // Deep forest dark green
    >
      <fog attach="fog" args={['#051605', 5, 35]} />

      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <CameraController />

      <ForestFloor />
      <Canopy />
      <Rain />

      <Jaguar position={[2, 0, -5]} />

      <Butterfly position={[-2, 2, -5]} />
      <Butterfly position={[3, 3, -8]} />
      <Butterfly position={[0, 4, -12]} />

      <Environment preset="forest" />
      <ContactShadows opacity={0.4} scale={20} blur={2.4} far={4.5} />
    </Canvas>
  )
}

export default Scene
