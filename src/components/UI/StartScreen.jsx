import { useState } from 'react'
import * as Tone from 'tone'

const StartScreen = ({ onStart }) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  const handleStart = async () => {
    setIsTransitioning(true)

    try {
      // Attempt to start audio, but don't block indefinitely
      await Promise.race([
        Tone.start(),
        new Promise(resolve => setTimeout(resolve, 500))
      ])
    } catch (e) {
      console.warn('Audio failed to start, proceeding anyway:', e)
    }

    // Start the audio immediately for the drone effect
    onStart()

    // Slowly fade the UI text and background over a few seconds
    setTimeout(() => {
      setIsHidden(true)
    }, 4000)
  }

  if (isHidden) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#051605] text-white/80 transition-opacity duration-[4000ms] ease-in-out ${isTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className={`text-center transition-opacity duration-1000 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="mb-4 text-3xl font-serif tracking-widest uppercase">Amazon Rainforest</h1>
        <p className="mb-8 text-sm opacity-60 font-light">An immersive audio-visual experience</p>
        <button
          onClick={handleStart}
          className="px-8 py-3 border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300 rounded-sm text-xs tracking-[0.2em] uppercase cursor-pointer"
        >
          Enter Experience
        </button>
      </div>
    </div>
  )
}

export default StartScreen
