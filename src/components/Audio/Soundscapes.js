import * as Tone from 'tone'
import * as THREE from 'three'

// --- Wind Layer ---
// Dynamic wind based on height and random gusts
class WindLayer {
  constructor(outputNode) {
    this.output = outputNode

    // Stereo Panner
    this.panner = new Tone.Panner(0).connect(this.output)

    // Filtered Noise for Wind Texture
    this.filter = new Tone.AutoFilter({
      frequency: 0.05, // Slow sweep
      baseFrequency: 150,
      octaves: 3,
      type: "sine",
      depth: 0.8,
      filter: {
        type: "lowpass",
        rolloff: -12,
        Q: 1
      }
    }).connect(this.panner).start()

    this.noise = new Tone.Noise("pink").connect(this.filter)
    this.noise.volume.value = -60
    this.noise.start()

    // Gusts (High shelf boost)
    this.gustFilter = new Tone.Filter(800, "highpass").connect(this.panner)
    this.gustNoise = new Tone.Noise("white").connect(this.gustFilter)
    this.gustNoise.volume.value = -60
    this.gustNoise.start()

    this.lastGustTime = 0
  }

  update(pos, time) {
    // Volume increases with height (0 to 40)
    const baseVol = THREE.MathUtils.mapLinear(pos.y, 0, 40, -50, -20)

    // Smooth volume transition
    this.noise.volume.rampTo(baseVol, 1.0)

    // Panning based on X position relative to "center" of wind flow?
    // Wind usually covers everything, but let's pan slightly
    const pan = THREE.MathUtils.clamp(pos.x / 100, -0.5, 0.5)
    this.panner.pan.rampTo(pan, 0.1)

    // Gusts
    if (time - this.lastGustTime > 10 + Math.random() * 10) {
        if (Math.random() > 0.5) {
            // Gust duration
            const dur = 2 + Math.random() * 3
            // Gust volume
            const gustVol = baseVol - 5
            this.gustNoise.volume.rampTo(gustVol, dur/2)
            setTimeout(() => {
                this.gustNoise.volume.rampTo(-60, dur/2)
            }, dur * 1000 / 2)

            this.lastGustTime = time
        }
    }
  }

  dispose() {
    this.noise.dispose()
    this.filter.dispose()
    this.gustNoise.dispose()
    this.gustFilter.dispose()
    this.panner.dispose()
  }
}

// --- River Layer ---
// Deep rumble + rushing water + bubbles
class RiverLayer {
  constructor(outputNode) {
    // Stereo Panner
    this.panner = new Tone.Panner(0).connect(outputNode)

    // 1. Low Rumble (Brown Noise)
    this.rumbleFilter = new Tone.Filter(300, "lowpass").connect(this.panner)
    this.rumble = new Tone.Noise("brown").connect(this.rumbleFilter)
    this.rumble.volume.value = -60
    this.rumble.start()

    // 2. Rushing Water (White Noise + Filter)
    this.rushFilter = new Tone.Filter(800, "lowpass").connect(this.panner)
    this.rushNoise = new Tone.Noise("pink").connect(this.rushFilter)
    this.rushNoise.volume.value = -60
    this.rushNoise.start()

    // LFO to modulate filter frequency for "movement"
    this.rushLFO = new Tone.LFO(0.2, 600, 1000).connect(this.rushFilter.frequency).start()

    // 3. Bubbles (Membrane/Metal) - Near edges
    this.bubbleSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.panner)
    this.bubbleSynth.volume.value = -20

    this.lastBubbleTime = 0
  }

  update(pos, time) {
    // River is at X=0, Z=0 (approx), Y=-2
    // Calculate distance to river line (X axis mostly)
    // Assuming river flows along Z, so distance is abs(x)
    // Wait, river visual is usually a strip. Let's assume it runs along Z at X=0.

    const dist = Math.abs(pos.x)
    const heightFactor = Math.max(0, 20 - pos.y) / 20 // Fade out as we go up

    // Volume logic: Loudest at X=0
    // Fade out by X=50
    const distFactor = Math.max(0, 1 - dist / 50)

    const vol = -20 - (1 - distFactor * heightFactor) * 40
    const clampedVol = Math.max(-80, vol)

    this.rumble.volume.rampTo(clampedVol, 0.1)
    this.rushNoise.volume.rampTo(clampedVol - 5, 0.1)

    // Panning: If camera is at X=-10, river (X=0) is to the RIGHT (+1)
    // Pan = (RiverX - CamX) / Scale
    const pan = THREE.MathUtils.clamp((0 - pos.x) / 30, -1, 1)
    this.panner.pan.rampTo(pan, 0.1)

    // Bubbles near water
    if (dist < 10 && pos.y < 5 && time - this.lastBubbleTime > 0.1 + Math.random() * 0.5) {
      if (Math.random() > 0.8) {
        this.bubbleSynth.triggerAttackRelease("C2", "32n", time)
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
// Creaking trees
class WoodLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.panner = new Tone.Panner(0).connect(this.output)

    this.synth = new Tone.FMSynth({
      harmonicity: 8,
      modulationIndex: 20,
      detune: 0,
      oscillator: { type: "sawtooth" },
      envelope: { attack: 1, decay: 1, sustain: 1, release: 2 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    }).connect(this.panner)
    this.synth.volume.value = -30

    this.filter = new Tone.Filter(400, "lowpass").connect(this.panner)
    this.synth.disconnect()
    this.synth.connect(this.filter)

    this.lastCreakTime = 0
  }

  update(pos, time) {
    // Only creak in the forest (not too high, not too far)
    if (pos.y > 0 && pos.y < 30) {
        if (time - this.lastCreakTime > 8 + Math.random() * 15) {
            if (Math.random() > 0.6) {
                // Random Pan
                this.panner.pan.value = (Math.random() - 0.5) * 1.5

                const freq = 40 + Math.random() * 20
                const dur = 2 + Math.random() * 3
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

    // High Air (Hiss)
    this.airFilter = new Tone.Filter(5000, "highpass").connect(this.panner)
    this.airNoise = new Tone.Noise("white").connect(this.airFilter)
    this.airNoise.volume.value = -60
    this.airNoise.start()

    // Leaf Rustle (Filtered Pink Noise)
    this.rustleFilter = new Tone.AutoFilter({
        frequency: 2,
        baseFrequency: 4000,
        octaves: 2,
        depth: 0.5
    }).connect(this.panner).start()

    this.rustleNoise = new Tone.Noise("pink").connect(this.rustleFilter)
    this.rustleNoise.volume.value = -60
    this.rustleNoise.start()
  }

  update(pos, time) {
    // Loudest inside canopy (y=15 to 30)
    const distToCanopy = Math.abs(pos.y - 20)
    const vol = THREE.MathUtils.mapLinear(distToCanopy, 0, 20, -25, -60)
    const clampedVol = Math.max(-60, vol)

    this.airNoise.volume.rampTo(clampedVol - 10, 1)
    this.rustleNoise.volume.rampTo(clampedVol, 0.5)

    // Pan based on position (subtle)
    const pan = THREE.MathUtils.clamp(pos.x / 100, -0.5, 0.5)
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
class RainLayer {
  constructor(outputNode) {
    this.output = outputNode
    this.filter = new Tone.Filter(1000, "lowpass").connect(this.output)
    this.noise = new Tone.Noise("pink").connect(this.filter)
    this.noise.volume.value = -60
    this.noise.start()
  }

  update(pos) {
    // Rain is constant background
    this.noise.volume.rampTo(-35, 2)
  }

  dispose() {
    this.noise.dispose()
    this.filter.dispose()
  }
}

// --- Creature Manager ---
class CreatureManager {
  constructor(outputNode) {
    this.output = outputNode

    // 1. Birds (AM/FM Synth)
    this.birdPanner = new Tone.Panner3D(0, 0, 0).connect(this.output)

    // PolySynth for multiple birds? No, single bird logic is simpler for Panner3D
    this.birdSynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.birdPanner)
    this.birdSynth.volume.value = -15

    // 2. Insects
    this.insectFilter = new Tone.Filter(9000, "highpass").connect(this.output)
    this.insectOsc = new Tone.Oscillator(12000, "sawtooth").connect(this.insectFilter).start()
    this.insectLFO = new Tone.LFO(15, -60, -40).connect(this.insectOsc.volume).start() // Buzzing volume

    // 3. Frogs
    this.frogPanner = new Tone.Panner(0).connect(this.output)
    this.frogSynth = new Tone.MembraneSynth({
        pitchDecay: 0.1,
        octaves: 2,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }
    }).connect(this.frogPanner)
    this.frogSynth.volume.value = -18

    this.lastBirdTime = 0
    this.lastFrogTime = 0
  }

  update(pos, time) {
    // Update listener position for Panner3D (Birds)
    Tone.Listener.positionX.value = pos.x
    Tone.Listener.positionY.value = pos.y
    Tone.Listener.positionZ.value = pos.z

    // Birds
    if (time - this.lastBirdTime > 5 + Math.random() * 10) { // 5-15s interval
      if (Math.random() > 0.4) {
        // Random Position around listener
        const angle = Math.random() * Math.PI * 2
        const dist = 10 + Math.random() * 20
        const bx = pos.x + Math.cos(angle) * dist
        const by = Math.max(10, pos.y + (Math.random()-0.5)*10) // Usually above
        const bz = pos.z + Math.sin(angle) * dist

        this.birdPanner.positionX.value = bx
        this.birdPanner.positionY.value = by
        this.birdPanner.positionZ.value = bz

        // Pitch variation
        // Base C6 (approx 1046Hz) +/- variation
        const notes = ["C6", "E6", "G6", "A6", "C7"]
        const note = notes[Math.floor(Math.random() * notes.length)]

        // Play pattern
        const pattern = Math.random()
        if (pattern < 0.3) {
            this.birdSynth.triggerAttackRelease(note, "16n", time)
        } else if (pattern < 0.6) {
             this.birdSynth.triggerAttackRelease(note, "32n", time)
             this.birdSynth.triggerAttackRelease(note, "32n", time + 0.1)
        } else {
             // Slide
             this.birdSynth.triggerAttackRelease(note, "8n", time)
             this.birdSynth.frequency.rampTo(Tone.Frequency(note).transpose(-2), 0.1, time)
        }

        this.lastBirdTime = time
      }
    }

    // Insects (Louder in dense understory)
    const insectVol = (pos.y > 1 && pos.y < 15) ? -20 : -50
    this.insectLFO.max = insectVol
    this.insectLFO.min = insectVol - 10

    // Frogs (Near water)
    if (pos.y < 5) {
        if (time - this.lastFrogTime > 3 + Math.random() * 5) {
            if (Math.random() > 0.6) {
                this.frogPanner.pan.value = (Math.random() - 0.5) * 1.5
                this.frogSynth.triggerAttackRelease("C2", "8n", time)
                this.lastFrogTime = time
            }
        }
    }
  }

  dispose() {
    this.birdSynth.dispose()
    this.birdPanner.dispose()
    this.insectOsc.dispose()
    this.insectFilter.dispose()
    this.insectLFO.dispose()
    this.frogSynth.dispose()
    this.frogPanner.dispose()
  }
}

// --- Ambience Layer ---
class AmbienceLayer {
    constructor(outputNode) {
        this.output = outputNode
        this.padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 2, decay: 3, sustain: 0.6, release: 4 }
        }).connect(this.output)
        this.padSynth.volume.value = -35
        this.lastChordTime = 0
        this.chords = [["C3", "E3", "G3"], ["F3", "A3", "C4"], ["G3", "B3", "D4"], ["A2", "C3", "E3"]]
        this.currentChord = 0
    }

    update(pos, time) {
        if (time - this.lastChordTime > 12) {
             this.padSynth.triggerAttackRelease(this.chords[this.currentChord], "4m", time)
             this.currentChord = (this.currentChord + 1) % this.chords.length
             this.lastChordTime = time
        }
    }

    dispose() {
        this.padSynth.dispose()
    }
}

// --- Main Manager ---
export class SoundscapeManager {
  constructor() {
    this.limiter = new Tone.Limiter(-1).toDestination()
    this.reverb = new Tone.Reverb({ decay: 5, wet: 0.3 }).connect(this.limiter)
    this.reverb.generate()

    this.river = new RiverLayer(this.reverb)
    this.canopy = new CanopyLayer(this.reverb)
    this.wood = new WoodLayer(this.reverb)
    this.rain = new RainLayer(this.reverb)
    this.creatures = new CreatureManager(this.reverb)
    this.ambience = new AmbienceLayer(this.reverb)
    this.wind = new WindLayer(this.reverb)

    // Thunder Synth
    this.thunderSynth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.01, decay: 1.5, sustain: 0 }
    }).connect(this.reverb)
    this.thunderSynth.volume.value = -10

    // Rumble for thunder
    this.thunderRumble = new Tone.MembraneSynth({
        pitchDecay: 0.2,
        octaves: 4
    }).connect(this.reverb)
    this.thunderRumble.volume.value = -5

    Tone.Transport.start()
  }

  update(pos) {
    // Ensure pos is Vector3 (it should be coming from AudioController)
    // If just number (legacy), map to Vector3
    const p = (typeof pos === 'number') ? new THREE.Vector3(0, pos, 0) : pos
    const time = Tone.now()

    this.river.update(p, time)
    this.canopy.update(p, time)
    this.wood.update(p, time)
    this.rain.update(p) // Rain is ubiquitous
    this.creatures.update(p, time)
    this.ambience.update(p, time)
    this.wind.update(p, time)
  }

  triggerThunder(distance) {
    const time = Tone.now()
    // Speed of sound delay: 343 m/s
    const delay = distance / 343
    const arrivalTime = time + delay

    // Low pass filter based on distance (distant thunder is muffled)
    // We can't easily dynamic filter per trigger without new nodes,
    // but we can adjust volume and decay.

    // Volume attenuation
    const vol = Math.max(-40, -10 - (distance / 500) * 30)

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
    this.creatures.dispose()
    this.ambience.dispose()
    this.wind.dispose()
    this.thunderSynth.dispose()
    this.thunderRumble.dispose()
    this.reverb.dispose()
    this.limiter.dispose()
    Tone.Transport.stop()
  }
}
