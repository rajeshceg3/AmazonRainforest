import { useState, useEffect } from 'react'

const quotes = [
  "Light filters through 390 billion leaves.",
  "Humidity hangs like breath.",
  "The forest does not perform, it breathes.",
  "Stop moving, and the forest will speak.",
  "Silence is allowed."
]

const Overlay = () => {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const [stillness, setStillness] = useState(0)

  useEffect(() => {
    // Initial delays to let user land in the scene before showing hints
    const initHintTimer = setTimeout(() => {
      if (!hasMoved) setShowHint(true)
    }, 6000)

    return () => clearTimeout(initHintTimer)
  }, [hasMoved])

  // Listen for user movement to hide hints permanently
  useEffect(() => {
    const handleUserMoved = () => {
      setHasMoved(true)
      setShowHint(false)
    }
    window.addEventListener('userMoved', handleUserMoved)
    return () => window.removeEventListener('userMoved', handleUserMoved)
  }, [])

  // Listen for stillness to show quotes
  useEffect(() => {
    const handleStillness = (e) => {
      const currentStillness = e.detail
      setStillness(currentStillness)

      // If fully still, show quote
      if (currentStillness > 0.8 && !visible) {
        setVisible(true)
      }
      // If moving, hide quote and prep next one
      else if (currentStillness < 0.2 && visible) {
        setVisible(false)
        setTimeout(() => {
          setQuoteIndex((prev) => (prev + 1) % quotes.length)
        }, 3000) // Wait for fade out before changing text
      }
    }

    window.addEventListener('stillnessUpdate', handleStillness)
    return () => window.removeEventListener('stillnessUpdate', handleStillness)
  }, [visible])

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-between py-12 z-40">

      {/* Cinematic gradient at the top for hints */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

      {/* Cinematic gradient at the bottom for quotes */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      {/* Elegant Interaction Hint - Moved to Top */}
      <div
        className={`relative flex flex-col items-center gap-4 transition-all duration-[5000ms] ease-[cubic-bezier(0.22,1,0.36,1)] transform ${showHint ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 -translate-y-8 blur-lg'}`}
      >
        <div className="text-[9px] sm:text-[10px] font-sans tracking-[0.4em] text-white/30 uppercase flex items-center gap-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
          <span className="hidden sm:inline">Left Click <span className="text-white/20 px-2">+</span> Drag to Look</span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20" />
          <span className="hidden sm:inline">WASD to Move</span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20" />
          <span className="hidden sm:inline">Shift to Run</span>
          <span className="sm:hidden">Drag to Move & Look</span>
        </div>
        <div className={`h-px bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-[4000ms] ease-out ${showHint ? 'w-48 opacity-100' : 'w-0 opacity-0'}`}></div>
      </div>

      {/* Main Quote - Kept at Bottom but refined */}
      <div className="flex-1 flex items-end justify-center mb-8">
        <div
          className={`relative text-center px-4 transition-all duration-[5000ms] ease-[cubic-bezier(0.22,1,0.36,1)] transform ${visible ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-12 scale-105 blur-xl'}`}
        >
          <div className="font-serif tracking-[0.25em] sm:tracking-[0.3em] text-white/80 uppercase text-xs sm:text-sm md:text-base drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] mix-blend-screen leading-loose">
            {quotes[quoteIndex]}
          </div>

          {/* Subtle line that expands under the quote */}
          <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-[5000ms] ease-out ${visible ? 'w-3/4 opacity-100' : 'w-0 opacity-0'}`} />

          {/* Subtle glow behind the text to mimic atmospheric light */}
          <div className={`absolute inset-0 bg-white/5 blur-2xl transition-opacity duration-[4000ms] rounded-full ${visible ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>

    </div>
  )
}

export default Overlay
