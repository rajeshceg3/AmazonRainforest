import { useState, useEffect } from 'react'
import * as Tone from 'tone'

const StartScreen = ({ onStart }) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Trigger initial fade in slightly after mount for a deliberate, slow entrance
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

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
      {/* Background radial gradient to subtly spotlight the center */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] transition-opacity duration-3000 ease-out ${isMounted && !isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

      <div className="relative text-center flex flex-col items-center">
        <h1
          className={`mb-6 text-4xl sm:text-5xl md:text-6xl font-serif tracking-[0.25em] uppercase text-white/90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all duration-3000 ease-out transform ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          Amazon Rainforest
        </h1>

        <p
          className={`mb-12 text-sm sm:text-base font-sans tracking-[0.1em] text-white/50 font-light transition-all duration-3000 ease-out delay-700 transform ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          An immersive audio-visual experience
        </p>

        <button
          onClick={handleStart}
          className={`group relative overflow-hidden px-10 py-4 border border-white/10 bg-transparent transition-all duration-3000 ease-out delay-1000 transform rounded-sm text-xs sm:text-sm tracking-[0.3em] uppercase cursor-pointer ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Subtle hover gradient background */}
          <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

          <span className="relative z-10 text-white/70 group-hover:text-white transition-colors duration-500">
            Enter Experience
          </span>

          {/* Subtle glowing border effect on hover */}
          <div className="absolute inset-0 border border-white/0 group-hover:border-white/30 transition-colors duration-700 rounded-sm shadow-[0_0_15px_rgba(255,255,255,0)] group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
        </button>
      </div>
    </div>
  )
}

export default StartScreen
