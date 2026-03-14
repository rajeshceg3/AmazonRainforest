import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'

const StartScreen = ({ onStart }) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Hold-to-enter states
  const [isHolding, setIsHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdFrameRef = useRef()

  useEffect(() => {
    // Trigger initial fade in slightly after mount for a deliberate, slow entrance
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = async () => {
    if (isTransitioning) return
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

  // Handle Hold Interaction
  const startHold = () => {
    setIsHolding(true)
  }

  const endHold = () => {
    setIsHolding(false)
  }

  useEffect(() => {
    if (isHolding) {
      const updateProgress = () => {
        setHoldProgress(prev => {
          const next = prev + 1.5 // Speed of holding
          if (next >= 100) {
            handleStart()
            return 100
          }
          return next
        })
        holdFrameRef.current = requestAnimationFrame(updateProgress)
      }
      holdFrameRef.current = requestAnimationFrame(updateProgress)
    } else {
      // Smooth decay when released
      const decayProgress = () => {
        setHoldProgress(prev => {
          if (prev <= 0) return 0
          const next = prev - 3 // decay speed
          holdFrameRef.current = requestAnimationFrame(decayProgress)
          return next
        })
      }
      holdFrameRef.current = requestAnimationFrame(decayProgress)
    }

    return () => cancelAnimationFrame(holdFrameRef.current)
  }, [isHolding])

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

        <div className="max-w-md mb-16 relative h-20 flex justify-center items-center">
          <p
            className={`absolute text-sm sm:text-base font-sans leading-relaxed tracking-[0.05em] text-white/40 font-light transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
              isMounted && !isTransitioning && holdProgress < 30 ? 'opacity-100 translate-y-0 blur-none delay-[1200ms]' : 'opacity-0 -translate-y-4 blur-sm'
            }`}
          >
            You are entering a sanctuary.
          </p>
          <p
            className={`absolute text-sm sm:text-base font-sans leading-relaxed tracking-[0.05em] text-white/40 font-light transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
              isMounted && !isTransitioning && holdProgress >= 30 && holdProgress < 70 ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-4 blur-sm'
            }`}
          >
            Move slowly.
          </p>
          <p
            className={`absolute text-sm sm:text-base font-sans leading-relaxed tracking-[0.05em] text-white/50 font-light transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
              isMounted && !isTransitioning && holdProgress >= 70 ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-4 blur-sm'
            }`}
          >
            Hold to breathe.
          </p>
        </div>

        <div
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          className={`group relative flex items-center justify-center w-48 h-48 transition-all duration-[3000ms] ease-out delay-[1500ms] transform cursor-pointer ${
            isMounted && !isTransitioning ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'
          }`}
          style={{ transform: isHolding ? 'scale(0.95)' : 'scale(1)' }}
        >
          {/* Breathing Aura Rings */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Inner Ring */}
            <div
              className={`absolute w-full h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] backdrop-blur-sm ${isHolding ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              style={{
                transform: `scale(${1 + holdProgress / 40})`,
                opacity: 1 - (holdProgress / 100),
                boxShadow: isHolding ? `0 0 ${20 + holdProgress}px rgba(255,255,255,0.4), inset 0 0 ${10 + holdProgress / 2}px rgba(255,255,255,0.2)` : '0 0 15px rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.02)'
              }}
            />
            {/* Outer Ring */}
            <div
              className={`absolute w-full h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isHolding ? 'opacity-100' : 'opacity-0'}`}
              style={{
                transform: `scale(${1 + Math.pow(holdProgress / 100, 2) * 2.5})`,
                opacity: 1 - (holdProgress / 100),
                boxShadow: isHolding ? `0 0 ${40 + holdProgress * 2}px rgba(255,255,255,0.3)` : 'none'
              }}
            />
          </div>

          {/* Hover background pulse */}
          <div
            className={`absolute inset-0 bg-white/5 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${isHolding ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            style={{
              transform: `scale(${isHolding ? 0.9 : 1})`,
              boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
            }}
          />

          <span className={`relative z-10 text-xs sm:text-sm uppercase transition-all duration-700 drop-shadow-md ${isHolding ? 'text-white tracking-[0.6em]' : 'text-white/40 tracking-[0.3em] group-hover:tracking-[0.5em] group-hover:text-white/80'}`}>
            Hold
          </span>
        </div>
      </div>
    </div>
  )
}

export default StartScreen
