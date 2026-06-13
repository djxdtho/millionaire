import type { Question } from './questions'

export interface LifelineState {
  fiftyFifty: boolean
  phoneAFriend: boolean
  askTheAudience: boolean
}

export interface AudienceResult {
  votes: number[]
}

export function createLifelines(): LifelineState {
  return { fiftyFifty: true, phoneAFriend: true, askTheAudience: true }
}

export function useFiftyFifty(question: Question): number[] {
  const wrongIndices = question.answers
    .map((_, i) => i)
    .filter(i => i !== question.correctIndex)
  const shuffle = [...wrongIndices].sort(() => Math.random() - 0.5)
  const removed = shuffle.slice(0, 2)
  return removed
}

export function usePhoneAFriend(question: Question): string {
  const roll = Math.random()
  if (roll < 0.7) {
    return question.answers[question.correctIndex]
  }
  const wrong = question.answers
    .map((a, i) => ({ a, i }))
    .filter(x => x.i !== question.correctIndex)
  const picked = wrong[Math.floor(Math.random() * wrong.length)]
  return picked.a
}

export function useAskTheAudience(question: Question): AudienceResult {
  const correctChance = 0.5 + Math.random() * 0.3
  const votes = question.answers.map((_, i) => {
    if (i === question.correctIndex) {
      return Math.round(correctChance * 100)
    }
    return Math.round((1 - correctChance) / (question.answers.length - 1) * 100)
  })
  const remaining = 100 - votes.reduce((a, b) => a + b, 0)
  votes[question.correctIndex] += remaining
  const correctVotes = votes[question.correctIndex]
  const others = votes.map((v, i) => i !== question.correctIndex ? v : 0)
  const shuffleOthers = others.sort(() => Math.random() - 0.5)
  const shuffled = votes.map((_, i) => {
    if (i === question.correctIndex) return correctVotes
    return shuffleOthers[i < question.correctIndex ? i : i - 1] ?? 0
  })
  return { votes: shuffled }
}
