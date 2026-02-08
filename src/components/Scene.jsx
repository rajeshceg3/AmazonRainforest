import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import CameraController from './CameraController'
import AudioController from './Audio/AudioController'
import ForestFloor from './environment/ForestFloor'
import Canopy from './environment/Canopy'
import River from './environment/River'
import Understory from './environment/Understory'
import Butterfly from './entities/Butterfly'
import Jaguar from './entities/Jaguar'
import PinkDolphin from './entities/PinkDolphin'
import Sloth from './entities/Sloth'
import Macaw from './entities/Macaw'
import Rain from './environment/Rain'
import Fireflies from './environment/Fireflies'

const Scene = ({ audioStarted }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 10], fov: 45 }}
      style={{ background: '#051605' }} // Deep forest dark green
    >
      {/* Fog for depth and atmosphere - slightly increased range */}
      <fog attach="fog" args={['#051605', 5, 45]} />

      <AudioController started={audioStarted} />

      <ambientLight intensity={0.2} color="#cce0cc" />
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.2}
        color="#fff0dd" // Warm sunlight
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      <CameraController />

      <ForestFloor />
      <River />
      <Understory />
      <Canopy />

      <Rain count={1500} />
      <Fireflies count={100} />

      {/* Fauna */}
      {/* Moved Jaguar slightly closer to camera focus but still grounded */}
      <Jaguar position={[1, 0, -4]} />
      <PinkDolphin position={[0, -2, 0]} />
      <Sloth position={[5, 12, 5]} />
      <Macaw position={[-5, 20, -5]} />

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
