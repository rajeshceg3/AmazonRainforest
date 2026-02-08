import * as Tone from 'tone'
import * as THREE from 'three'

// --- River Layer ---
// Deep rumble + rushing water + occasional splashes
class RiverLayer {
  constructor(outputNode) {
    this.output = outputNode

    // 1. Low Rumble (Brown Noise)
    this.rumbleFilter = new Tone.Filter(300, "lowpass").connect(this.output)
    this.rumble = new Tone.Noise("brown").connect(this.rumbleFilter)
    this.rumble.volume.value = -60

    // 2. Rushing Water (White Noise + Filter)
    // Dynamic filter to simulate water movement
    this.rushFilter = new Tone.Filter(800, "lowpass").connect(this.output)
    this.rushNoise = new Tone.Noise("pink").connect(this.rushFilter)
    this.rushNoise.volume.value = -60

    // LFO to modulate filter frequency for "movement"
    this.rushLFO = new Tone.LFO(0.2, 600, 1000).connect(this.rushFilter.frequency).start()

    // 3. Splashes (MetalSynth)
    this.splashSynth = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).connect(this.output)
    this.splashSynth.volume.value = -15

    this.rumble.start()
    this.rushNoise.start()

    this.lastSplashTime = 0
  }

  update(y, time) {
    // Volume logic: Loudest at y=0, fades out by y=15
    const vol = THREE.MathUtils.mapLinear(y, 0, 15, -12, -80)
    const clampedVol = Math.max(-80, Math.min(-12, vol))

    this.rumble.volume.rampTo(clampedVol, 0.1)
    this.rushNoise.volume.rampTo(clampedVol - 5, 0.1) // Rush is slightly quieter

    // Trigger splash occasionally if near water
    if (y < 3 && time - this.lastSplashTime > 2 + Math.random() * 5) {
      if (Math.random() > 0.7) {
        // Randomize pitch slightly
        this.splashSynth.frequency.value = 150 + Math.random() * 100
        this.splashSynth.triggerAttackRelease("32n", time)
        this.lastSplashTime = time
      }
    }
  }

  dispose() {
    this.rumble.dispose()
    this.rumbleFilter.dispose()
    this.rushNoise.dispose()
    this.rushFilter.dispose()
    this.rushLFO.dispose()
    this.splashSynth.dispose()
  }
}

// --- Canopy Layer ---
// Wind (Pink Noise + AutoFilter) + "Air" presence
class CanopyLayer {
  constructor(outputNode) {
    this.output = outputNode

    // 1. Wind Gusts
    // AutoFilter creates a sweeping effect
    this.windFilter = new Tone.AutoFilter({
      frequency: 0.1,
      baseFrequency: 200,
      octaves: 4,
      type: "sine",
      depth: 0.8
    }).connect(this.output).start()

    this.windNoise = new Tone.Noise("pink").connect(this.windFilter)
    this.windNoise.volume.value = -60
    this.windNoise.start()

    // 2. High Air (Hiss)
    this.airFilter = new Tone.Filter(4000, "highpass").connect(this.output)
    this.airNoise = new Tone.Noise("white").connect(this.airFilter)
    this.airNoise.volume.value = -60
    this.airNoise.start()
  }

  update(y) {
    // Volume logic: Loudest at y=25, fades out by y=5
    const vol = THREE.MathUtils.mapLinear(y, 5, 25, -60, -18)
    const clampedVol = Math.max(-60, Math.min(-18, vol))

    this.windNoise.volume.rampTo(clampedVol, 0.1)
    this.airNoise.volume.rampTo(clampedVol - 10, 0.1) // Air is subtle

    // Wind gets faster/more intense higher up
    const windSpeed = THREE.MathUtils.mapLinear(y, 5, 30, 0.05, 0.2)
    this.windFilter.frequency.rampTo(Math.max(0.05, Math.min(0.3, windSpeed)), 1)
  }

  dispose() {
    this.windNoise.dispose()
    this.windFilter.dispose()
    this.airNoise.dispose()
    this.airFilter.dispose()
  }
}

// --- Rain Layer ---
// Constant subtle rain texture
class RainLayer {
  constructor(outputNode) {
    this.output = outputNode

    this.filter = new Tone.Filter(1000, "lowpass").connect(this.output)
    this.noise = new Tone.Noise("pink").connect(this.filter)
    this.noise.volume.value = -60
    this.noise.start()
  }

  update() {
    // Rain is everywhere but sounds different at different heights?
    // For now, consistent background layer
    this.noise.volume.rampTo(-35, 2)
  }

  dispose() {
    this.noise.dispose()
    this.filter.dispose()
  }
}


// --- Creature Manager ---
// Birds, Insects, Frogs
class CreatureManager {
  constructor(outputNode) {
    this.output = outputNode

    // 1. Birds (FM Synth)
    // Using Panner for spatialization
    this.birdPanner = new Tone.Panner3D(0, 0, 0).connect(this.output)
    this.birdSynth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 10,
      detune: 0,
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.birdPanner)
    this.birdSynth.volume.value = -10

    // 2. Insects (High Frequency Drone/Pulse)
    this.insectFilter = new Tone.Filter(8000, "highpass").connect(this.output)
    // Using multiple oscillators for texture
    this.insectOsc1 = new Tone.Oscillator(12000, "sawtooth").connect(this.insectFilter).start()
    this.insectOsc2 = new Tone.Oscillator(13000, "sine").connect(this.insectFilter).start()

    // Tremolo for buzzing
    this.insectTremolo = new Tone.Tremolo(15, 0.7).connect(this.insectFilter).start()

    this.insectOsc1.volume.value = -60
    this.insectOsc2.volume.value = -60

    // 3. Frogs (Low FM)
    this.frogSynth = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 15,
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.1, release: 0.5 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.output)
    this.frogSynth.volume.value = -12

    this.lastBirdTime = 0
    this.lastFrogTime = 0
  }

  update(y, time) {
    // Insects: Loudest in mid-levels (Understory: 2-15)
    const insectVol = (y > 2 && y < 20) ? -28 : -60
    this.insectOsc1.volume.rampTo(insectVol, 0.5)
    this.insectOsc2.volume.rampTo(insectVol - 5, 0.5)

    // Birds: Mostly Canopy (y > 10)
    if (y > 8 && time - this.lastBirdTime > 3 + Math.random() * 4) {
      if (Math.random() > 0.5) {
        // Random Position
        this.birdPanner.positionX.value = (Math.random() - 0.5) * 20
        this.birdPanner.positionY.value = 10 + Math.random() * 10
        this.birdPanner.positionZ.value = (Math.random() - 0.5) * 20

        // Random Call
        const freq = 600 + Math.random() * 1200
        this.birdSynth.harmonicity.value = 1 + Math.random() * 4
        this.birdSynth.triggerAttackRelease(freq, "16n", time)
        this.lastBirdTime = time
      }
    }

    // Frogs: River (y < 4)
    if (y < 4 && time - this.lastFrogTime > 4 + Math.random() * 6) {
       if (Math.random() > 0.6) {
         const freq = 100 + Math.random() * 50
         this.frogSynth.triggerAttackRelease(freq, "8n", time)
         this.lastFrogTime = time
       }
    }
  }

  dispose() {
    this.birdSynth.dispose()
    this.birdPanner.dispose()
    this.insectOsc1.dispose()
    this.insectOsc2.dispose()
    this.insectFilter.dispose()
    this.insectTremolo.dispose()
    this.frogSynth.dispose()
  }
}

// --- Main Manager ---
export class SoundscapeManager {
  constructor() {
    console.log("Initializing Soundscape Manager")

    // Master Output with Limiter
    this.limiter = new Tone.Limiter(-1).toDestination()

    // Global Reverb (Convolver for realism would be better, but Reverb is lighter)
    // We'll use a long decay for the "forest echo"
    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.3,
      preDelay: 0.05
    }).connect(this.limiter)
    this.reverb.generate() // Important!

    // Layers connect to Reverb
    this.river = new RiverLayer(this.reverb)
    this.canopy = new CanopyLayer(this.reverb)
    this.rain = new RainLayer(this.reverb)
    this.creatures = new CreatureManager(this.reverb)

    // Transport helps with timing if needed, but we rely on update(time) mostly
    Tone.Transport.start()
  }

  update(y) {
    const time = Tone.now()

    this.river.update(y, time)
    this.canopy.update(y, time)
    this.rain.update(y, time)
    this.creatures.update(y, time)

    // Adjust Reverb Mix based on location?
    // More reverb in canopy (open), less in understory (dense)?
    // Or more reverb in river (reflections)?
    // Let's keep it simple for now, maybe slight adjustment
    const reverbWet = THREE.MathUtils.mapLinear(y, 0, 30, 0.4, 0.2) // Wetter at bottom
    this.reverb.wet.rampTo(reverbWet, 0.5)
  }

  dispose() {
    this.river.dispose()
    this.canopy.dispose()
    this.rain.dispose()
    this.creatures.dispose()
    this.reverb.dispose()
    this.limiter.dispose()
    Tone.Transport.stop()
  }
}
