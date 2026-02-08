import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Sparkles } from '@react-three/drei'
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
      {/* Fog for depth and atmosphere - slightly increased range and lighter green for mist */}
      <fog attach="fog" args={['#081808', 8, 60]} />

      <AudioController started={audioStarted} />

      {/* Natural Ambient Light (Sky + Ground bounce) */}
      <hemisphereLight intensity={0.4} groundColor="#2e1e0f" color="#dceef2" />

      {/* Main Sunlight - High intensity, warm, wide shadow coverage */}
      <directionalLight
        position={[20, 50, 15]}
        intensity={2.0}
        color="#fff5e6" // Warm sunlight
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-50, 50, 50, -50, 0.1, 200]} />
      </directionalLight>

      {/* Floating Particles (Pollen/Spores) */}
      <Sparkles count={800} scale={[50, 50, 50]} size={3} speed={0.3} opacity={0.4} color="#ccffcc" />

      <CameraController />

      <ForestFloor />
      <River />
      <Understory />
      <Canopy />

      <Rain count={1500} />
      <Fireflies count={100} />

      {/* Fauna */}
      {/* Moved Jaguar closer and grounded */}
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
        scale={60}
        blur={2}
        far={2.0}
        resolution={512}
        color="#000000"
      />
    </Canvas>
  )
}

export default Scene
