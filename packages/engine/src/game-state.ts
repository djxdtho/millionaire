import type { Question } from './questions'
import { getPrize, getGuaranteedAmount } from './prize-ladder'
import { createLifelines, useFiftyFifty, usePhoneAFriend, useAskTheAudience } from './lifelines'
import type { LifelineState, AudienceResult } from './lifelines'

export type GamePhase =
  | 'hot-seat'
  | 'question'
  | 'answer-reveal'
  | 'walk-away'
  | 'game-over'

export interface GameResult {
  finalLevel: number
  moneyWon: number
  questionsAnswered: number
  won: boolean
}

export class GameState {
  questions: Question[]
  currentLevel: number
  lifelines: LifelineState
  phase: GamePhase
  result: GameResult | null
  removedAnswers: number[]
  audienceResult: AudienceResult | null
  friendAnswer: string | null
  walkAwayOffer: number
  answeredCorrectly: number

  constructor(questions: Question[], level = 1, lifelines?: LifelineState) {
    this.questions = questions
    this.currentLevel = level
    this.lifelines = lifelines ?? createLifelines()
    this.phase = 'hot-seat'
    this.result = null
    this.removedAnswers = []
    this.audienceResult = null
    this.friendAnswer = null
    this.answeredCorrectly = 0
    this.walkAwayOffer = 0
  }

  get currentQuestion(): Question | null {
    if (this.currentLevel < 1 || this.currentLevel > 15) return null
    return this.questions[this.currentLevel - 1] ?? null
  }

  get prize() {
    return getPrize(this.currentLevel)
  }

  get guaranteedAmount(): number {
    return getGuaranteedAmount(this.currentLevel)
  }

  startGame() {
    this.phase = 'question'
    this.currentLevel = 1
    this.answeredCorrectly = 0
  }

  submitAnswer(index: number): boolean {
    const q = this.currentQuestion
    if (!q || this.phase !== 'question') return false

    const correct = index === q.correctIndex
    this.phase = 'answer-reveal'

    if (correct) {
      this.answeredCorrectly++
    }

    return correct
  }

  nextQuestion() {
    this.removedAnswers = []
    this.audienceResult = null
    this.friendAnswer = null

    if (this.currentLevel >= 15) {
      this.phase = 'game-over'
      this.result = {
        finalLevel: 15,
        moneyWon: 1_000_000,
        questionsAnswered: 15,
        won: true,
      }
      return
    }

    this.currentLevel++
    this.phase = 'question'
  }

  walkAway(): GameResult {
    const money = this.currentLevel <= 1
      ? 0
      : getPrize(this.currentLevel - 1)?.amount ?? 0

    this.phase = 'game-over'
    this.result = {
      finalLevel: this.currentLevel,
      moneyWon: money,
      questionsAnswered: this.answeredCorrectly,
      won: false,
    }
    return this.result
  }

  timeOut(): GameResult {
    const money = this.guaranteedAmount
    this.phase = 'game-over'
    this.result = {
      finalLevel: this.currentLevel,
      moneyWon: money,
      questionsAnswered: this.answeredCorrectly,
      won: false,
    }
    return this.result
  }

  wrongAnswer(): GameResult {
    const money = this.guaranteedAmount
    this.phase = 'game-over'
    this.result = {
      finalLevel: this.currentLevel,
      moneyWon: money,
      questionsAnswered: this.answeredCorrectly,
      won: false,
    }
    return this.result
  }

  useFiftyFifty() {
    if (!this.lifelines.fiftyFifty) return
    const q = this.currentQuestion
    if (!q) return
    this.lifelines.fiftyFifty = false
    this.removedAnswers = useFiftyFifty(q)
  }

  usePhoneAFriend() {
    if (!this.lifelines.phoneAFriend) return
    const q = this.currentQuestion
    if (!q) return
    this.lifelines.phoneAFriend = false
    this.friendAnswer = usePhoneAFriend(q)
  }

  useAskTheAudience() {
    if (!this.lifelines.askTheAudience) return
    const q = this.currentQuestion
    if (!q) return
    this.lifelines.askTheAudience = false
    this.audienceResult = useAskTheAudience(q)
  }
}
