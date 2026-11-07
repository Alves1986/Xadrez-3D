// =========================================================================
// Wizard Chess Cathedral Audio Engine (Web Audio Procedural Synthesis)
// Real-time stone friction, melee collisions, shattering, and cathedral acoustics
// =========================================================================

let audioCtx = null;
let masterGain = null;
let cathedralReverb = null;
let reverbGain = null;
let directGain = null;
let isMuted = false;
let isInitialized = false;

// Audio listeners for UI sync
const listeners = new Set();

export function isAudioMuted() {
  return isMuted;
}

export function subscribeAudioState(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notifyListeners() {
  for (const fn of listeners) {
    try {
      fn(!isMuted);
    } catch (e) {
      console.warn('Audio listener error:', e);
    }
  }
}

// Generate realistic impulse response simulating a cavernous stone cathedral
function createCathedralImpulseResponse(ctx, duration = 2.5, decay = 2.4) {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  // Early stone reflections (nave, side aisles, vaulted ceilings)
  const reflections = [
    { time: 0.022, gainL: 0.75, gainR: 0.65 },
    { time: 0.046, gainL: 0.55, gainR: 0.68 },
    { time: 0.075, gainL: 0.45, gainR: 0.38 },
    { time: 0.112, gainL: 0.38, gainR: 0.42 },
    { time: 0.158, gainL: 0.30, gainR: 0.28 },
    { time: 0.215, gainL: 0.22, gainR: 0.25 },
  ];

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Exponential cathedral decay
    const env = Math.exp(-t * decay);
    // High-frequency absorption by massive stone and cavernous space
    const stoneAbsorption = Math.exp(-t * 4.2);
    const noiseL = (Math.random() * 2 - 1) * env * (0.35 + 0.65 * stoneAbsorption);
    const noiseR = (Math.random() * 2 - 1) * env * (0.35 + 0.65 * stoneAbsorption);

    left[i] = noiseL;
    right[i] = noiseR;
  }

  for (const r of reflections) {
    const idx = Math.floor(r.time * sampleRate);
    if (idx < length) {
      left[idx] += r.gainL * 0.45;
      right[idx] += r.gainR * 0.45;
    }
  }

  return impulse;
}

export function initAudioEngine() {
  if (isInitialized && audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    audioCtx = new AudioContextClass();

    // Check stored mute preference
    try {
      const stored = localStorage.getItem('wizard_chess_sound_enabled');
      if (stored !== null) {
        isMuted = stored === 'false';
      }
    } catch (e) {}

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(isMuted ? 0 : 0.85, audioCtx.currentTime);

    // Direct dry signal
    directGain = audioCtx.createGain();
    directGain.gain.setValueAtTime(0.78, audioCtx.currentTime);

    // Cathedral Convolver Reverb
    cathedralReverb = audioCtx.createConvolver();
    try {
      cathedralReverb.buffer = createCathedralImpulseResponse(audioCtx);
    } catch (e) {
      console.warn('Could not build convolution impulse:', e);
    }

    reverbGain = audioCtx.createGain();
    reverbGain.gain.setValueAtTime(0.42, audioCtx.currentTime);

    // Route: direct -> master, reverb -> master -> destination
    directGain.connect(masterGain);
    cathedralReverb.connect(reverbGain);
    reverbGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    isInitialized = true;
    notifyListeners();
  } catch (err) {
    console.warn('AudioContext init error:', err);
  }

  return audioCtx;
}

// User interaction resume trigger
function ensureContext() {
  if (!audioCtx) {
    initAudioEngine();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleAudioMute(forceState) {
  ensureContext();
  if (typeof forceState === 'boolean') {
    isMuted = !forceState;
  } else {
    isMuted = !isMuted;
  }

  try {
    localStorage.setItem('wizard_chess_sound_enabled', String(!isMuted));
  } catch (e) {}

  if (masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.85, now, 0.03);
  }

  notifyListeners();
  return !isMuted;
}

// Helper: generate brown/pink noise buffer for stone friction
function createNoiseBuffer(ctx, duration = 1.0) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Brown noise approximation (integrated white noise) for stone low-end grit
    lastOut = (lastOut + 0.025 * white) / 1.025;
    data[i] = lastOut * 3.5 + white * 0.15;
  }
  return buffer;
}

// =========================================================================
// Sound Effect 1: Heavy Stone Friction / Slide across Cathedral Altar
// =========================================================================
export function playStoneSlide(duration = 0.8, isVault = false) {
  const ctx = ensureContext();
  if (!ctx || isMuted) return null;

  try {
    const now = ctx.currentTime;
    const dur = Math.max(0.25, duration);

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, dur + 0.2);

    // Multi-stage filtering to sculpt heavy granite scraping sound
    const bandpass1 = ctx.createBiquadFilter();
    bandpass1.type = 'bandpass';
    bandpass1.frequency.setValueAtTime(isVault ? 380 : 260, now);
    bandpass1.Q.setValueAtTime(2.2, now);

    const bandpass2 = ctx.createBiquadFilter();
    bandpass2.type = 'peaking';
    bandpass2.frequency.setValueAtTime(680, now);
    bandpass2.Q.setValueAtTime(1.5, now);
    bandpass2.gain.setValueAtTime(6, now);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(110, now);

    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.0001, now);

    if (isVault) {
      // Knight vault: scrape liftoff, silence mid-air, landing contact
      slideGain.gain.exponentialRampToValueAtTime(0.24, now + 0.06);
      slideGain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.35);
    } else {
      // Linear slide: ramp up, steady heavy stone grit, ramp down upon arrival
      slideGain.gain.exponentialRampToValueAtTime(0.26, now + 0.08);
      slideGain.gain.setValueAtTime(0.26, now + dur * 0.72);
      slideGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    }

    noise.connect(bandpass1);
    bandpass1.connect(bandpass2);
    bandpass2.connect(highpass);
    highpass.connect(slideGain);

    slideGain.connect(directGain);
    slideGain.connect(cathedralReverb);

    noise.start(now);
    noise.stop(now + dur + 0.05);

    return noise;
  } catch (e) {
    console.warn('Audio slide error:', e);
    return null;
  }
}

// =========================================================================
// Sound Effect 2: Solid Stone Thud / Pedestal Placement Knock
// =========================================================================
export function playStoneThud(intensity = 1.0, pitchShift = 1.0) {
  const ctx = ensureContext();
  if (!ctx || isMuted) return;

  try {
    const now = ctx.currentTime;
    const vol = Math.min(1.0, Math.max(0.1, intensity));

    // Sub-bass stone body mass drop (120Hz -> 48Hz)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130 * pitchShift, now);
    osc.frequency.exponentialRampToValueAtTime(45 * pitchShift, now + 0.12);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.55 * vol, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(oscGain);
    oscGain.connect(directGain);
    oscGain.connect(cathedralReverb);

    // Stone contact click / chisel transient
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.08);

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(820 * pitchShift, now);
    clickFilter.Q.setValueAtTime(3.2, now);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.42 * vol, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    noise.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(directGain);
    clickGain.connect(cathedralReverb);

    osc.start(now);
    osc.stop(now + 0.25);
    noise.start(now);
    noise.stop(now + 0.08);
  } catch (e) {
    console.warn('Audio thud error:', e);
  }
}

// =========================================================================
// Sound Effect 3: Violent Melee Strike / Weapon Impact Clash
// =========================================================================
export function playMeleeClash(attackerType = 'queen') {
  const ctx = ensureContext();
  if (!ctx || isMuted) return;

  try {
    const now = ctx.currentTime;

    // 1. Heavy physical stone blow impact (deep punch)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(190, now);
    subOsc.frequency.exponentialRampToValueAtTime(52, now + 0.16);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.85, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    subOsc.connect(subGain);
    subGain.connect(directGain);
    subGain.connect(cathedralReverb);

    // 2. Chisel / weapon impact crack
    const crackNoise = ctx.createBufferSource();
    crackNoise.buffer = createNoiseBuffer(ctx, 0.12);

    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(1250, now);
    crackFilter.Q.setValueAtTime(2.8, now);

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.70, now);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    crackNoise.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(directGain);
    crackGain.connect(cathedralReverb);

    // 3. Resonant metallic / stone armor ring
    const ringOsc = ctx.createOscillator();
    ringOsc.type = 'triangle';
    const baseFreq = attackerType === 'knight' ? 1420 : (attackerType === 'rook' ? 780 : 1100);
    ringOsc.frequency.setValueAtTime(baseFreq, now);

    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.28, now);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    ringOsc.connect(ringGain);
    ringGain.connect(cathedralReverb);

    subOsc.start(now);
    subOsc.stop(now + 0.30);
    crackNoise.start(now);
    crackNoise.stop(now + 0.12);
    ringOsc.start(now);
    ringOsc.stop(now + 0.38);
  } catch (e) {
    console.warn('Audio clash error:', e);
  }
}

// =========================================================================
// Sound Effect 4: Cataclysmic Stone Shatter & 32-Shard Debris Explosion
// =========================================================================
export function playStoneShatter() {
  const ctx = ensureContext();
  if (!ctx || isMuted) return;

  try {
    const now = ctx.currentTime;

    // Layer 1: Massive explosive stone rupture boom
    const boomOsc = ctx.createOscillator();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(125, now);
    boomOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(0.95, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    boomOsc.connect(boomGain);
    boomGain.connect(directGain);
    boomGain.connect(cathedralReverb);

    // Layer 2: Fracturing rock crunch & blast
    const blastNoise = ctx.createBufferSource();
    blastNoise.buffer = createNoiseBuffer(ctx, 0.40);

    const blastFilter = ctx.createBiquadFilter();
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(1600, now);
    blastFilter.frequency.exponentialRampToValueAtTime(250, now + 0.35);

    const blastGain = ctx.createGain();
    blastGain.gain.setValueAtTime(0.85, now);
    blastGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    blastNoise.connect(blastFilter);
    blastFilter.connect(blastGain);
    blastGain.connect(directGain);
    blastGain.connect(cathedralReverb);

    boomOsc.start(now);
    boomOsc.stop(now + 0.60);
    blastNoise.start(now);
    blastNoise.stop(now + 0.45);

    // Layer 3: Secondary cascading debris clatter (random stone shards tumbling on marble)
    const shardCount = 8;
    for (let i = 0; i < shardCount; i++) {
      const delay = 0.06 + Math.random() * 0.38;
      const shardTime = now + delay;
      const shardOsc = ctx.createOscillator();
      shardOsc.type = 'triangle';
      shardOsc.frequency.setValueAtTime(450 + Math.random() * 850, shardTime);

      const shardGain = ctx.createGain();
      shardGain.gain.setValueAtTime(0.18 * (1 - delay / 0.5), shardTime);
      shardGain.gain.exponentialRampToValueAtTime(0.0001, shardTime + 0.05);

      shardOsc.connect(shardGain);
      shardGain.connect(directGain);
      shardGain.connect(cathedralReverb);

      shardOsc.start(shardTime);
      shardOsc.stop(shardTime + 0.06);
    }
  } catch (e) {
    console.warn('Audio shatter error:', e);
  }
}

// =========================================================================
// Sound Effect 5: Monumental King Fall-Over Crash & Cathedral Bell
// =========================================================================
export function playKingFall() {
  const ctx = ensureContext();
  if (!ctx || isMuted) return;

  try {
    const now = ctx.currentTime;

    // Royal monument ground collision boom
    const groundOsc = ctx.createOscillator();
    groundOsc.type = 'triangle';
    groundOsc.frequency.setValueAtTime(95, now);
    groundOsc.frequency.exponentialRampToValueAtTime(28, now + 0.75);

    const groundGain = ctx.createGain();
    groundGain.gain.setValueAtTime(1.0, now);
    groundGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.90);

    groundOsc.connect(groundGain);
    groundGain.connect(directGain);
    groundGain.connect(cathedralReverb);

    // Crown shard dispersion crackle
    const crownNoise = ctx.createBufferSource();
    crownNoise.buffer = createNoiseBuffer(ctx, 0.55);

    const crownFilter = ctx.createBiquadFilter();
    crownFilter.type = 'bandpass';
    crownFilter.frequency.setValueAtTime(1100, now);
    crownFilter.Q.setValueAtTime(1.8, now);

    const crownGain = ctx.createGain();
    crownGain.gain.setValueAtTime(0.65, now);
    crownGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    crownNoise.connect(crownFilter);
    crownFilter.connect(crownGain);
    crownGain.connect(directGain);
    crownGain.connect(cathedralReverb);

    groundOsc.start(now);
    groundOsc.stop(now + 1.0);
    crownNoise.start(now);
    crownNoise.stop(now + 0.55);

    // Solemn Cathedral Bell partials marking the fall of the King
    const bellPartials = [
      { f: 220, g: 0.35, d: 2.2 },
      { f: 440, g: 0.28, d: 1.8 },
      { f: 660, g: 0.20, d: 1.4 },
      { f: 880, g: 0.14, d: 1.0 },
    ];

    for (const p of bellPartials) {
      const bOsc = ctx.createOscillator();
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(p.f, now + 0.05);

      const bGain = ctx.createGain();
      bGain.gain.setValueAtTime(p.g, now + 0.05);
      bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + p.d);

      bOsc.connect(bGain);
      bGain.connect(cathedralReverb);

      bOsc.start(now + 0.05);
      bOsc.stop(now + 0.05 + p.d);
    }
  } catch (e) {
    console.warn('Audio king fall error:', e);
  }
}

// =========================================================================
// Sound Effect 6: Check Alert Cathedral Bell Chime
// =========================================================================
export function playCheckAlert() {
  const ctx = ensureContext();
  if (!ctx || isMuted) return;

  try {
    const now = ctx.currentTime;
    const partials = [330, 495, 660, 990];

    for (let i = 0; i < partials.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(partials[i], now);

      const gain = ctx.createGain();
      const vol = 0.22 / (i + 1);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      gain.connect(cathedralReverb);

      osc.start(now);
      osc.stop(now + 1.5);
    }
  } catch (e) {
    console.warn('Audio check alert error:', e);
  }
}

// =========================================================================
// Sound Effect 7: Tactical Stone Piece Tap / Square Select Click
// =========================================================================
export function playPieceSelect() {
  const ctx = ensureContext();
  if (!ctx || isMuted) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.20, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(directGain);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    console.warn('Audio select error:', e);
  }
}
