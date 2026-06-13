import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { getMe, getHistory } from '../api'

interface UserStats {
  games_played: number
  best_score: number
  games_won: number
}

interface GameRecord {
  id: string
  score: number
  level_reached: number
  questions_answered: number
  won: number
  played_at: string
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [history, setHistory] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMe(), getHistory()]).then(([me, hist]) => {
      setStats(me.stats)
      setHistory(hist.history)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-million-100">Profile</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="btn-ghost text-sm">Game</button>
          <button onClick={() => navigate('/leaderboard')} className="btn-ghost text-sm">Leaderboard</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="card-dark p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-million-100/20 flex items-center justify-center text-2xl font-bold text-million-100">
                {user?.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold text-white">{user?.username}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card-dark p-4 text-center">
                <p className="text-2xl font-bold text-million-100">{stats.games_played}</p>
                <p className="text-xs text-gray-400">Games</p>
              </div>
              <div className="card-dark p-4 text-center">
                <p className="text-2xl font-bold text-white">${stats.best_score.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Best Score</p>
              </div>
              <div className="card-dark p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{stats.games_won}</p>
                <p className="text-xs text-gray-400">Won</p>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Recent Games</h2>
              <div className="space-y-2">
                {history.slice(0, 10).map((record) => (
                  <div key={record.id} className="card-dark p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        ${record.score.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Q{record.level_reached} &middot; {record.questions_answered} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(record.played_at).toLocaleDateString()}
                      </p>
                      {record.won ? <p className="text-xs text-green-400">🏆 Won!</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
