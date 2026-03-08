import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'

const DiscoveryText = ({ text, subtext, show }) => {
  const [rendered, setRendered] = useState(false)

  // Only render when shown initially, but keep rendered for fade-out
  useEffect(() => {
    if (show) setRendered(true)
  }, [show])

  if (!rendered) return null

  return (
    <Html
      center
      pointerEvents="none"
      distanceFactor={10}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none transform ${
        show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {/* Animated Line connecting text to object */}
        <div
          className={`w-[1px] bg-gradient-to-t from-white/10 to-white/60 mb-3 transition-all duration-1000 ease-out origin-bottom delay-300 ${
            show ? 'h-12 scale-y-100' : 'h-0 scale-y-0'
          }`}
        />

        <div className="relative group">
          {/* Main Text */}
          <div
            className={`font-serif tracking-[0.3em] text-white/90 uppercase text-xs sm:text-sm whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-all duration-1000 delay-500 ${
              show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            {text}
          </div>

          {/* Subtle glowing highlight under text */}
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000 delay-700 ${
            show ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`} />
        </div>

        {/* Subtext */}
        {subtext && (
          <div
            className={`font-sans tracking-[0.1em] font-light text-white/50 text-[9px] sm:text-[10px] mt-2 whitespace-nowrap drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] transition-all duration-1000 delay-700 ${
              show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            {subtext}
          </div>
        )}
      </div>
    </Html>
  )
}

export default DiscoveryText
