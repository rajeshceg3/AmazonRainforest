import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Sparkles, Cloud } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Vignette, Noise } from '@react-three/postprocessing'
import CameraController from './CameraController'
import AudioController from './Audio/AudioController'
import ForestFloor from './environment/ForestFloor'
import Canopy from './environment/Canopy'
import River from './environment/River'
import Understory from './environment/Understory'
import Rocks from './environment/Rocks'
import WaterLilies from './environment/WaterLilies'
import Butterfly from './entities/Butterfly'
import Jaguar from './entities/Jaguar'
import PinkDolphin from './entities/PinkDolphin'
import Sloth from './entities/Sloth'
import Macaw from './entities/Macaw'
import Rain from './environment/Rain'
import Fireflies from './environment/Fireflies'
import Lightning from './environment/Lightning'

const Scene = ({ audioStarted }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 10], fov: 45 }}
      style={{ background: '#051605' }} // Deep forest dark green
    >
      {/* Fog for depth and atmosphere - adjusted for denser, moodier feel */}
      <fog attach="fog" args={['#051510', 20, 180]} />

      <AudioController started={audioStarted} />

      {/* Environment Lighting replaces generic HemisphereLight for more realism */}
      <Environment preset="forest" background={false} environmentIntensity={0.9} />

      {/* Main Sunlight - High intensity, warm, wide shadow coverage */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={2.5}
        color="#fff5e6" // Warm sunlight
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-200, 200, 200, -200, 0.1, 500]} />
      </directionalLight>

      {/* Blue Fill Light for Contrast/Skylight */}
      <pointLight position={[-50, 20, -50]} intensity={1.0} color="#6a7a8a" distance={300} decay={2} />

      {/* Atmospheric Clouds */}
      <Cloud opacity={0.4} speed={0.1} width={60} depth={5} segments={20} position={[0, 25, -40]} color="#d0e0d0" />
      <Cloud opacity={0.3} speed={0.05} width={80} depth={10} segments={15} position={[40, 30, 20]} color="#d0e0d0" />

      {/* Floating Particles (Pollen/Spores) - Reduced visual noise */}
      <Sparkles count={3000} scale={[400, 50, 400]} size={2} speed={0.4} opacity={0.3} color="#ccffcc" />

      {/* Controlled Lightning - Very rare */}
      <Lightning />

      <CameraController />

      <ForestFloor />
      <River />
      <Rocks />
      <WaterLilies />
      <Understory />
      <Canopy />

      <Rain count={4000} />
      <Fireflies count={400} />

      {/* Fauna */}
      {/* Moved Jaguar closer and grounded */}
      <Jaguar position={[1, 0, -4]} />
      <PinkDolphin position={[0, -2, 0]} />
      <Sloth position={[5, 12, 5]} />
      <Macaw position={[-5, 20, -5]} />

      <Butterfly position={[-1.5, 2, -4]} />
      <Butterfly position={[2, 3, -6]} />
      <Butterfly position={[0, 3.5, -9]} />

      {/* Soft contact shadows for grounding objects */}
      <ContactShadows
        opacity={0.6}
        scale={60}
        blur={2.5}
        far={2.0}
        resolution={512}
        color="#000000"
      />

      <EffectComposer disableNormalPass>
        {/* Depth of Field for cinematic look - Focuses around 15-20 units away */}
        <DepthOfField focusDistance={0.015} focalLength={0.02} bokehScale={2} height={480} />

        {/* Bloom for fireflies and sun glints */}
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={0.5} />

        {/* Subtle Noise for organic film grain texture */}
        <Noise opacity={0.02} />

        {/* Vignette to focus attention */}
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>

    </Canvas>
  )
}

export default Scene
