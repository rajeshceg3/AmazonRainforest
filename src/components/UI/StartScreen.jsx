import * as Tone from 'tone'

const StartScreen = ({ onStart }) => {
  const handleStart = async () => {
    await Tone.start()
    onStart()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#051605] text-white/80 transition-opacity duration-1000">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-serif tracking-widest uppercase">Amazon Rainforest</h1>
        <p className="mb-8 text-sm opacity-60 font-light">An immersive audio-visual experience</p>
        <button
          onClick={handleStart}
          className="px-8 py-3 border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300 rounded-sm text-xs tracking-[0.2em] uppercase cursor-pointer"
        >
          Enter Experience
        </button>
      </div>
    </div>
  )
}

export default StartScreen
