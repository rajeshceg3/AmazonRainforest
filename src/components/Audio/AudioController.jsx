import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as Tone from 'tone'
import * as THREE from 'three'

const AudioController = ({ started }) => {
  const { camera } = useThree()

  // References to keep track of Tone.js objects
  const audioContextRef = useRef(false)

  // Layers
  const riverRef = useRef(null)
  const canopyRef = useRef(null)
  const floorRef = useRef(null)

  // Wildlife
  const insectRef = useRef(null)
  const birdRef = useRef(null)
  const rainRef = useRef(null)

  // Mixing
  const masterGain = useRef(null)

  useEffect(() => {
    if (!started) return

    const initAudio = async () => {
      if (audioContextRef.current) return

      // Tone.start() is handled in StartScreen on user interaction
      console.log('Audio Context Initializing')

      // Master Gain/Limiter
      masterGain.current = new Tone.Limiter(-1).toDestination()

      // --- 1. River Layer (Low Rumble / Brown Noise) ---
      // Positioned low in the mix, dominant at Y=0
      const riverFilter = new Tone.Filter(400, "lowpass").connect(masterGain.current)
      const riverNoise = new Tone.Noise("brown").connect(riverFilter)
      riverNoise.volume.value = -60 // Start silent
      riverNoise.start()
      riverRef.current = { noise: riverNoise, filter: riverFilter }

      // --- 2. Canopy Layer (Wind / Pink Noise) ---
      // Positioned high, dominant at Y=25
      const canopyFilter = new Tone.AutoFilter({
        frequency: "0.1",
        baseFrequency: 300,
        octaves: 2,
        type: "sine"
      }).connect(masterGain.current).start()
      const canopyNoise = new Tone.Noise("pink").connect(canopyFilter)
      canopyNoise.volume.value = -60
      canopyNoise.start()
      canopyRef.current = { noise: canopyNoise, filter: canopyFilter }

      // --- 3. Forest Floor Drone (Mid) ---
      // Constant low drone for grounding
      const floorOsc = new Tone.Oscillator(55, "sine").connect(masterGain.current)
      const floorLFO = new Tone.LFO(0.05, 50, 60).connect(floorOsc.frequency).start()
      floorOsc.volume.value = -25
      floorOsc.start()
      floorRef.current = { osc: floorOsc }

      // --- 4. Insects (High Frequency Panning) ---
      const insectPanner = new Tone.Panner3D(0, 0, 0).connect(masterGain.current)
      const insectFilter = new Tone.Filter(8000, "highpass").connect(insectPanner)
      const insectOsc = new Tone.Oscillator(12000, "sawtooth").connect(insectFilter)
      // Use Tremolo to modulate amplitude (buzzing effect)
      const insectAmp = new Tone.Tremolo(15, 0.5).connect(insectFilter).start()
      insectOsc.volume.value = -30
      insectOsc.start()

      // Randomly move insects
      const insectLoop = new Tone.Loop(time => {
         insectPanner.positionX.rampTo((Math.random() - 0.5) * 20, 2)
         insectPanner.positionZ.rampTo((Math.random() - 0.5) * 20, 2)
      }, "4n").start(0)
      insectRef.current = { osc: insectOsc, panner: insectPanner, loop: insectLoop }


      // --- 5. Birds (Random FM Chirps) ---
      // FM Synth for birds
      // Create a single Panner node to reuse
      const birdPanner = new Tone.Panner(0).connect(masterGain.current)

      const birdSynth = new Tone.FMSynth({
        harmonicity: 3.5,
        modulationIndex: 10,
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
        modulation: { type: "square" },
        modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
      }).connect(birdPanner)
      birdSynth.volume.value = -12

      const birdLoop = new Tone.Loop(time => {
        if (Math.random() > 0.7) {
            const freq = 800 + Math.random() * 1000

            // Random pan for this chirp
            const pan = (Math.random() * 2) - 1
            // Use existing panner
            birdPanner.pan.rampTo(pan, 0.1)

            birdSynth.triggerAttackRelease(freq, "16n", time)
        }
      }, "1n").start(0) // Every measure

      Tone.Transport.start()
      birdRef.current = { synth: birdSynth, loop: birdLoop, panner: birdPanner }


      // --- 6. Rain (Subtle) ---
      const rainFilter = new Tone.Filter(800, "lowpass").connect(masterGain.current)
      const rainNoise = new Tone.Noise("pink").connect(rainFilter)
      rainNoise.volume.value = -40 // Always subtle
      rainNoise.start()
      rainRef.current = { noise: rainNoise }

      audioContextRef.current = true
    }

    initAudio()

    return () => {
      // Cleanup
      if (riverRef.current) {
          riverRef.current.noise.dispose()
          riverRef.current.filter.dispose()
      }
      if (canopyRef.current) {
          canopyRef.current.noise.dispose()
          canopyRef.current.filter.dispose()
      }
      if (floorRef.current) floorRef.current.osc.dispose()
      if (insectRef.current) {
          insectRef.current.osc.dispose()
          insectRef.current.loop.dispose()
          insectRef.current.panner.dispose()
      }
      if (birdRef.current) {
          birdRef.current.synth.dispose()
          birdRef.current.loop.dispose()
          birdRef.current.panner.dispose()
      }
      if (rainRef.current) {
          rainRef.current.noise.dispose()
          rainRef.current.filter.dispose()
      }
      Tone.Transport.stop()
      audioContextRef.current = false
    }
  }, [started])

  useFrame(() => {
    if (!audioContextRef.current) return

    const y = camera.position.y

    // Mixing Logic
    // River: Loudest at 0, silent at 10
    // Canopy: Loudest at 25, silent at 5

    // Smooth interpolation for volume
    const riverVol = THREE.MathUtils.mapLinear(y, 0, 10, -15, -60) // -15db max
    const canopyVol = THREE.MathUtils.mapLinear(y, 5, 25, -60, -20) // -20db max

    if (riverRef.current) {
        riverRef.current.noise.volume.rampTo(Math.max(-60, Math.min(-15, riverVol)), 0.1)
    }

    if (canopyRef.current) {
        canopyRef.current.noise.volume.rampTo(Math.max(-60, Math.min(-20, canopyVol)), 0.1)
    }

    // Adjust Insects - louder in understory/canopy (5-20)
    if (insectRef.current) {
         const insectVol = (y > 2 && y < 20) ? -28 : -60
         insectRef.current.osc.volume.rampTo(insectVol, 0.5)
    }
  })

  return null
}

export default AudioController
