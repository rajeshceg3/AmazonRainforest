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
      distanceFactor={12} // Slightly larger interaction distance perception
      className={`transition-all duration-[2500ms] ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none transform ${
        show ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-12 scale-110 blur-md'
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center">

        {/* Subtle reticle dot at the base - now breathes when visible */}
        <div className="relative flex items-center justify-center">
            <div
            className={`w-[2px] h-[2px] rounded-full bg-white/80 mb-1 transition-all duration-[1000ms] ease-out delay-200 ${
                show ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
            />
            {/* Outer ring for the reticle */}
            <div
            className={`absolute w-3 h-3 rounded-full border border-white/20 mb-1 transition-all duration-[2000ms] ease-out delay-300 ${
                show ? 'opacity-100 scale-100 animate-[pulse_3s_ease-in-out_infinite]' : 'opacity-0 scale-50'
            }`}
            />
        </div>

        {/* Animated Line connecting text to object - thinner, longer, softer gradient */}
        <div
          className={`w-[1px] bg-gradient-to-t from-white/20 via-white/5 to-transparent mb-6 transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] origin-bottom delay-500 ${
            show ? 'h-24 scale-y-100' : 'h-0 scale-y-0'
          }`}
        />

        <div className="relative group">
          {/* Main Text - more elegant tracking and typography */}
          <div
            className={`font-serif tracking-[0.5em] text-white/95 uppercase text-xs sm:text-sm md:text-base whitespace-nowrap drop-shadow-[0_4px_16px_rgba(0,0,0,1)] mix-blend-screen transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-[800ms] transform ${
              show ? 'opacity-100 translate-y-0 blur-none tracking-[0.5em]' : 'opacity-0 translate-y-6 blur-md tracking-[0.1em]'
            }`}
          >
            {text}
          </div>

          {/* Subtle glowing highlight under text - expands wider */}
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent shadow-[0_0_16px_rgba(255,255,255,0.8)] transition-all duration-[2000ms] ease-out delay-[1200ms] ${
            show ? 'w-24 opacity-100 scale-x-100' : 'w-0 opacity-0 scale-x-0'
          }`} />
        </div>

        {/* Subtext - More delicate */}
        {subtext && (
          <div
            className={`font-sans font-light text-white/40 text-[9px] sm:text-[10px] mt-5 whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-[1500ms] transform ${
              show ? 'opacity-100 translate-y-0 blur-none tracking-[0.3em]' : 'opacity-0 translate-y-4 blur-sm tracking-normal'
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
