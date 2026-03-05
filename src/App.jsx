import { useState } from 'react'
import Scene from './components/Scene'
import Overlay from './components/UI/Overlay'
import StartScreen from './components/UI/StartScreen'

function App() {
  const [audioStarted, setAudioStarted] = useState(false)

  return (
    <div className="w-full h-screen bg-[#051605]">
      <Scene audioStarted={audioStarted} />
      {audioStarted && <Overlay />}
      <StartScreen onStart={() => setAudioStarted(true)} />
    </div>
  )
}

export default App
