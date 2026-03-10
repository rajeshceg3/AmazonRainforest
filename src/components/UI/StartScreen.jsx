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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#020a02] text-white/80 transition-all duration-[5000ms] ease-in-out ${
        isTransitioning ? 'opacity-0 backdrop-blur-none pointer-events-none' : 'opacity-100 backdrop-blur-xl'
      }`}
    >
      {/* Dynamic Background Gradient reacting to mouse - Deep Emerald to Black */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(4,40,20,0.15)_0%,rgba(0,0,0,0.8)_80%)] transition-all duration-[4000ms] ease-out ${
          isMounted && !isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px) scale(1.1)`
        }}
      />

      {/* Organic shifting noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
          animation: 'drift 60s linear infinite'
        }}
      />

      <style>{`
        @keyframes drift {
          0% { background-position: 0 0; }
          100% { background-position: 200px 200px; }
        }
      `}</style>

      <div className="relative text-center flex flex-col items-center max-w-4xl px-8">
        {/* Subtle top eyebrow text - Increased delay and tracking */}
        <div
          className={`mb-6 text-[10px] sm:text-xs font-sans tracking-[0.5em] text-white/30 uppercase transition-all duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-500 transform ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-6 blur-md'
          }`}
          style={{ transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -8}px)` }}
        >
          A Generative Sanctuary
        </div>

        {/* Main Title - Refined typography and staggered reveal */}
        <h1
          className={`mb-10 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif uppercase drop-shadow-[0_12px_32px_rgba(0,0,0,0.8)]`}
          style={{ transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }}
        >
          <span
            className={`inline-block tracking-[0.2em] sm:tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/40 transition-all duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-700 transform ${
              isMounted && !isTransitioning ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-8 scale-105 blur-lg'
            }`}
          >
            Amazon
          </span>
          <br />
          <span
            className={`inline-block mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[0.4em] font-light text-white/60 transition-all duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-1000 transform ${
              isMounted && !isTransitioning ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-8 scale-105 blur-lg'
            }`}
          >
            Rainforest
          </span>
        </h1>

        {/* Elegant structural line */}
        <div
          className={`w-[1px] h-20 bg-gradient-to-b from-white/40 via-white/10 to-transparent mb-12 transition-all duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-[1400ms] origin-top ${
            isMounted && !isTransitioning ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
          }`}
        />

        {/* Poetic instructional text */}
        <p
          className={`max-w-md mb-16 text-sm sm:text-base font-sans leading-loose tracking-[0.1em] text-white/40 font-light transition-all duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-[1800ms] transform ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-6 blur-md'
          }`}
        >
          An immersive experience designed for presence, not performance.<br/>Move slowly.
        </p>

        {/* The Portal Button - Magnetic and Glowing */}
        <div
          className={`transition-all duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-[2200ms] transform ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-8 blur-md'
          }`}
        >
          <button
            onClick={handleStart}
            className="group relative overflow-hidden px-14 py-6 bg-transparent text-xs sm:text-sm tracking-[0.5em] uppercase cursor-pointer"
          >
            {/* Animated border drawing lines - slower, more deliberate */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]" />
            <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-white/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)]" />

            {/* Ambient inner glow that breathes on hover */}
            <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-[2000ms] ease-in-out" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-[2000ms] ease-in-out scale-50 group-hover:scale-150 transform origin-center" />

            {/* Sweeping light effect on hover */}
            <div className="absolute -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[sweep_3s_ease-in-out_infinite]" />
            <style>{`
              @keyframes sweep {
                0% { transform: translateX(-200%) skewX(-15deg); }
                100% { transform: translateX(400%) skewX(-15deg); }
              }
            `}</style>

            <span className="relative z-10 text-white/50 group-hover:text-white transition-colors duration-[1500ms] drop-shadow-[0_0_8px_rgba(255,255,255,0)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              Enter Experience
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StartScreen
