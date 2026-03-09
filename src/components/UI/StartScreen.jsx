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

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Calculate normalized mouse position from center (-1 to 1)
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePos({ x, y })
    }

    if (isMounted && !isTransitioning) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMounted, isTransitioning])

  if (isHidden) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#031203] text-white/80 transition-all duration-[4000ms] ease-in-out ${
        isTransitioning ? 'opacity-0 backdrop-blur-none pointer-events-none' : 'opacity-100 backdrop-blur-xl'
      }`}
    >
      {/* Dynamic Background Gradient reacting to mouse */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_60%)] transition-all duration-3000 ease-out ${
          isMounted && !isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`
        }}
      />

      {/* Noise overlay for texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div className="relative text-center flex flex-col items-center max-w-4xl px-8">
        {/* Subtle top eyebrow text */}
        <div
          className={`mb-6 text-[10px] sm:text-xs font-sans tracking-[0.4em] text-white/40 uppercase transition-all duration-[3000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-300 transform ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-4 blur-sm'
          }`}
          style={{ transform: `translate(${mousePos.x * -5}px, ${mousePos.y * -5}px)` }}
        >
          A Generative Sanctuary
        </div>

        <h1
          className={`mb-8 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif tracking-[0.15em] sm:tracking-[0.2em] uppercase text-white/95 drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-12 scale-105 blur-md'
          }`}
          style={{ transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)` }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/60">
            Amazon
          </span>
          <br />
          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[0.3em] font-light text-white/70">
            Rainforest
          </span>
        </h1>

        <div
          className={`w-px h-16 bg-gradient-to-b from-white/30 to-transparent mb-12 transition-all duration-[3000ms] ease-in-out delay-1000 origin-top ${
            isMounted && !isTransitioning ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
          }`}
        />

        <p
          className={`max-w-md mb-16 text-sm sm:text-base font-sans leading-relaxed tracking-[0.05em] text-white/40 font-light transition-all duration-[3000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-[1200ms] transform ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-8 blur-sm'
          }`}
        >
          An immersive experience designed for presence, not performance. Move slowly.
        </p>

        <button
          onClick={handleStart}
          className={`group relative overflow-hidden px-12 py-5 bg-transparent transition-all duration-[3000ms] ease-out delay-[1500ms] transform text-xs sm:text-sm tracking-[0.4em] uppercase cursor-pointer ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Animated border drawing lines */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
          <div className="absolute bottom-0 right-0 w-full h-[1px] bg-white/20 scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
          <div className="absolute top-0 right-0 w-[1px] h-full bg-white/20 scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] delay-100" />
          <div className="absolute bottom-0 left-0 w-[1px] h-full bg-white/20 scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] delay-100" />

          {/* Static subtle border */}
          <div className="absolute inset-0 border border-white/5" />

          {/* Hover background pulse */}
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-in-out" />

          <span className="relative z-10 text-white/60 group-hover:text-white transition-colors duration-700 drop-shadow-md">
            Enter Experience
          </span>
        </button>
      </div>
    </div>
  )
}

export default StartScreen
