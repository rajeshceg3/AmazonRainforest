import * as Tone from 'tone'
import * as THREE from 'three'

// --- Wind Layer ---
// Gentle, filtered noise for wind texture
class WindLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.panner = new Tone.Panner(0).connect(this.output)

    // Filtered Noise for Wind Texture (Low Pass for distant rumble)
    this.filter = new Tone.AutoFilter({
      frequency: 0.05,
      baseFrequency: 120,
      octaves: 2.5,
      type: "sine",
      depth: 0.6,
      filter: {
        type: "lowpass",
        rolloff: -12,
        Q: 1
      }
    }).connect(this.panner).start()

    this.noise = new Tone.Noise("pink").connect(this.filter)
    this.noise.volume.value = -60
    this.noise.start()
  }

  update(pos, time) {
    // Volume increases slightly with height (0 to 40)
    // Gentle mix: -45dB max
    const baseVol = THREE.MathUtils.mapLinear(pos.y, 0, 40, -55, -45)
    this.noise.volume.rampTo(baseVol, 2.0)

    // Subtle panning based on X position relative to center
    const pan = THREE.MathUtils.clamp(pos.x / 150, -0.4, 0.4)
    this.panner.pan.rampTo(pan, 0.5)
  }

  dispose() {
    this.noise.dispose()
    this.filter.dispose()
    this.panner.dispose()
  }
}

// --- River Layer ---
// Deep rumble + bubbling water texture
class RiverLayer {
  constructor(outputNode) {
    this.panner = new Tone.Panner(0).connect(outputNode)

    // 1. Low Rumble (Brown Noise) - The power of the river
    this.rumbleFilter = new Tone.Filter(250, "lowpass").connect(this.panner)
    this.rumble = new Tone.Noise("brown").connect(this.rumbleFilter)
    this.rumble.volume.value = -60
    this.rumble.start()

    // 2. Rushing Water (Pink Noise + Filter modulation)
    this.rushFilter = new Tone.Filter(600, "lowpass").connect(this.panner)
    this.rushNoise = new Tone.Noise("pink").connect(this.rushFilter)
    this.rushNoise.volume.value = -60
    this.rushNoise.start()

    // LFO to modulate filter frequency for "movement"
    this.rushLFO = new Tone.LFO(0.15, 500, 800).connect(this.rushFilter.frequency).start()

    // 3. Bubbles/Lap (MetalSynth for water texture)
    this.bubbleSynth = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.01, decay: 0.1, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).connect(this.panner)
    this.bubbleSynth.volume.value = -25

    this.lastBubbleTime = 0
  }

  update(pos, time) {
    // River assumed at X=0, running along Z
    const dist = Math.abs(pos.x)

    // Volume logic: Loudest at X=0, fade out by X=60
    const distFactor = Math.max(0, 1 - dist / 60)

    // Gentle mix: Max volume -25dB
    const vol = -60 + (distFactor * 35)
    const clampedVol = Math.max(-80, Math.min(-25, vol))

    this.rumble.volume.rampTo(clampedVol, 0.2)
    this.rushNoise.volume.rampTo(clampedVol - 5, 0.2)

    // Panning
    const pan = THREE.MathUtils.clamp((0 - pos.x) / 40, -0.8, 0.8)
    this.panner.pan.rampTo(pan, 0.1)

    // Bubbles near water (closer than 15 units)
    if (dist < 15 && time - this.lastBubbleTime > 0.2 + Math.random() * 0.5) {
      if (Math.random() > 0.7) {
        // Random "glug" pitch
        const freq = 150 + Math.random() * 100
        this.bubbleSynth.triggerAttackRelease(freq, "32n", time)
        this.lastBubbleTime = time
      }
    }
  }

  dispose() {
    this.rumble.dispose()
    this.rumbleFilter.dispose()
    this.rushNoise.dispose()
    this.rushFilter.dispose()
    this.rushLFO.dispose()
    this.panner.dispose()
    this.bubbleSynth.dispose()
  }
}

// --- Wood Layer ---
// Creaking trees (FM Synthesis)
class WoodLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.panner = new Tone.Panner(0).connect(this.output)

    this.synth = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 10,
      detune: 0,
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 1, sustain: 1, release: 2 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    }).connect(this.panner)
    this.synth.volume.value = -35 // Subtle background layer

    this.filter = new Tone.Filter(300, "lowpass").connect(this.panner)
    this.synth.disconnect()
    this.synth.connect(this.filter)

    this.lastCreakTime = 0
  }

  update(pos, time) {
    // Only creak in the forest (low altitude)
    if (pos.y > 0 && pos.y < 35) {
        if (time - this.lastCreakTime > 10 + Math.random() * 20) {
            if (Math.random() > 0.7) {
                this.panner.pan.value = (Math.random() - 0.5) * 1.0
                const freq = 50 + Math.random() * 30
                const dur = 3 + Math.random() * 2
                this.synth.triggerAttackRelease(freq, dur, time)
                this.lastCreakTime = time
            }
        }
    }
  }

  dispose() {
    this.synth.dispose()
    this.filter.dispose()
    this.panner.dispose()
  }
}

// --- Canopy Layer ---
// High freq leaves, rustling
class CanopyLayer {
  constructor(outputNode) {
    this.panner = new Tone.Panner(0).connect(outputNode)

    // High Air (Hiss) - Gentle "presence"
    this.airFilter = new Tone.Filter(6000, "highpass").connect(this.panner)
    this.airNoise = new Tone.Noise("white").connect(this.airFilter)
    this.airNoise.volume.value = -60
    this.airNoise.start()

    // Leaf Rustle (Filtered Pink Noise)
    this.rustleFilter = new Tone.AutoFilter({
        frequency: 1, // Slow modulation
        baseFrequency: 3000,
        octaves: 2,
        depth: 0.4
    }).connect(this.panner).start()

    this.rustleNoise = new Tone.Noise("pink").connect(this.rustleFilter)
    this.rustleNoise.volume.value = -60
    this.rustleNoise.start()
  }

  update(pos, time) {
    // Loudest inside canopy (y=15 to 35)
    const distToCanopy = Math.abs(pos.y - 25)
    const vol = THREE.MathUtils.mapLinear(distToCanopy, 0, 25, -35, -65)
    const clampedVol = Math.max(-65, vol)

    this.airNoise.volume.rampTo(clampedVol - 5, 2) // Quieter air
    this.rustleNoise.volume.rampTo(clampedVol, 1)

    // Pan based on position (subtle)
    const pan = THREE.MathUtils.clamp(pos.x / 100, -0.3, 0.3)
    this.panner.pan.rampTo(pan, 1)
  }

  dispose() {
    this.airNoise.dispose()
    this.airFilter.dispose()
    this.rustleNoise.dispose()
    this.rustleFilter.dispose()
    this.panner.dispose()
  }
}

// --- Rain Layer ---
// Dual Layer: Distance (Pink Noise) + Drops (MetalSynth)
class RainLayer {
  constructor(outputNode) {
    this.output = outputNode

    // 1. Distant Rain (Bed)
    this.bedFilter = new Tone.Filter(800, "lowpass").connect(this.output)
    this.bedNoise = new Tone.Noise("pink").connect(this.bedFilter)
    this.bedNoise.volume.value = -60
    this.bedNoise.start()

    // 2. Leaf Drops (Individual hits)
    // MetalSynth gives a nice "ping" that sounds like water on broad leaves when tuned right
    this.dropSynth = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 2000,
        octaves: 1.5
    }).connect(this.output)
    this.dropSynth.volume.value = -30

    this.lastDropTime = 0
  }

  update(pos, time) {
    // Constant background rain, gentle volume (-35dB)
    this.bedNoise.volume.rampTo(-35, 2)

    // Random drops (more frequent)
    if (time - this.lastDropTime > 0.05 + Math.random() * 0.2) {
         if (Math.random() > 0.6) {
             // Randomize pitch slightly for organic feel
             // High pitch = small leaf, Low pitch = big leaf
             const freq = 300 + Math.random() * 400
             // Very short velocity
             this.dropSynth.triggerAttackRelease(freq, "32n", time, 0.3 + Math.random() * 0.2)
             this.lastDropTime = time
         }
    }
  }

  dispose() {
    this.bedNoise.dispose()
    this.bedFilter.dispose()
    this.dropSynth.dispose()
  }
}

// --- Insect Layer ---
// Rich, shimmering texture using FatOscillator and AM Synthesis
class InsectLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.panner = new Tone.Panner(0).connect(this.output)

        // 1. Shimmering Background (The "Thrum")
        // High pass filter to keep it airy and not muddy
        this.bgFilter = new Tone.Filter(6000, "highpass").connect(this.panner)

        // FatOscillator creates a rich chorus effect
        this.bgOsc = new Tone.FatOscillator({
            type: "sawtooth",
            frequency: 7000,
            count: 3,
            spread: 20
        }).connect(this.bgFilter).start()
        this.bgOsc.volume.value = -40

        // LFO to modulate volume slowly (breathing effect)
        this.bgLFO = new Tone.LFO(0.1, -40, -32).connect(this.bgOsc.volume).start()


        // 2. Rhythmic Pulse (AM Synthesis - Cicada style)
        this.pulseFilter = new Tone.Filter(5000, "bandpass").connect(this.panner)
        this.pulseOsc = new Tone.AMOscillator({
            type: "sine",
            modulationType: "sine",
            harmonicity: 0.5, // modulation freq relative to carrier
            modulationIndex: 0.5
        }).connect(this.pulseFilter).start()
        this.pulseOsc.frequency.value = 6000
        this.pulseOsc.volume.value = -45

        // Modulate the pulse speed
        this.pulseLFO = new Tone.LFO(15, -50, -35).connect(this.pulseOsc.volume).start()
    }

    update(pos, time) {
        // Insects louder near trees/ground (y < 20)
        const intensity = Math.min(1, Math.max(0, (20 - pos.y) / 20))

        // Background volume modulation
        this.bgLFO.max = -32 * intensity - 40 * (1-intensity)
        this.bgLFO.min = -45 * intensity - 60 * (1-intensity)

        // Pulse LFO speed variation (Cicadas change rhythm)
        if(Math.random() > 0.98) {
            this.pulseLFO.frequency.rampTo(8 + Math.random() * 12, 4)
        }
    }

    dispose() {
        this.bgOsc.dispose()
        this.bgFilter.dispose()
        this.bgLFO.dispose()
        this.pulseOsc.dispose()
        this.pulseFilter.dispose()
        this.pulseLFO.dispose()
        this.panner.dispose()
    }
}

// --- Creature Manager (Birds & Frogs) ---
class CreatureManager {
  constructor(outputNode) {
    this.output = outputNode

    // Panner3D for localized sounds
    this.birdPanner = new Tone.Panner3D(0, 0, 0).connect(this.output)

    // Compressor specifically for bird calls to tame peaks
    this.compressor = new Tone.Compressor(-20, 3).connect(this.birdPanner)

    // 1. Toucan Synth (FM - Low Croak)
    this.toucanSynth = new Tone.FMSynth({
        harmonicity: 1,
        modulationIndex: 15,
        oscillator: { type: "sine" },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0, release: 0.1 },
        modulation: { type: "square" },
        modulationEnvelope: { attack: 0.02, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.compressor)
    this.toucanSynth.volume.value = -12

    // 2. Piha Synth (Sine - Whistle)
    this.pihaSynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.5 }
    }).connect(this.compressor)
    this.pihaSynth.volume.value = -14

    // 3. Parrot Synth (Noise/FM hybrid)
    this.parrotSynth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0 }
    }).connect(this.compressor)
    this.parrotSynth.volume.value = -16

    this.lastCallTime = 0
  }

  update(pos, time) {
    // Update listener
    Tone.Listener.positionX.value = pos.x
    Tone.Listener.positionY.value = pos.y
    Tone.Listener.positionZ.value = pos.z

    // Bird Calls (Sparse, procedural)
    if (time - this.lastCallTime > 5 + Math.random() * 10) {
      if (Math.random() > 0.4) {
        // Random Position
        const angle = Math.random() * Math.PI * 2
        const dist = 15 + Math.random() * 25
        const bx = pos.x + Math.cos(angle) * dist
        const by = Math.max(10, pos.y + (Math.random() * 20))
        const bz = pos.z + Math.sin(angle) * dist

        this.birdPanner.positionX.value = bx
        this.birdPanner.positionY.value = by
        this.birdPanner.positionZ.value = bz

        const birdType = Math.random()

        if (birdType < 0.33) {
            this.playToucan(time)
        } else if (birdType < 0.66) {
            this.playPiha(time)
        } else {
            this.playParrot(time)
        }

        this.lastCallTime = time
      }
    }
  }

  playToucan(time) {
      // Rhythmic croak: "Rrrt... Rrrt"
      const note = "C3"
      this.toucanSynth.triggerAttackRelease(note, "16n", time)
      setTimeout(() => {
          this.toucanSynth.triggerAttackRelease(note, "16n", Tone.now())
      }, 400)
  }

  playPiha(time) {
      // Screaming Piha: Slide up then down
      // Start high, go higher
      const startFreq = 1200
      this.pihaSynth.triggerAttack(startFreq, time)
      this.pihaSynth.frequency.rampTo(1800, 0.4, time)

      // Stop
      this.pihaSynth.triggerRelease(time + 0.5)

      // Second part usually follows
      setTimeout(() => {
          const t2 = Tone.now()
          this.pihaSynth.triggerAttack(1500, t2)
          this.pihaSynth.frequency.rampTo(1000, 0.3, t2)
          this.pihaSynth.triggerRelease(t2 + 0.4)
      }, 800)
  }

  playParrot(time) {
      // Short squawk
      this.parrotSynth.triggerAttackRelease("8n", time)
  }

  dispose() {
    this.toucanSynth.dispose()
    this.pihaSynth.dispose()
    this.parrotSynth.dispose()
    this.birdPanner.dispose()
    this.compressor.dispose()
  }
}

// --- Ambience Layer ---
class AmbienceLayer {
    constructor(outputNode) {
        this.output = outputNode

        // Warm pad for emotional "gentleness"
        this.padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 2, decay: 3, sustain: 0.5, release: 4 }
        }).connect(this.output)
        this.padSynth.volume.value = -38 // Very quiet bed

        this.lastChordTime = 0
        this.chords = [["C3", "E3", "G3"], ["A2", "C3", "E3"], ["F3", "A3", "C4"], ["G3", "B3", "D4"]]
        this.currentChord = 0
    }

    update(pos, time) {
        if (time - this.lastChordTime > 15) {
             // Slow chord changes
             this.padSynth.triggerAttackRelease(this.chords[this.currentChord], "2m", time)
             this.currentChord = (this.currentChord + 1) % this.chords.length
             this.lastChordTime = time
        }
    }

    dispose() {
        this.padSynth.dispose()
    }
}

// --- Movement Layer ---
class MovementLayer {
    constructor(outputNode) {
        this.output = outputNode

        // Low pass filter for "crunch" not "hiss"
        this.filter = new Tone.Filter(600, "lowpass").connect(this.output)
        this.noise = new Tone.Noise("pink").connect(this.filter)
        this.noise.volume.value = -100
        this.noise.start()
    }

    update(pos, time, speed) {
        // Only audible when moving fast enough
        if (speed > 0.2) {
             const targetVol = THREE.MathUtils.mapLinear(Math.min(speed, 10), 0, 10, -60, -25)
             this.noise.volume.rampTo(targetVol, 0.1)
             // Open filter slightly with speed
             this.filter.frequency.rampTo(600 + speed * 50, 0.1)
        } else {
             this.noise.volume.rampTo(-100, 0.2)
        }
    }

    dispose() {
        this.noise.dispose()
        this.filter.dispose()
    }
}

// --- Footsteps Layer ---
class FootstepsLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.panner = new Tone.Panner(0).connect(this.output)
        this.filter = new Tone.Filter(800, "lowpass").connect(this.panner)
        this.gain = new Tone.Gain(0).connect(this.filter)
        this.noise = new Tone.Noise("brown").connect(this.gain)
        this.noise.start()

        this.env = new Tone.Envelope({
            attack: 0.01,
            decay: 0.15,
            sustain: 0,
            release: 0.1
        }).connect(this.gain.gain)

        this.lastPos = null
        this.distAcc = 0
        this.stepInterval = 4.0
    }

    update(pos, time) {
        if (!this.lastPos) {
            this.lastPos = pos.clone()
            return
        }

        const dist = pos.distanceTo(this.lastPos)
        this.distAcc += dist

        if (this.distAcc > this.stepInterval) {
            this.triggerStep(time)
            this.distAcc = 0
        }

        this.lastPos.copy(pos)
    }

    triggerStep(time) {
        this.filter.frequency.value = 600 + Math.random() * 200
        this.panner.pan.value = (Math.random() - 0.5) * 0.2
        this.env.triggerAttackRelease(0.15, time)
    }

    dispose() {
        this.noise.dispose()
        this.filter.dispose()
        this.gain.dispose()
        this.env.dispose()
        this.panner.dispose()
    }
}

// --- Main Manager ---
export class SoundscapeManager {
  constructor() {
    // Mastering Chain for "Gentle" Sound
    this.limiter = new Tone.Limiter(-1).toDestination()

    // Warmth Filter (High Shelf Cut) - Cuts harsh highs > 8kHz
    this.masterEQ = new Tone.EQ3({ high: -6, mid: 0, low: 0, highFrequency: 8000 }).connect(this.limiter)

    // Reverb for immersion/space
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.25 }).connect(this.masterEQ)
    this.reverb.generate()

    // Master Compressor - Glues layers together, prevents shocks
    this.masterComp = new Tone.Compressor({
        threshold: -20,
        ratio: 2.5,
        attack: 0.05,
        release: 0.2
    }).connect(this.reverb)

    // Layers
    this.river = new RiverLayer(this.masterComp)
    this.canopy = new CanopyLayer(this.masterComp)
    this.wood = new WoodLayer(this.masterComp)
    this.rain = new RainLayer(this.masterComp)
    this.insects = new InsectLayer(this.masterComp) // Renamed from cicadas for clarity
    this.creatures = new CreatureManager(this.masterComp)
    this.ambience = new AmbienceLayer(this.masterComp)
    this.wind = new WindLayer(this.masterComp)
    this.movement = new MovementLayer(this.masterComp)
    this.footsteps = new FootstepsLayer(this.masterComp)

    // Thunder Synth
    this.thunderSynth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.05, decay: 2.5, sustain: 0 } // Softer attack
    }).connect(this.reverb)
    this.thunderSynth.volume.value = -15

    this.thunderRumble = new Tone.MembraneSynth({
        pitchDecay: 0.2,
        octaves: 4
    }).connect(this.reverb)
    this.thunderRumble.volume.value = -10

    Tone.Transport.start()
  }

  update(pos, speed = 0) {
    const p = (typeof pos === 'number') ? new THREE.Vector3(0, pos, 0) : pos
    const time = Tone.now()

    this.river.update(p, time)
    this.canopy.update(p, time)
    this.wood.update(p, time)
    this.rain.update(p, time)
    this.insects.update(p, time)
    this.creatures.update(p, time)
    this.ambience.update(p, time)
    this.wind.update(p, time)
    this.movement.update(p, time, speed)
    this.footsteps.update(p, time)
  }

  triggerThunder(distance) {
    const time = Tone.now()
    const delay = distance / 343
    const arrivalTime = time + delay
    const vol = Math.max(-45, -15 - (distance / 500) * 30)

    this.thunderSynth.volume.value = vol
    this.thunderRumble.volume.value = vol + 5

    this.thunderSynth.triggerAttackRelease("8n", arrivalTime)
    this.thunderRumble.triggerAttackRelease("C1", "2n", arrivalTime)
  }

  dispose() {
    this.river.dispose()
    this.canopy.dispose()
    this.wood.dispose()
    this.rain.dispose()
    this.insects.dispose()
    this.creatures.dispose()
    this.ambience.dispose()
    this.wind.dispose()
    this.movement.dispose()
    this.footsteps.dispose()
    this.thunderSynth.dispose()
    this.thunderRumble.dispose()
    this.reverb.dispose()
    this.masterComp.dispose()
    this.masterEQ.dispose()
    this.limiter.dispose()
    Tone.Transport.stop()
  }
}
