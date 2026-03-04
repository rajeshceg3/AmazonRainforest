import * as Tone from 'tone'
import * as THREE from 'three'

// --- Wind Layer ---
class WindLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.panner = new Tone.Panner(0).connect(this.output)
    this.filter = new Tone.AutoFilter({
      frequency: 0.05, baseFrequency: 120, octaves: 2.5, type: "sine", depth: 0.6,
      filter: { type: "lowpass", rolloff: -12, Q: 1 }
    }).connect(this.panner).start()
    this.noise = new Tone.Noise("pink").connect(this.filter)
    this.noise.volume.value = -60
    this.noise.start()
  }
  update(pos, time) {
    const baseVol = THREE.MathUtils.mapLinear(pos.y, 0, 40, -55, -45)
    const gust = Math.sin(time * 0.2) + Math.sin(time * 0.7 + 2.0)
    const gustVol = (gust > 1.0) ? 5 : 0
    this.noise.volume.rampTo(baseVol + gustVol, 2.0)
    const pan = THREE.MathUtils.clamp(pos.x / 150, -0.4, 0.4)
    this.panner.pan.linearRampTo(pan, 0.5)
  }
  dispose() {
    this.noise.dispose(); this.filter.dispose(); this.panner.dispose()
  }
}

// --- River Layer ---
class RiverLayer {
  constructor(outputNode) {
    this.panner = new Tone.Panner(0).connect(outputNode)
    this.rumbleFilter = new Tone.Filter(250, "lowpass").connect(this.panner)
    this.rumble = new Tone.Noise("brown").connect(this.rumbleFilter)
    this.rumble.volume.value = -60
    this.rumble.start()
    this.rushFilter = new Tone.Filter(300, "lowpass").connect(this.panner)
    this.rushNoise = new Tone.Noise("pink").connect(this.rushFilter)
    this.rushNoise.volume.value = -60
    this.rushNoise.start()
    this.rushLFO = new Tone.LFO(0.15, 200, 500).connect(this.rushFilter.frequency).start()
    this.bubbleSynth = new Tone.MetalSynth({
        frequency: 200, envelope: { attack: 0.01, decay: 0.1, release: 0.1 },
        harmonicity: 5.1, modulationIndex: 40, resonance: 3000, octaves: 1.5
    }).connect(this.panner)
    this.bubbleSynth.volume.value = -25
    this.lastBubbleTime = 0
  }
  update(pos, time) {
    // 3D Distance Logic: River is at X=0, Y=0 (approx).
    // Penalize Y distance more heavily (times 2) to fade out when flying up.
    const dist = Math.sqrt(pos.x**2 + (pos.y * 2)**2)
    const distFactor = Math.max(0, 1 - dist / 60)
    const vol = -60 + (distFactor * 35)

    // Ensure finite values
    if (!Number.isFinite(vol)) return

    const clampedVol = Math.max(-80, Math.min(-25, vol))

    this.rumble.volume.rampTo(clampedVol, 0.2)
    this.rushNoise.volume.rampTo(clampedVol - 5, 0.2)

    let pan = THREE.MathUtils.clamp((0 - pos.x) / 40, -0.8, 0.8)
    if (!Number.isFinite(pan)) pan = 0

    this.panner.pan.linearRampTo(pan, 0.1)

    if (dist < 15 && time - this.lastBubbleTime > 0.2 + Math.random() * 0.5) {
      if (Math.random() > 0.7) {
        const freq = 150 + Math.random() * 100
        this.bubbleSynth.triggerAttackRelease(freq, "32n", time)
        this.lastBubbleTime = time
      }
    }
  }
  dispose() {
    this.rumble.dispose(); this.rumbleFilter.dispose(); this.rushNoise.dispose()
    this.rushFilter.dispose(); this.rushLFO.dispose(); this.panner.dispose(); this.bubbleSynth.dispose()
  }
}

// --- Wood Layer ---
class WoodLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.panner = new Tone.Panner(0).connect(this.output)
    this.synth = new Tone.FMSynth({
      harmonicity: 2, modulationIndex: 10, detune: 0, oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 1, sustain: 1, release: 2 },
      modulation: { type: "square" }, modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    }).connect(this.panner)
    this.synth.volume.value = -35
    this.filter = new Tone.Filter(300, "lowpass").connect(this.panner)
    this.synth.disconnect(); this.synth.connect(this.filter)
    this.lastCreakTime = 0
  }
  update(pos, time) {
    if (pos.y > 0 && pos.y < 35) {
        if (time - this.lastCreakTime > 10 + Math.random() * 20) {
            if (Math.random() > 0.7) {
                this.panner.pan.value = (Math.random() - 0.5) * 1.0
                const freq = 50 + Math.random() * 30; const dur = 3 + Math.random() * 2
                this.synth.triggerAttackRelease(freq, dur, time)
                this.lastCreakTime = time
            }
        }
    }
  }
  dispose() { this.synth.dispose(); this.filter.dispose(); this.panner.dispose() }
}

// --- Canopy Layer ---
class CanopyLayer {
  constructor(outputNode) {
    this.panner = new Tone.Panner(0).connect(outputNode)
    this.airFilter = new Tone.Filter(6000, "highpass").connect(this.panner)
    this.airNoise = new Tone.Noise("white").connect(this.airFilter)
    this.airNoise.volume.value = -60; this.airNoise.start()
    this.rustleFilter = new Tone.AutoFilter({ frequency: 1, baseFrequency: 3000, octaves: 2, depth: 0.4 }).connect(this.panner).start()
    this.rustleNoise = new Tone.Noise("pink").connect(this.rustleFilter)
    this.rustleNoise.volume.value = -60; this.rustleNoise.start()
  }
  update(pos, time) {
    const distToCanopy = Math.abs(pos.y - 25)
    // Enveloping feel: louder near canopy, but never silent
    let vol = THREE.MathUtils.mapLinear(distToCanopy, 0, 25, -35, -55)
    if (!Number.isFinite(vol)) vol = -65

    const clampedVol = Math.max(-65, vol)
    this.airNoise.volume.rampTo(clampedVol - 5, 2)
    this.rustleNoise.volume.rampTo(clampedVol, 1)

    let pan = THREE.MathUtils.clamp(pos.x / 100, -0.3, 0.3)
    if (!Number.isFinite(pan)) pan = 0

    this.panner.pan.linearRampTo(pan, 1)
  }
  dispose() { this.airNoise.dispose(); this.airFilter.dispose(); this.rustleNoise.dispose(); this.rustleFilter.dispose(); this.panner.dispose() }
}

// --- Rain Layer ---
class RainLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.bedFilter = new Tone.Filter(800, "lowpass").connect(this.output)
    this.bedNoise = new Tone.Noise("pink").connect(this.bedFilter)
    this.bedNoise.volume.value = -60; this.bedNoise.start()
    this.dropSynth = new Tone.MetalSynth({
        frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
        harmonicity: 5.1, modulationIndex: 32, resonance: 2000, octaves: 1.5
    }).connect(this.output)
    this.dropSynth.volume.value = -30
    this.lastDropTime = 0
  }
  update(pos, time) {
    this.bedNoise.volume.rampTo(-35, 2)
    if (time - this.lastDropTime > 0.05 + Math.random() * 0.2) {
         if (Math.random() > 0.6) {
             const freq = 300 + Math.random() * 400
             this.dropSynth.triggerAttackRelease(freq, "32n", time, 0.3 + Math.random() * 0.2)
             this.lastDropTime = time
         }
    }
  }
  dispose() { this.bedNoise.dispose(); this.bedFilter.dispose(); this.dropSynth.dispose() }
}

// --- Insect Layer ---
class InsectLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.panner = new Tone.Panner(0).connect(this.output)
        this.bgFilter = new Tone.Filter(6000, "highpass").connect(this.panner)
        this.bgOsc = new Tone.FatOscillator({ type: "sawtooth", frequency: 7000, count: 3, spread: 20 }).connect(this.bgFilter).start()
        this.bgOsc.volume.value = -40
        this.bgLFO = new Tone.LFO(0.1, -40, -32).connect(this.bgOsc.volume).start()
        this.pulseFilter = new Tone.Filter(5000, "bandpass").connect(this.panner)
        this.pulseOsc = new Tone.AMOscillator({ type: "sine", modulationType: "sine", harmonicity: 0.5, modulationIndex: 0.5 }).connect(this.pulseFilter).start()
        this.pulseOsc.frequency.value = 6000; this.pulseOsc.volume.value = -45
        this.pulseLFO = new Tone.LFO(15, -50, -35).connect(this.pulseOsc.volume).start()
    }
    update(pos, time) {
        const intensity = Math.min(1, Math.max(0, (20 - pos.y) / 20))
        this.bgLFO.max = -32 * intensity - 40 * (1-intensity)
        this.bgLFO.min = -45 * intensity - 60 * (1-intensity)
        if(Math.random() > 0.98) this.pulseLFO.frequency.rampTo(8 + Math.random() * 12, 4)
    }
    dispose() { this.bgOsc.dispose(); this.bgFilter.dispose(); this.bgLFO.dispose(); this.pulseOsc.dispose(); this.pulseFilter.dispose(); this.pulseLFO.dispose(); this.panner.dispose() }
}

// --- Frog Layer (Background) ---
class FrogLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.panner = new Tone.Panner3D(0, 0, 0).connect(this.output)
    this.synth = new Tone.FMSynth({
      harmonicity: 3, modulationIndex: 10, detune: 0, oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.5 },
      modulation: { type: "square" }, modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.1, release: 0.5 }
    }).connect(this.panner)
    this.synth.volume.value = -18
    this.lastCroakTime = 0
  }
  update(pos, time) {
    // Only background random frogs
    if (pos.y < 5 && Math.abs(pos.x) < 40) {
        if (time - this.lastCroakTime > 3 + Math.random() * 8) {
            if (Math.random() > 0.5) {
                const angle = Math.random() * Math.PI * 2; const dist = 5 + Math.random() * 10
                this.panner.positionX.value = pos.x + Math.cos(angle) * dist
                this.panner.positionY.value = 0.5
                this.panner.positionZ.value = pos.z + Math.sin(angle) * dist
                const note = "F2"
                this.synth.triggerAttackRelease(note, "16n", time)
                setTimeout(() => { this.synth.triggerAttackRelease(note, "16n", Tone.now()) }, 150)
                this.lastCroakTime = time
            }
        }
    }
  }
  dispose() { this.synth.dispose(); this.panner.dispose() }
}

// --- Howler Monkey Layer ---
class HowlerMonkeyLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.panner = new Tone.Panner(0).connect(this.output)
    this.filter = new Tone.Filter(800, "lowpass").connect(this.panner)
    this.synth = new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 2, decay: 1, sustain: 1, release: 3 } }).connect(this.filter)
    this.synth.volume.value = -25
    this.lfo = new Tone.LFO(0.2, 100, 300).connect(this.synth.frequency).start()
    this.lastHowlTime = 0
  }
  update(pos, time) {
    if (time - this.lastHowlTime > 40 + Math.random() * 60) {
        if (Math.random() > 0.3) {
             this.panner.pan.value = (Math.random() - 0.5) * 1.5
             const duration = 4 + Math.random() * 3
             this.synth.triggerAttackRelease("C2", duration, time)
             this.lastHowlTime = time
        }
    }
  }
  dispose() { this.synth.dispose(); this.filter.dispose(); this.lfo.dispose(); this.panner.dispose() }
}

// --- Creature Manager (Birds) ---
class CreatureManager {
  constructor(outputNode) {
    this.output = outputNode
    this.birdPanner = new Tone.Panner3D(0, 0, 0).connect(this.output)
    this.compressor = new Tone.Compressor(-20, 3).connect(this.birdPanner)
    this.toucanSynth = new Tone.FMSynth({
        harmonicity: 1, modulationIndex: 15, oscillator: { type: "sine" },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0, release: 0.1 },
        modulation: { type: "square" }, modulationEnvelope: { attack: 0.02, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.compressor)
    this.toucanSynth.volume.value = -12
    this.toucanVibrato = new Tone.LFO(6, -10, 10).connect(this.toucanSynth.detune).start()
    this.pihaSynth = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.5 } }).connect(this.compressor)
    this.pihaSynth.volume.value = -14
    this.pihaVibrato = new Tone.LFO(4, -15, 15).connect(this.pihaSynth.detune).start()
    this.parrotSynth = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0 } }).connect(this.compressor)
    this.parrotSynth.volume.value = -16
    this.lastCallTime = 0
  }
  update(pos, time) {
    Tone.Listener.positionX.value = pos.x; Tone.Listener.positionY.value = pos.y; Tone.Listener.positionZ.value = pos.z
    if (time - this.lastCallTime > 5 + Math.random() * 10) {
      if (Math.random() > 0.4) {
        const angle = Math.random() * Math.PI * 2; const dist = 15 + Math.random() * 25
        const bx = pos.x + Math.cos(angle) * dist; const by = Math.max(10, pos.y + (Math.random() * 20)); const bz = pos.z + Math.sin(angle) * dist
        this.birdPanner.positionX.value = bx; this.birdPanner.positionY.value = by; this.birdPanner.positionZ.value = bz
        const birdType = Math.random()
        if (birdType < 0.33) this.playToucan(time)
        else if (birdType < 0.66) this.playPiha(time)
        else this.playParrot(time)
        this.lastCallTime = time
      }
    }
  }
  playToucan(time) {
      const note = "C3"; this.toucanSynth.detune.value = (Math.random() - 0.5) * 200
      this.toucanSynth.triggerAttackRelease(note, "16n", time)
      setTimeout(() => { this.toucanSynth.triggerAttackRelease(note, "16n", Tone.now()) }, 400 + Math.random() * 50)
  }
  playPiha(time) {
      const pitchVar = 0.9 + Math.random() * 0.2; const startFreq = 1200 * pitchVar; const endFreq = 1800 * pitchVar
      this.pihaSynth.triggerAttack(startFreq, time); this.pihaSynth.frequency.rampTo(endFreq, 0.4, time)
      this.pihaSynth.triggerRelease(time + 0.5)
      setTimeout(() => {
          const t2 = Tone.now(); this.pihaSynth.triggerAttack(1500 * pitchVar, t2); this.pihaSynth.frequency.rampTo(1000 * pitchVar, 0.3, t2)
          this.pihaSynth.triggerRelease(t2 + 0.4)
      }, 800 + Math.random() * 100)
  }
  playParrot(time) {
      this.parrotSynth.envelope.decay = 0.1 + Math.random() * 0.3; this.parrotSynth.triggerAttackRelease("8n", time)
  }
  dispose() { this.toucanSynth.dispose(); this.toucanVibrato.dispose(); this.pihaSynth.dispose(); this.pihaVibrato.dispose(); this.parrotSynth.dispose(); this.birdPanner.dispose(); this.compressor.dispose() }
}

// --- Ambience Layers ---
class AmbienceLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.padSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" }, envelope: { attack: 2, decay: 3, sustain: 0.5, release: 4 } }).connect(this.output)
        this.padSynth.volume.value = -38
        this.lastChordTime = 0; this.chords = [["C3", "E3", "G3"], ["A2", "C3", "E3"], ["F3", "A3", "C4"], ["G3", "B3", "D4"]]; this.currentChord = 0
    }
    update(pos, time) {
        if (time - this.lastChordTime > 15) {
             this.padSynth.triggerAttackRelease(this.chords[this.currentChord], "2m", time)
             this.currentChord = (this.currentChord + 1) % this.chords.length; this.lastChordTime = time
        }
    }
    dispose() { this.padSynth.dispose() }
}
class DeepAmbienceLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.filter = new Tone.Filter(200, "lowpass").connect(this.output)
    this.osc = new Tone.Oscillator(60, "sine").connect(this.filter)
    this.osc.volume.value = -45; this.osc.start()
    this.lfo = new Tone.LFO(0.1, 58, 62).connect(this.osc.frequency).start()
  }
  update(pos, time) {
    if (pos.y < 20) this.osc.volume.rampTo(-40, 5)
    else this.osc.volume.rampTo(-50, 5)
  }
  dispose() { this.osc.dispose(); this.lfo.dispose(); this.filter.dispose() }
}
class MovementLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.filter = new Tone.Filter(600, "lowpass").connect(this.output)
        this.noise = new Tone.Noise("pink").connect(this.filter)
        this.noise.volume.value = -100; this.noise.start()

        // Brush rustle
        this.brushFilter = new Tone.AutoFilter({ frequency: 5, baseFrequency: 1000, octaves: 2, depth: 0.6 }).connect(this.output).start()
        this.brushNoise = new Tone.Noise("brown").connect(this.brushFilter)
        this.brushNoise.volume.value = -100; this.brushNoise.start()
    }
    update(pos, time, speed, inBrush = false) {
        if (speed > 0.2) {
             const targetVol = THREE.MathUtils.mapLinear(Math.min(speed, 10), 0, 10, -60, -25)
             this.noise.volume.rampTo(targetVol, 0.1)
             this.filter.frequency.rampTo(600 + speed * 50, 0.1)

             if (inBrush) {
                 const brushVol = THREE.MathUtils.mapLinear(Math.min(speed, 10), 0, 10, -40, -15)
                 this.brushNoise.volume.rampTo(brushVol, 0.1)
             } else {
                 this.brushNoise.volume.rampTo(-100, 0.3)
             }
        } else {
            this.noise.volume.rampTo(-100, 0.2)
            this.brushNoise.volume.rampTo(-100, 0.2)
        }
    }
    dispose() { this.noise.dispose(); this.filter.dispose(); this.brushNoise.dispose(); this.brushFilter.dispose(); }
}
class FootstepsLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.panner = new Tone.Panner(0).connect(this.output)
        this.filter = new Tone.Filter(800, "lowpass").connect(this.panner)
        this.gain = new Tone.Gain(0).connect(this.filter)
        this.noise = new Tone.Noise("brown").connect(this.gain); this.noise.start()
        this.env = new Tone.Envelope({ attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 }).connect(this.gain.gain)
        this.snapFilter = new Tone.Filter(2000, "highpass").connect(this.panner)
        this.snapGain = new Tone.Gain(0).connect(this.snapFilter)
        this.snapNoise = new Tone.Noise("white").connect(this.snapGain)
        this.snapNoise.volume.value = -12; this.snapNoise.start()
        this.snapEnv = new Tone.Envelope({ attack: 0.005, decay: 0.05, sustain: 0, release: 0.05 }).connect(this.snapGain.gain)
        this.splashSynth = new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.01, decay: 0.1, release: 0.3 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(this.panner)
        this.splashSynth.volume.value = -20
        this.lastPos = null; this.distAcc = 0;

        // Synced to 4.0u/s walking speed and 1.8Hz cadence -> ~2.2 units per step
        this.stepInterval = 2.2
    }
    update(pos, time) {
        if (!this.lastPos) { this.lastPos = pos.clone(); return }
        const dist = pos.distanceTo(this.lastPos); this.distAcc += dist
        if (this.distAcc > this.stepInterval) { this.triggerStep(time, pos); this.distAcc = 0 }
        this.lastPos.copy(pos)
    }
    triggerStep(time, pos) {
        this.panner.pan.value = (Math.random() - 0.5) * 0.2
        if (pos.y < 0.2) {
            const freq = 300 + Math.random() * 200; this.splashSynth.triggerAttackRelease(freq, "32n", time)
        } else {
            this.filter.frequency.value = 600 + Math.random() * 200; this.env.triggerAttackRelease(0.15, time)
            if (Math.random() > 0.4) this.snapEnv.triggerAttackRelease(0.05, time)
        }
    }
    dispose() { this.noise.dispose(); this.filter.dispose(); this.gain.dispose(); this.env.dispose(); this.snapNoise.dispose(); this.snapFilter.dispose(); this.snapGain.dispose(); this.snapEnv.dispose(); this.splashSynth.dispose(); this.panner.dispose() }
}

// --- Distant Thunder Layer (New) ---
class DistantThunderLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.panner = new Tone.Panner3D(0, 50, -100).connect(this.output) // Far away

        this.rumbleFilter = new Tone.Filter(150, "lowpass").connect(this.panner)
        this.synth = new Tone.MembraneSynth({
            pitchDecay: 0.1,
            octaves: 4,
            oscillator: { type: "sine" },
            envelope: { attack: 0.5, decay: 3, sustain: 0, release: 2 }
        }).connect(this.rumbleFilter)
        this.synth.volume.value = -8

        this.lastThunderTime = 0
    }
    update(pos, time) {
        if (time - this.lastThunderTime > 30 + Math.random() * 30) { // Every 30-60s
             if (Math.random() > 0.3) {
                 // Randomize position
                 const angle = Math.random() * Math.PI * 2
                 const dist = 200 + Math.random() * 300
                 this.panner.positionX.value = Math.cos(angle) * dist
                 this.panner.positionY.value = 50
                 this.panner.positionZ.value = Math.sin(angle) * dist

                 this.synth.triggerAttackRelease("A0", "1n", time)
                 this.lastThunderTime = time
             }
        }
    }
    dispose() {
        this.synth.dispose(); this.rumbleFilter.dispose(); this.panner.dispose()
    }
}


// --- Zen Layer (Stillness Aura) ---
class ZenLayer {
    constructor(outputNode) {
        this.output = outputNode

        // Deep Warm Pad
        this.padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 5, decay: 5, sustain: 1.0, release: 10 }
        }).connect(this.output)

        // Shimmering Chorus
        this.chorus = new Tone.Chorus(4, 2.5, 0.5).connect(this.output).start()
        this.fmSynth = new Tone.FMSynth({
            harmonicity: 3, modulationIndex: 10, oscillator: { type: "sine" },
            envelope: { attack: 4, decay: 4, sustain: 0.5, release: 8 },
            modulation: { type: "triangle" }
        }).connect(this.chorus)

        // Initial volumes very low
        this.padSynth.volume.value = -100
        this.fmSynth.volume.value = -100

        // State
        this.active = false
        this.chords = [
            ["C3", "E3", "G3", "B3"], // Cmaj7
            ["F2", "A2", "C3", "E3"], // Fmaj7
            ["A2", "C3", "E3", "G3"], // Amin7
            ["G2", "B2", "D3", "F#3"] // Gmaj7
        ]
        this.currentChord = 0
        this.lastPlayTime = 0
    }

    update(factor, time) {
        if (factor > 0.1 && !this.active) {
            this.active = true
            // Start playing
            this.lastPlayTime = time
            this.padSynth.triggerAttack(this.chords[this.currentChord], time)
            this.fmSynth.triggerAttackRelease("C5", "1m", time)
        }

        if (this.active) {
            // Volume logic based on stillness factor (0.0 to 1.0)
            let targetPadVol = THREE.MathUtils.lerp(-100, -20, factor)
            let targetFmVol = THREE.MathUtils.lerp(-100, -25, factor)

            if (Number.isFinite(targetPadVol) && !isNaN(targetPadVol) && targetPadVol > -Infinity && targetPadVol < Infinity) {
                try {
                    this.padSynth.volume.value = targetPadVol // Use value assignment instead of ramp to avoid WebAudio param state errors in Three.js loop
                } catch(e) {}
            }
            if (Number.isFinite(targetFmVol) && !isNaN(targetFmVol) && targetFmVol > -Infinity && targetFmVol < Infinity) {
                try {
                    this.fmSynth.volume.value = targetFmVol
                } catch(e) {}
            }

            // Chord progression every 8 seconds
            if (time - this.lastPlayTime > 8) {
                this.padSynth.triggerRelease(this.chords[this.currentChord], time)
                this.currentChord = (this.currentChord + 1) % this.chords.length
                this.padSynth.triggerAttack(this.chords[this.currentChord], time + 2)

                // Occasional FM shimmer
                if (Math.random() > 0.5) {
                    const shimmerNote = ["E5", "G5", "B5"][Math.floor(Math.random() * 3)]
                    this.fmSynth.triggerAttackRelease(shimmerNote, "2m", time + 1)
                }

                this.lastPlayTime = time
            }

            if (factor <= 0.05) {
                this.active = false
                this.padSynth.triggerRelease(this.chords[this.currentChord], time)
                this.padSynth.volume.value = -100
                this.fmSynth.volume.value = -100
            }
        }
    }

    dispose() {
        this.padSynth.dispose(); this.fmSynth.dispose(); this.chorus.dispose()
    }
}

// --- Hummingbird Layer (Background/Loop) ---
class HummingbirdLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.panner = new Tone.Panner3D(0, 5, 0).connect(this.output)

        // High frequency buzz
        this.synth = new Tone.Synth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.1, decay: 0.1, sustain: 1.0, release: 0.1 }
        }).connect(this.panner)
        this.synth.volume.value = -35

        // Tremolo for the "flutter" sound (50Hz)
        this.tremolo = new Tone.Tremolo(50, 0.8).connect(this.panner).start()
        this.synth.disconnect(); this.synth.connect(this.tremolo)

        // Move it around
        this.lastMove = 0
    }

    update(pos, time) {
        // Occasionally trigger a chirp
        if (Math.random() > 0.995) {
            this.synth.triggerAttackRelease("C6", "32n", time)
        }

        // Move the source relative to player
        if (time - this.lastMove > 2.0) {
             const angle = Math.random() * Math.PI * 2
             this.panner.positionX.linearRampTo(pos.x + Math.sin(angle) * 3, 2)
             this.panner.positionY.linearRampTo(pos.y + 1 + Math.random(), 2)
             this.panner.positionZ.linearRampTo(pos.z + Math.cos(angle) * 3, 2)
             this.lastMove = time
        }
    }

    dispose() {
        this.synth.dispose(); this.tremolo.dispose(); this.panner.dispose()
    }
}

// --- Main Manager ---
export class SoundscapeManager {
  constructor() {
    this.limiter = new Tone.Limiter(-1).toDestination()
    this.masterEQ = new Tone.EQ3({ high: -6, mid: 0, low: 0, highFrequency: 8000 }).connect(this.limiter)
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.25 }).connect(this.masterEQ)
    this.reverb.generate()
    this.masterComp = new Tone.Compressor({ threshold: -20, ratio: 2.5, attack: 0.05, release: 0.2 }).connect(this.reverb)

    this.river = new RiverLayer(this.masterComp)
    this.canopy = new CanopyLayer(this.masterComp)
    this.wood = new WoodLayer(this.masterComp)
    this.rain = new RainLayer(this.masterComp)
    this.insects = new InsectLayer(this.masterComp)
    this.creatures = new CreatureManager(this.masterComp)
    this.frogs = new FrogLayer(this.masterComp)
    this.howlers = new HowlerMonkeyLayer(this.masterComp)
    this.ambience = new AmbienceLayer(this.masterComp)
    this.deepAmbience = new DeepAmbienceLayer(this.masterComp)
    this.wind = new WindLayer(this.masterComp)
    this.movement = new MovementLayer(this.masterComp)
    this.footsteps = new FootstepsLayer(this.masterComp)
    this.hummingbirds = new HummingbirdLayer(this.masterComp)
    this.zen = new ZenLayer(this.masterComp) // New Zen Layer
    this.distantThunder = new DistantThunderLayer(this.reverb) // Connect directly to reverb for space

    this.thunderSynth = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.05, decay: 2.5, sustain: 0 } }).connect(this.reverb)
    this.thunderSynth.volume.value = -15
    this.thunderRumble = new Tone.MembraneSynth({ pitchDecay: 0.2, octaves: 4 }).connect(this.reverb)
    this.thunderRumble.volume.value = -10

    // Splash FX for player
    this.splashFX = new Tone.MetalSynth({
        frequency: 200, envelope: { attack: 0.01, decay: 0.2, release: 0.5 },
        harmonicity: 3.1, modulationIndex: 16, resonance: 3000, octaves: 1.5
    }).connect(this.reverb)
    this.splashFX.volume.value = -10

    // Tracking Stillness
    this.stillnessFactor = 0

    Tone.Transport.start()
  }

  setStillness(factor) {
      // 0.0 to 1.0, where 1.0 is completely still and glowing
      this.stillnessFactor = factor
  }

  update(pos, speed = 0, inBrush = false) {
    const p = (typeof pos === 'number') ? new THREE.Vector3(0, pos, 0) : pos

    // Safety check for NaN positions which cause AudioParam errors
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) return;
    if (!Number.isFinite(speed)) speed = 0;

    const time = Tone.now()
    try {
        this.river.update(p, time); this.canopy.update(p, time); this.wood.update(p, time)
        this.rain.update(p, time); this.insects.update(p, time); this.creatures.update(p, time)
        this.frogs.update(p, time); this.howlers.update(p, time); this.ambience.update(p, time)
        this.deepAmbience.update(p, time); this.wind.update(p, time); this.movement.update(p, time, speed, inBrush)
        this.footsteps.update(p, time); this.hummingbirds.update(p, time)
        this.distantThunder.update(p, time)

        // Update Zen Layer with current stillness factor
        this.zen.update(this.stillnessFactor, time)
    } catch (e) {
        // Prevent audio errors from crashing the visual loop
        if (!this.hasLoggedError) {
            console.warn("Audio update error (logged once):", e);
            this.hasLoggedError = true;
        }
    }
  }

  triggerThunder(distance) {
    const time = Tone.now(); const delay = distance / 343; const arrivalTime = time + delay
    const vol = Math.max(-45, -15 - (distance / 500) * 30)
    this.thunderSynth.volume.value = vol; this.thunderRumble.volume.value = vol + 5
    this.thunderSynth.triggerAttackRelease("8n", arrivalTime)
    this.thunderRumble.triggerAttackRelease("C1", "2n", arrivalTime)
  }

  triggerSplash(pos) {
      // Simple non-spatial or center spatial splash for player
      this.splashFX.triggerAttackRelease(150 + Math.random()*100, "16n", Tone.now())
  }

  // Public accessor for components to connect their own audio nodes
  getDestination() {
      return this.masterComp
  }

  dispose() {
    this.river.dispose(); this.canopy.dispose(); this.wood.dispose(); this.rain.dispose()
    this.insects.dispose(); this.creatures.dispose(); this.frogs.dispose(); this.howlers.dispose()
    this.ambience.dispose(); this.deepAmbience.dispose(); this.wind.dispose(); this.movement.dispose()
    this.footsteps.dispose(); this.hummingbirds.dispose(); this.distantThunder.dispose()
    this.zen.dispose()
    this.thunderSynth.dispose(); this.thunderRumble.dispose(); this.splashFX.dispose()
    this.reverb.dispose(); this.masterComp.dispose(); this.masterEQ.dispose(); this.limiter.dispose()
    Tone.Transport.stop()
  }
}
