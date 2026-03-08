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
    }, 4000)

    const initHintTimer = setTimeout(() => {
      setShowHint(true)
    }, 6000)

    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length)
        setVisible(true)
      }, 3000) // Longer pause between quotes for a calmer pace
    }, 15000) // Keep quotes on screen longer (15s instead of 10s)

    // Hint fade out timer
    const hintOutTimer = setTimeout(() => {
      setShowHint(false)
    }, 14000) // Hide hints after 8 seconds of visibility

    return () => {
      clearInterval(interval)
      clearTimeout(initQuoteTimer)
      clearTimeout(initHintTimer)
      clearTimeout(hintOutTimer)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-end pb-24 z-40">

      {/* Cinematic gradient at the bottom to ensure text readability against bright ground */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Main Quote */}
      <div
        className={`relative text-center px-4 transition-all duration-3000 ease-in-out transform ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      >
        <div className="font-serif tracking-[0.2em] sm:tracking-[0.25em] text-white/70 uppercase text-xs sm:text-sm md:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mix-blend-screen">
          {quotes[quoteIndex]}
        </div>
        {/* Subtle glow behind the text to mimic atmospheric light */}
        <div className={`absolute inset-0 bg-white/5 blur-xl transition-opacity duration-3000 rounded-full ${visible ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Elegant Interaction Hint */}
      <div
        className={`absolute bottom-8 flex flex-col items-center gap-1 transition-all duration-3000 ease-in-out transform ${showHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        <div className="h-px w-12 bg-white/20 mb-2"></div>
        <div className="text-[9px] sm:text-[10px] font-sans tracking-[0.3em] text-white/40 uppercase">
          <span className="hidden sm:inline">Click to Look <span className="mx-2 opacity-50">•</span> WASD to Move <span className="mx-2 opacity-50">•</span> Shift to Run</span>
          <span className="sm:hidden">Left Drag to Move <span className="mx-2 opacity-50">•</span> Right Drag to Look</span>
        </div>
      </div>

    </div>
  )
}

export default Overlay
