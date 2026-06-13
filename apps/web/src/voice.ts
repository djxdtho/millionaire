import { isMuted } from './sounds'

let synth: SpeechSynthesis | null = null
let queue: SpeechSynthesisUtterance[] = []
let speaking = false

function getSynth(): SpeechSynthesis {
  if (!synth) synth = window.speechSynthesis
  return synth
}

function speak(text: string, priority = false) {
  if (isMuted()) return
  const s = getSynth()
  s.cancel()
  queue = []
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.92
  u.pitch = 1.05
  u.volume = 1
  const voices = s.getVoices()
  const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
    ?? voices.find(v => v.lang.startsWith('en'))
  if (preferred) u.voice = preferred
  s.speak(u)
}

export function speakIntro(username?: string) {
  const name = username ? `our contestant, ${username}` : 'today\'s contestant'
  speak(`Welcome to Who Wants to Be a Millionaire! Let\'s meet ${name}!`)
}

export function speakQuestion(question: string, answers: string[]) {
  const letters = ['A', 'B', 'C', 'D']
  const text = `${question} ${answers.map((a, i) => `${letters[i]}: ${a}`).join('. ')}`
  speak(text)
}

export function speakQuestionAsync(question: string, answers: string[]): Promise<void> {
  return new Promise(resolve => {
    if (isMuted()) { resolve(); return }
    const s = getSynth()
    s.cancel()
    const letters = ['A', 'B', 'C', 'D']
    const text = `${question} ${answers.map((a, i) => `${letters[i]}: ${a}`).join('. ')}`
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.92
    u.pitch = 1.05
    u.volume = 1
    const voices = s.getVoices()
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
      ?? voices.find(v => v.lang.startsWith('en'))
    if (preferred) u.voice = preferred
    u.onend = () => resolve()
    u.onerror = () => resolve()
    s.speak(u)
  })
}

export function speakCorrect(amount: string) {
  speak(`Correct! You have won ${amount}!`)
}

export function speakWrong(finalAmount: string) {
  speak(`I'm sorry, that's incorrect. You leave with ${finalAmount}.`)
}

export function speakWalkAway(amount: string) {
  speak(`You are walking away with ${amount}. A wise decision!`)
}

export function speakMillionWin() {
  speak('Congratulations! You have won one million dollars! You are a millionaire!')
}

export function speakGameOver(level: number, amount: string, won: boolean) {
  if (won) return
  speak(`Game over. You reached question ${level} and won ${amount}.`)
}

export function speakSafeHaven(amount: string) {
  speak(`You are now guaranteed ${amount}!`)
}
