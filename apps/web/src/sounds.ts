let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let muted = false

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.5
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function g() { return masterGain! }

function osc(type: OscillatorType, freq: number, start: number, dur: number, vol = 0.3) {
  const c = getCtx()
  const o = c.createOscillator()
  const env = c.createGain()
  o.type = type
  o.frequency.value = freq
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(vol, start + 0.02)
  env.gain.exponentialRampToValueAtTime(0.001, start + dur)
  o.connect(env)
  env.connect(g())
  o.start(start)
  o.stop(start + dur)
}

function noise(start: number, dur: number, vol = 0.1) {
  const c = getCtx()
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const env = c.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(vol, start + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, start + dur)
  src.connect(env)
  env.connect(g())
  src.start(start)
  src.stop(start + dur)
}

const audioCtx = {
  getCtx,
  muted() { return muted },
  setMuted(v: boolean) { muted = v },
}

export function setMuted(v: boolean) { muted = v }
export function isMuted() { return muted }

export function playTheme() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => {
    osc('sawtooth', f / 2, now + i * 0.15, 0.8, 0.08)
    osc('triangle', f, now + i * 0.15, 0.6, 0.12)
    osc('sine', f * 2, now + i * 0.15, 0.4, 0.06)
  })
  osc('sine', 65.41, now, 1.2, 0.15)
  noise(now, 0.3, 0.05)
}

export function playStartGame() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  const hits = [196, 261.63, 329.63, 392, 523.25]
  hits.forEach((f, i) => {
    osc('square', f, now + i * 0.12, 0.3, 0.1)
    osc('sine', f * 2, now + i * 0.12, 0.2, 0.05)
  })
  osc('sine', 130.81, now, 1.0, 0.2)
  noise(now, 0.2, 0.08)
}

export function playQuestionAppear() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  osc('sine', 440, now, 1.0, 0.08)
  osc('sine', 880, now + 0.1, 0.8, 0.06)
  osc('sine', 660, now + 0.2, 0.6, 0.04)
  osc('sine', 1320, now + 0.15, 0.5, 0.03)
  noise(now, 0.4, 0.04)
}

export function playAnswerSelect() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  osc('sine', 600, now, 0.08, 0.15)
  osc('sine', 800, now + 0.04, 0.06, 0.1)
}

export function playFinalAnswer() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  osc('square', 196, now, 0.3, 0.15)
  osc('sine', 392, now + 0.05, 0.25, 0.1)
  osc('sine', 784, now + 0.1, 0.2, 0.06)
  noise(now, 0.15, 0.06)
}

export function playCorrect() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  const dings = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]
  dings.forEach((f, i) => {
    osc('sine', f, now + i * 0.12, 0.5, 0.15)
    osc('triangle', f * 0.5, now + i * 0.12, 0.5, 0.08)
    osc('sine', f * 2, now + i * 0.12, 0.3, 0.04)
  })
  osc('sine', 130.81, now, 1.0, 0.12)
  noise(now, 0.2, 0.04)
}

export function playWrong() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  const buzzes = [392, 349.23, 329.63, 293.66, 261.63, 196]
  buzzes.forEach((f, i) => {
    osc('sawtooth', f, now + i * 0.1, 0.25, 0.1)
    osc('square', f / 2, now + i * 0.1, 0.25, 0.06)
  })
  noise(now, 0.8, 0.1)
}

export function playWalkAway() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  const notes = [1046.5, 783.99, 659.25, 523.25]
  notes.forEach((f, i) => {
    osc('sine', f, now + i * 0.2, 0.4, 0.1)
    osc('triangle', f / 2, now + i * 0.2, 0.4, 0.05)
  })
}

export function playLevelUp() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  osc('sine', 523.25, now, 0.15, 0.12)
  osc('sine', 659.25, now + 0.08, 0.15, 0.12)
  osc('sine', 783.99, now + 0.16, 0.2, 0.15)
}

export function playSafeHaven() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  const fan = [392, 523.25, 659.25, 784, 1046.5]
  fan.forEach((f, i) => {
    osc('sine', f, now + i * 0.1, 0.4, 0.12)
    osc('triangle', f / 2, now + i * 0.1, 0.4, 0.06)
  })
  noise(now, 0.20, 0.08)
  noise(now + 0.6, 0.3, 0.12)
}

export function playTimerTick() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  osc('sine', 1000, now, 0.04, 0.06)
}

export function playMillionWin() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1568]
  melody.forEach((f, i) => {
    osc('sine', f, now + i * 0.15, 0.5, 0.15)
    osc('triangle', f / 2, now + i * 0.15, 0.5, 0.1)
    osc('sine', f * 2, now + i * 0.15, 0.3, 0.05)
  })
  osc('sawtooth', 65.41, now, 2.5, 0.08)
  noise(now, 0.15, 0.06)
  noise(now + 1.2, 0.15, 0.06)
  noise(now + 2.4, 0.5, 0.15)
}

export function play5050() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  osc('sine', 440, now, 0.06, 0.1)
  osc('sine', 220, now + 0.05, 0.06, 0.1)
  noise(now, 0.15, 0.08)
}

export function playPhoneFriend() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  for (let i = 0; i < 3; i++) {
    osc('sine', 440, now + i * 0.3, 0.15, 0.08)
    osc('sine', 500, now + i * 0.3 + 0.15, 0.15, 0.08)
  }
  noise(now, 0.05, 0.04)
}

export function playAudience() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  noise(now, 0.3, 0.15)
  noise(now + 0.3, 0.6, 0.08)
}

export function playApplause() {
  if (muted) return
  const c = getCtx()
  const now = c.currentTime
  noise(now, 1.5, 0.2)
  noise(now + 0.5, 1.0, 0.15)
  noise(now + 1.0, 0.5, 0.1)
}
