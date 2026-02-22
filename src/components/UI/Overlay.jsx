import { useState, useEffect } from 'react'

const quotes = [
  "Light filters through 390 billion leaves.",
  "Humidity hangs like breath.",
  "The forest does not perform, it breathes.",
  "Silence is allowed."
]

const Overlay = () => {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length)
        setVisible(true)
      }, 2000)
    }, 10000)

    // Hint fade out timer
    const hintTimer = setTimeout(() => {
      setShowHint(false)
    }, 8000)

    return () => {
      clearInterval(interval)
      clearTimeout(hintTimer)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-end pb-20 text-white/40 font-serif tracking-widest uppercase text-xs sm:text-sm">
      <div className={`transition-opacity duration-2000 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {quotes[quoteIndex]}
      </div>

      {/* Interaction Hint */}
      <div className={`absolute bottom-8 text-[10px] text-center transition-opacity duration-2000 ease-in-out ${showHint ? 'opacity-30' : 'opacity-0'}`}>
        <span className="hidden sm:inline">Click to Look • WASD to Move • Shift to Run</span>
        <span className="sm:hidden">Left Drag to Move • Right Drag to Look</span>
      </div>
    </div>
  )
}

export default Overlay
