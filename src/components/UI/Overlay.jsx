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

  useEffect(() => {
    // Initial delays to let user land in the scene before showing text
    const initQuoteTimer = setTimeout(() => {
      setVisible(true)
    }, 8000)

    const initHintTimer = setTimeout(() => {
      setShowHint(true)
    }, 6000)

    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length)
        setVisible(true)
      }, 5000) // Much longer 5s pause between quotes
    }, 20000) // Keep quotes on screen very long (20s)

    // Hint fade out timer
    const hintOutTimer = setTimeout(() => {
      setShowHint(false)
    }, 18000) // Hide hints after 12 seconds of visibility

    return () => {
      clearInterval(interval)
      clearTimeout(initQuoteTimer)
      clearTimeout(initHintTimer)
      clearTimeout(hintOutTimer)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-between py-12 z-40">

      {/* Cinematic gradient at the top for hints */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

      {/* Cinematic gradient at the bottom for quotes */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Elegant Interaction Hint - Moved to Top */}
      <div
        className={`relative flex flex-col items-center gap-4 transition-all duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${showHint ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 -translate-y-4 blur-sm'}`}
      >
        <div className="text-[9px] sm:text-[10px] font-sans tracking-[0.5em] text-white/30 uppercase flex items-center gap-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <span className="hidden sm:inline">Left Click <span className="text-white/20 px-2">+</span> Drag</span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20" />
          <span className="hidden sm:inline">WASD</span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20" />
          <span className="hidden sm:inline">Shift</span>
          <span className="sm:hidden">Drag to Move & Look</span>
        </div>
        <div className={`h-px bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-[4000ms] ease-out ${showHint ? 'w-48 opacity-100' : 'w-0 opacity-0'}`}></div>
      </div>

      {/* Main Quote - Kept at Bottom but refined */}
      <div className="flex-1 flex items-end justify-center mb-8">
        <div
          className={`relative text-center px-4 transition-all duration-[5000ms] ease-[cubic-bezier(0.25,1,0.5,1)] transform ${visible ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-8 scale-105 blur-md'}`}
        >
          {/* Subtle breathing animation applied to the text container */}
          <div className={`${visible ? 'animate-[breath_15s_ease-in-out_infinite]' : ''}`}>
             <style>{`
                @keyframes breath {
                  0%, 100% { opacity: 0.8; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.02); }
                }
             `}</style>

            <div className="font-serif tracking-[0.3em] sm:tracking-[0.4em] text-white/80 uppercase text-xs sm:text-sm md:text-base drop-shadow-[0_4px_16px_rgba(0,0,0,1)] mix-blend-screen leading-loose">
              {quotes[quoteIndex]}
            </div>
          </div>

          {/* Subtle line that expands under the quote */}
          <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-[6000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${visible ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />

          {/* Subtle glow behind the text to mimic atmospheric light */}
          <div className={`absolute inset-0 bg-white/5 blur-3xl transition-opacity duration-[5000ms] rounded-full ${visible ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>

    </div>
  )
}

export default Overlay
