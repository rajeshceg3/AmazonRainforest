import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'

const DiscoveryText = ({ text, subtext, show }) => {
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (show) setRendered(true)
  }, [show])

  if (!rendered) return null

  return (
    <Html center pointerEvents="none" distanceFactor={10} style={{ transition: 'opacity 1s ease-in-out', opacity: show ? 1 : 0 }}>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-px h-8 bg-white/40 mb-2"></div>
        <div className="font-serif tracking-[0.2em] text-white/90 uppercase text-xs sm:text-sm whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {text}
        </div>
        {subtext && (
          <div className="font-sans italic text-white/60 text-[10px] mt-1 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {subtext}
          </div>
        )}
      </div>
    </Html>
  )
}

export default DiscoveryText
