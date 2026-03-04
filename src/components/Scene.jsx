import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Sparkles, Cloud, SpotLight } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import CameraController from './CameraController'
import DynamicDepthOfField from './DynamicDepthOfField'
import AudioController from './Audio/AudioController'
import ForestFloor from './environment/ForestFloor'
import Canopy from './environment/Canopy'
import River from './environment/River'
import Vines from './environment/Vines'
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
import FallingLeaves from './environment/FallingLeaves'
import Mist from './environment/Mist'
import OrganicGuideParticles from './environment/OrganicGuideParticles'
import PoisonDartFrog from './entities/PoisonDartFrog'
import Hummingbird from './entities/Hummingbird'
import StillnessAura from './environment/StillnessAura'

const Scene = ({ audioStarted }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 10], fov: 45 }}
      style={{ background: '#031203' }} // Darker deep forest green
    >
      {/* Safety ambient light to ensure visibility even if Environment fails to load */}
      <ambientLight intensity={0.4} color="#052525" />

      {/* Fog for depth and atmosphere - adjusted for moodier, less washed-out feel */}
      <fog attach="fog" args={['#031818', 8, 140]} />

      <AudioController started={audioStarted} />

      {/* Environment Lighting - Reduced intensity for more dramatic shadows */}
      <Environment preset="forest" background={false} environmentIntensity={0.8} />

      {/* Main Sunlight - Adjusted angle for longer shadows and higher intensity for contrast */}
      <directionalLight
        position={[80, 100, 30]}
        intensity={3.0}
        color="#fff5e6" // Warm sunlight
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-200, 200, 200, -200, 0.1, 500]} />
      </directionalLight>

      {/* Volumetric God Rays - Simulating sun shafts through canopy */}
      <SpotLight
        position={[80, 80, 30]}
        distance={300}
        angle={0.5}
        attenuation={25}
        anglePower={7}
        intensity={2.0}
        color="#fffce6"
        opacity={0.4}
      />

      {/* Blue Fill Light for Contrast/Skylight - Dimmed slightly */}
      <pointLight position={[-50, 20, -50]} intensity={0.6} color="#5a6a7a" distance={300} decay={2} />

      {/* Atmospheric Clouds - Denser for humid feel */}
      <Cloud opacity={0.6} speed={0.15} width={60} depth={5} segments={20} position={[0, 25, -40]} color="#c0d0c0" />
      <Cloud opacity={0.5} speed={0.08} width={80} depth={10} segments={15} position={[40, 30, 20]} color="#c0d0c0" />

      {/* Floating Particles (Pollen/Spores) gently guiding towards river */}
      <OrganicGuideParticles count={4000} />

      {/* Controlled Lightning - Very rare */}
      <Lightning />

      <CameraController />

      <ForestFloor />
      <River />
      <Rocks />
      <WaterLilies />
      <Vines />
      <Canopy />

      <Rain count={4000} />
      <Fireflies count={400} />
      <FallingLeaves count={300} />
      <Mist />

      {/* Hidden Joyful Feature */}
      <StillnessAura />

      {/* Fauna */}
      <PoisonDartFrog count={40} />
      <Hummingbird position={[5, 4, 5]} />
      <Hummingbird position={[-8, 6, 2]} />
      <Hummingbird position={[0, 5, 12]} />

      <Jaguar position={[1, 0, -4]} />
      <PinkDolphin position={[0, -2, 0]} />
      <Sloth position={[5, 12, 5]} />
      <Macaw position={[-5, 20, -5]} />

      <Butterfly position={[-1.5, 2, -4]} />
      <Butterfly position={[2, 3, -6]} />
      <Butterfly position={[0, 3.5, -9]} />

      {/* Soft contact shadows for grounding objects */}
      <ContactShadows
        opacity={0.7}
        scale={60}
        blur={2.0}
        far={2.0}
        resolution={512}
        color="#000000"
      />

      <EffectComposer disableNormalPass>
        <DynamicDepthOfField />
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.8} height={300} intensity={0.9} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>

    </Canvas>
  )
}

export default Scene
