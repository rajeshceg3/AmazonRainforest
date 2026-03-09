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
      className={`transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none transform ${
        show ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-8 scale-105 blur-sm'
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center">

        {/* Subtle reticle dot at the base */}
        <div
          className={`w-1 h-1 rounded-full bg-white/40 mb-1 transition-all duration-[1000ms] ease-out delay-200 ${
            show ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`}
        />

        {/* Animated Line connecting text to object */}
        <div
          className={`w-[1px] bg-gradient-to-t from-white/10 to-white/60 mb-4 transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] origin-bottom delay-400 ${
            show ? 'h-20 scale-y-100' : 'h-0 scale-y-0'
          }`}
        />

        <div className="relative group">
          {/* Main Text */}
          <div
            className={`font-serif tracking-[0.4em] text-white/95 uppercase text-xs sm:text-sm md:text-base whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-700 transform ${
              show ? 'opacity-100 translate-y-0 blur-none tracking-[0.4em]' : 'opacity-0 translate-y-4 blur-sm tracking-[0.1em]'
            }`}
          >
            {text}
          </div>

          {/* Subtle glowing highlight under text */}
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all duration-[1500ms] ease-out delay-1000 ${
            show ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`} />
        </div>

        {/* Subtext */}
        {subtext && (
          <div
            className={`font-sans font-light text-white/50 text-[9px] sm:text-[10px] mt-4 whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-[1200ms] transform ${
              show ? 'opacity-100 translate-y-0 blur-none tracking-[0.2em]' : 'opacity-0 translate-y-4 blur-sm tracking-normal'
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
