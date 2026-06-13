import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameState, getQuestionsForGame, PRIZE_LADDER } from '@millionaire/engine'
import type { Question, AudienceResult } from '@millionaire/engine'
import { saveScore } from '../api'
import { useAuth } from '../store'
import * as S from '../sounds'
import * as V from '../voice'
import Confetti from '../components/Confetti'

const TIMER_SECONDS = 30
const FF_TIMER_SECONDS = 10
const LETTERS = ['A', 'B', 'C', 'D']
const STORAGE_KEY = 'millionaire_save'

interface SavedState {
  questions: Question[]
  currentLevel: number
  fiftyFifty: boolean
  phoneAFriend: boolean
  askTheAudience: boolean
}

function loadSave(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function clearSave() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function GamePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [game, setGame] = useState<GameState | null>(null)
  const [phase, setPhase] = useState<'hot-seat' | 'ff-question' | 'question' | 'locking-in' | 'answer-reveal' | 'game-over'>('hot-seat')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [revealedCorrect, setRevealedCorrect] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [showFriend, setShowFriend] = useState<string | null>(null)
  const [audienceResult, setAudienceResult] = useState<AudienceResult | null>(null)
  const [removedAnswers, setRemovedAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isFF, setIsFF] = useState(false)
  const [ffAnswer, setFfAnswer] = useState<number | null>(null)
  const [ffRevealed, setFfRevealed] = useState(false)
  const [resumeGame, setResumeGame] = useState<SavedState | null>(loadSave())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentQuestion = game?.currentQuestion ?? null
  const currentLevel = game?.currentLevel ?? 1
  const lifelines = game?.lifelines ?? { fiftyFifty: false, phoneAFriend: false, askTheAudience: false }

  const timerCircleR = 54
  const timerCircumference = 2 * Math.PI * timerCircleR
  const timerMax = isFF ? FF_TIMER_SECONDS : TIMER_SECONDS
  const timerOffset = timerCircumference * (1 - timeLeft / timerMax)

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  function startTimer() {
    clearTimer()
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        if (prev <= 11) S.playTimerTick()
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (phase !== 'question' && phase !== 'ff-question') clearTimer()
    return clearTimer
  }, [phase, clearTimer])

  useEffect(() => {
    if (timeLeft === 0 && (phase === 'question' || phase === 'ff-question') && game) {
      if (phase === 'ff-question' || isFF) handleFFTimeOut()
      else handleTimeOut()
    }
  }, [timeLeft])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (phase === 'question') {
        if (e.key >= '1' && e.key <= '4') {
          const i = parseInt(e.key) - 1
          if (!removedAnswers.includes(i)) handleAnswer(i)
        }
        if (e.key === 'l' || e.key === 'L') {
          if (lifelines.fiftyFifty && selectedAnswer === null) use5050()
          else if (lifelines.phoneAFriend && selectedAnswer === null) usePhoneFriend()
          else if (lifelines.askTheAudience && selectedAnswer === null) useAudience()
        }
        if ((e.key === 'w' || e.key === 'W') && currentLevel > 1 && selectedAnswer === null) {
          handleWalkAway()
        }
      }
      if (phase === 'ff-question') {
        if (e.key >= '1' && e.key <= '4') {
          const i = parseInt(e.key) - 1
          handleFFAnswer(i)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, selectedAnswer, currentLevel, lifelines, removedAnswers])

  function persistGame(g: GameState) {
    const s: SavedState = {
      questions: g.questions,
      currentLevel: g.currentLevel,
      fiftyFifty: g.lifelines.fiftyFifty,
      phoneAFriend: g.lifelines.phoneAFriend,
      askTheAudience: g.lifelines.askTheAudience,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  }

  async function startGame(savedState?: SavedState) {
    if (savedState) {
      const g = new GameState(savedState.questions, savedState.currentLevel, {
        fiftyFifty: savedState.fiftyFifty,
        phoneAFriend: savedState.phoneAFriend,
        askTheAudience: savedState.askTheAudience,
      })
      g.removedAnswers = []
      g.friendAnswer = null
      g.audienceResult = null
      g.startGame()
      setGame(g)
      setIsFF(false)
      setPhase('question')
      setSelectedAnswer(null)
      setRevealedCorrect(false)
      setRemovedAnswers([])
      setAudienceResult(null)
      setShowFriend(null)
      setTimeLeft(TIMER_SECONDS)
      setResumeGame(null)
      S.playQuestionAppear()
      const q = g.currentQuestion
      if (q) await V.speakQuestionAsync(q.question, q.answers)
      startTimer()
      return
    }

    const ffQ = getQuestionsForGame(1)[0]
    const ffGame = new GameState([ffQ])
    ffGame.startGame()
    setGame(ffGame)
    setIsFF(true)
    setPhase('ff-question')
    setFfAnswer(null)
    setFfRevealed(false)
    setShowConfetti(false)
    setTimeLeft(FF_TIMER_SECONDS)
    S.playStartGame()
    await new Promise(r => setTimeout(r, 800))
    S.playQuestionAppear()
    await V.speakQuestionAsync(ffQ.question, ffQ.answers)
    startTimer()
  }

  function continueToMainGame() {
    const questions = getQuestionsForGame()
    const g = new GameState(questions)
    g.startGame()
    setGame(g)
    setIsFF(false)
    setPhase('question')
    setSelectedAnswer(null)
    setRevealedCorrect(false)
    setRemovedAnswers([])
    setAudienceResult(null)
    setShowFriend(null)
    setShowConfetti(false)
    setTimeLeft(TIMER_SECONDS)
    S.playQuestionAppear()
    const q = g.currentQuestion
    setTimeout(() => {
      if (q) V.speakQuestionAsync(q.question, q.answers).then(() => startTimer())
    }, 300)
  }

  async function nextQuestion(g: GameState, correct: boolean) {
    if (correct && g.currentLevel >= 15) {
      await saveFinalScore(1_000_000, 15, 15, true)
      S.playMillionWin()
      V.speakMillionWin()
      setShowConfetti(true)
      setTimeout(() => S.playApplause(), 3000)
      clearSave()
      setPhase('game-over')
      return
    }
    if (correct) {
      g.nextQuestion()
      persistGame(g)
      setPhase('question')
      setSelectedAnswer(null)
      setRevealedCorrect(false)
      setRemovedAnswers([])
      setAudienceResult(null)
      setShowFriend(null)
      setTimeLeft(TIMER_SECONDS)
      await new Promise(r => setTimeout(r, 400))
      S.playQuestionAppear()
      const nq = g.currentQuestion
      if (nq) await V.speakQuestionAsync(nq.question, nq.answers)
      startTimer()
    } else {
      const result = g.wrongAnswer()
      await saveFinalScore(result.moneyWon, result.finalLevel, result.questionsAnswered, false)
      clearSave()
      setPhase('game-over')
    }
  }

  async function handleAnswer(index: number) {
    if (!game || phase !== 'question' || selectedAnswer !== null) return
    setSelectedAnswer(index)
    S.playFinalAnswer()
    clearTimer()
    setPhase('locking-in')
    await new Promise(r => setTimeout(r, 2000))
    const correct = game.submitAnswer(index)
    setRevealedCorrect(true)
    setPhase('answer-reveal')
    if (correct) {
      S.playCorrect()
      const prize = PRIZE_LADDER[currentLevel - 1]
      if (prize) setTimeout(() => V.speakCorrect(prize.label), 300)
      if (currentLevel === 5 || currentLevel === 10) {
        setTimeout(() => S.playSafeHaven(), 600)
        const safePrize = PRIZE_LADDER[currentLevel - 1]
        if (safePrize) setTimeout(() => V.speakSafeHaven(safePrize.label), 1200)
      }
    } else {
      setTimeout(() => S.playWrong(), 100)
    }
    await new Promise(r => setTimeout(r, correct ? 1200 : 2200))
    await nextQuestion(game, correct)
  }

  function handleFFAnswer(index: number) {
    if (!game || phase !== 'ff-question' || ffAnswer !== null) return
    setFfAnswer(index)
    clearTimer()
    setPhase('locking-in')
    setTimeout(() => {
      const correct = game.submitAnswer(index)
      setFfRevealed(true)
      setPhase('answer-reveal')
      if (correct) {
        S.playCorrect()
        continueToMainGame()
      } else {
        S.playWrong()
        const result = game.wrongAnswer()
        saveFinalScore(0, 0, 0, false)
        setIsFF(false)
        clearSave()
        setPhase('game-over')
      }
    }, 1500)
  }

  function handleFFTimeOut() {
    if (!game) return
    clearTimer()
    S.playWrong()
    const result = game.timeOut()
    saveFinalScore(0, 0, 0, false)
    setIsFF(false)
    clearSave()
    setPhase('game-over')
  }

  async function handleTimeOut() {
    if (!game) return
    clearTimer()
    const result = game.timeOut()
    clearSave()
    setPhase('game-over')
    await saveFinalScore(result.moneyWon, result.finalLevel, result.questionsAnswered, false)
  }

  function handleWalkAway() {
    if (!game || phase !== 'question') return
    clearTimer()
    S.playWalkAway()
    const result = game.walkAway()
    V.speakWalkAway(result.moneyWon.toLocaleString())
    clearSave()
    setPhase('game-over')
    saveFinalScore(result.moneyWon, result.finalLevel, result.questionsAnswered, false)
  }

  async function saveFinalScore(score: number, level: number, answered: number, won: boolean) {
    try { await saveScore(score, level, answered, won) } catch {}
  }

  function use5050() {
    if (!game || !currentQuestion || selectedAnswer !== null) return
    game.useFiftyFifty()
    setRemovedAnswers([...game.removedAnswers])
    S.play5050()
  }

  function usePhoneFriend() {
    if (!game || !currentQuestion || selectedAnswer !== null) return
    game.usePhoneAFriend()
    setShowFriend(game.friendAnswer)
    S.playPhoneFriend()
  }

  function useAudience() {
    if (!game || !currentQuestion || selectedAnswer !== null) return
    game.useAskTheAudience()
    setAudienceResult(game.audienceResult ? { ...game.audienceResult } : null)
    S.playAudience()
  }

  // ---- HOT-SEAT ----
  if (phase === 'hot-seat') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden page-transition">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #d4a853 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, #d4a853 0%, transparent 50%)`,
          }} />
        <div className="text-center animate-scale-in relative z-10">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-million-100 to-million-200 flex items-center justify-center shadow-lg shadow-million-100/30 animate-gold-pulse mb-6">
              <svg className="w-10 h-10 text-million-900" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">$</text>
              </svg>
            </div>
          </div>
          <h1 className="million-logo text-6xl md:text-8xl font-bold mb-3 tracking-[0.15em]">
            MILLIONAIRE
          </h1>
          <p className="text-million-100/60 text-lg md:text-xl mb-2 font-display tracking-widest uppercase">
            Who Wants to Be a Millionaire
          </p>
          <div className="h-px w-48 mx-auto my-6 bg-gradient-to-r from-transparent via-million-100/40 to-transparent" />
          <p className="text-gray-500 text-sm mb-6">Welcome, {user?.username}</p>
          {resumeGame && (
            <button onClick={() => startGame(resumeGame)} className="btn-ghost text-sm mb-4 block mx-auto">
              Resume Game (Q{resumeGame.currentLevel})
            </button>
          )}
          <button onClick={() => startGame()} className="btn-gold text-lg px-16 py-5 text-xl">
            PLAY
          </button>
          <div className="mt-10 flex gap-6 justify-center">
            <button onClick={() => navigate('/leaderboard')} className="btn-ghost text-sm px-4 py-2">
              Leaderboard
            </button>
            <button onClick={() => navigate('/profile')} className="btn-ghost text-sm px-4 py-2">
              Profile
            </button>
            <button onClick={logout} className="btn-ghost text-sm text-gray-500 px-4 py-2">
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- GAME OVER ----
  if (phase === 'game-over') {
    const result = game?.result
    const isWin = result?.won
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden page-transition">
        {showConfetti && <Confetti />}
        <div className="card-dark p-10 max-w-md w-full text-center animate-dramatic-in relative z-10">
          <div className={`${isWin ? 'animate-bounce-gold' : ''}`}>
            {isWin ? (
              <svg className="w-20 h-20 mx-auto text-million-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ) : (
              <svg className="w-20 h-20 mx-auto text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <h2 className={`font-display text-4xl font-bold mb-4 ${isWin ? 'text-gold-shimmer animate-glow-strong' : 'text-million-100'}`}>
            {isWin ? 'YOU ARE A MILLIONAIRE!' : isFF ? 'FASTEST FINGER FAILED' : 'GAME OVER'}
          </h2>
          {result && (
            <>
              <div className="text-5xl font-bold text-white mb-4 font-display animate-scale-in">
                ${result.moneyWon.toLocaleString()}
              </div>
              <div className="h-px w-32 mx-auto my-4 bg-gradient-to-r from-transparent via-million-100/30 to-transparent" />
              <p className="text-gray-400 text-sm space-y-1">
                <span className="block">Reached Question {result.finalLevel}</span>
                <span className="block">{result.questionsAnswered} correct answers</span>
                {result.won && <span className="text-million-100 font-bold mt-2 block">WINNER</span>}
              </p>
            </>
          )}
          <div className="mt-8 space-y-3">
            <button onClick={() => { setResumeGame(null); startGame() }} className="btn-gold w-full">Play Again</button>
            <button onClick={() => navigate('/leaderboard')} className="btn-ghost w-full">Leaderboard</button>
          </div>
        </div>
      </div>
    )
  }

  // ---- FASTEST FINGER ----
  if (isFF) {
    const ffQ = game?.currentQuestion
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden page-transition">
        <div className="text-center mb-8">
          <h2 className="text-million-100 font-display text-3xl font-bold mb-2 animate-scale-in">Fastest Finger First</h2>
          <p className="text-gray-500 text-sm">Answer correctly to qualify</p>
        </div>
        <div className="w-32 h-32 mx-auto relative mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={timerCircleR} fill="none" stroke="rgba(212,168,83,0.1)" strokeWidth="6" />
            <circle cx="60" cy="60" r={timerCircleR} fill="none" stroke={timeLeft <= 3 ? '#ef4444' : '#d4a853'} strokeWidth="6"
              strokeDasharray={timerCircumference} strokeDashoffset={timerOffset} strokeLinecap="round"
              className={timeLeft <= 3 ? 'timer-circle-urgent' : 'timer-circle'} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold font-mono ${timeLeft <= 3 ? 'text-red-400 animate-gold-pulse' : 'text-million-100'}`}>
              {timeLeft}
            </span>
          </div>
        </div>
        {ffQ && (
          <div className="card-dark p-8 max-w-xl w-full mb-8 animate-slide-up-gold">
            <p className="text-xl md:text-2xl font-medium text-center leading-relaxed text-white/90">
              {ffQ.question}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full">
          {ffQ?.answers.map((answer, i) => {
            const isSelected = ffAnswer === i
            const isCorrect = ffRevealed && i === ffQ.correctIndex
            const isWrong = ffRevealed && isSelected && !isCorrect
            let cls = 'ff-answer-btn'
            if (isSelected && !ffRevealed) cls += ' selected'
            if (isCorrect) cls += ' correct'
            if (isWrong) cls += ' wrong'
            return (
              <button key={i} className={cls}
                onClick={() => handleFFAnswer(i)}
                disabled={ffAnswer !== null}>
                <span className="text-million-100 font-bold mr-3 text-lg">{LETTERS[i]}</span>
                <span className="text-base">{answer}</span>
              </button>
            )
          })}
        </div>
        {phase === 'locking-in' && (
          <div className="text-center mt-6 animate-scale-in">
            <p className="lock-in-text text-lg font-bold text-million-100 font-display tracking-widest">FINAL ANSWER?</p>
          </div>
        )}
      </div>
    )
  }

  // ---- MAIN GAME ----
  const timePercent = (timeLeft / TIMER_SECONDS) * 100
  const timerUrgent = timeLeft <= 10
  const isLockPhase = phase === 'locking-in'

  return (
    <div className="min-h-screen flex page-transition">
      <div className="flex-1 flex flex-col p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="million-logo text-lg font-bold tracking-widest">MILLIONAIRE</div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-gray-600 mr-2 hidden md:inline">1-4: Answer | L: Lifeline | W: Walk</span>
            <button onClick={() => navigate('/leaderboard')} className="btn-ghost text-xs px-3 py-1">Leaderboard</button>
            <button onClick={() => navigate('/profile')} className="btn-ghost text-xs px-3 py-1">Profile</button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <div className="w-16 h-16 relative flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={timerCircleR} fill="none" stroke="rgba(212,168,83,0.1)" strokeWidth="8" />
              <circle cx="60" cy="60" r={timerCircleR} fill="none"
                stroke={timerUrgent ? '#ef4444' : '#d4a853'} strokeWidth="8"
                strokeDasharray={timerCircumference} strokeDashoffset={timerOffset} strokeLinecap="round"
                className={timerUrgent ? 'timer-circle-urgent' : 'timer-circle'} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold font-mono ${timerUrgent ? 'text-red-400 animate-gold-pulse' : 'text-million-100'}`}>
                {timeLeft}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Question <span className="text-million-100">{currentLevel}</span> of 15</span>
              <span className="text-million-100 font-bold">{PRIZE_LADDER[currentLevel - 1]?.label}</span>
            </div>
            <div className={`timer-bar ${timerUrgent ? 'timer-urgent' : 'timer-normal'}`}>
              <div className="timer-bar-fill" style={{ width: `${timePercent}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
          <div className="card-dark p-8 mb-8 animate-slide-up-gold" key={currentLevel}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-million-100 to-million-200 flex items-center justify-center text-sm font-bold text-million-900">
                {currentLevel}
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-million-100/20 to-transparent" />
            </div>
            <p className="text-xl md:text-2xl font-medium text-center leading-relaxed text-white/90">
              {currentQuestion?.question}
            </p>
          </div>

          {isLockPhase && (
            <div className="text-center mb-6 animate-scale-in">
              <p className="lock-in-text text-2xl font-bold text-million-100 font-display tracking-widest">
                FINAL ANSWER?
              </p>
              <div className="h-px w-24 mx-auto mt-3 bg-gradient-to-r from-transparent via-million-100/40 to-transparent" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {currentQuestion?.answers.map((answer, i) => {
              const isRemoved = removedAnswers.includes(i)
              const isSelected = selectedAnswer === i
              const isCorrect = revealedCorrect && i === currentQuestion.correctIndex
              const isWrong = revealedCorrect && isSelected && !isCorrect
              let cls = 'answer-btn'
              if (isRemoved) cls += ' removed'
              if (isSelected) cls += ' selected'
              if (isCorrect) cls += ' correct'
              if (isWrong) cls += ' wrong'

              return (
                <button key={i} className={cls}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedAnswer !== null || isRemoved || isLockPhase}>
                  <span className={`text-million-100 font-bold mr-3 text-lg inline-block ${selectedAnswer === null && !isRemoved ? 'letter-glow' : ''}`}>
                    {LETTERS[i]}
                  </span>
                  <span className="text-base">{answer}</span>
                </button>
              )
            })}
          </div>

          {audienceResult && (
            <div className="card-dark p-5 mb-4 animate-fade-in">
              <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-million-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="12" width="4" height="9" rx="1"/>
                  <rect x="10" y="7" width="4" height="14" rx="1"/>
                  <rect x="17" y="3" width="4" height="18" rx="1"/>
                </svg>
                Ask the Audience:
              </p>
              <div className="flex gap-3">
                {currentQuestion?.answers.map((ans, i) => (
                  <div key={i} className="flex-1 text-center p-3 rounded-lg bg-million-800/50">
                    <div className="text-3xl font-bold text-million-100 mb-1">
                      {audienceResult.votes[i]}%
                    </div>
                    <div className="text-xs text-gray-500">{LETTERS[i]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showFriend && (
            <div className="card-dark p-5 mb-4 animate-fade-in">
              <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-million-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
                Phone a Friend:
              </p>
              <p className="text-million-100 italic text-lg">
                "I'm fairly certain the answer is <strong className="text-million-200">{showFriend}</strong>"
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={use5050} disabled={!lifelines.fiftyFifty || selectedAnswer !== null || isLockPhase}
            className="btn-ghost text-sm">50:50</button>
          <button onClick={usePhoneFriend} disabled={!lifelines.phoneAFriend || selectedAnswer !== null || isLockPhase}
            className="btn-ghost text-sm">
              <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Phone a Friend</button>
          <button onClick={useAudience} disabled={!lifelines.askTheAudience || selectedAnswer !== null || isLockPhase}
            className="btn-ghost text-sm">
              <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="12" width="4" height="9" rx="1"/>
                <rect x="10" y="7" width="4" height="14" rx="1"/>
                <rect x="17" y="3" width="4" height="18" rx="1"/>
              </svg>
              Ask the Audience</button>
          {currentLevel > 1 && selectedAnswer === null && !isLockPhase && (
            <button onClick={handleWalkAway} className="btn-ghost text-sm text-million-100 border-million-100/60">
              Walk Away (${PRIZE_LADDER[currentLevel - 2]?.amount.toLocaleString()})
            </button>
          )}
        </div>
      </div>

      <div className="hidden md:block w-56 bg-million-800/30 border-l border-million-700/20 p-3 overflow-y-auto">
        <div className="text-center text-xs text-gray-500 mb-4 uppercase tracking-widest font-bold">Prize Ladder</div>
        {[...PRIZE_LADDER].reverse().map(tier => (
          <div key={tier.level}
            className={`prize-tier ${tier.level === currentLevel ? 'active' : ''} ${tier.safeHaven && tier.level !== currentLevel ? 'safe-haven' : ''}`}>
            <span className={tier.level === currentLevel ? 'text-million-100' : 'text-gray-500'}>
              {tier.level}
            </span>
            <span className={tier.safeHaven ? 'text-million-100/50 text-xs' : 'text-gray-400'}>
              {tier.label}
              {tier.safeHaven && <span className="ml-1 text-[8px] opacity-60">◆</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
