import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeaderboard } from '../api'

interface LeaderboardEntry {
  username: string
  score: number
  level_reached: number
  games_played: number
  won_million: boolean
}

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then(data => {
      setEntries(data.leaderboard)
      setUserRank(data.userRank)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-million-100">Leaderboard</h1>
        <button onClick={() => navigate('/')} className="btn-ghost text-sm">Back</button>
      </div>

      {userRank && (
        <div className="card-dark p-4 mb-6 text-center">
          <p className="text-gray-400 text-sm">Your Rank</p>
          <p className="text-2xl font-bold text-million-100">#{userRank}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p className="text-4xl mb-4">🏆</p>
          <p>No scores yet. Be the first!</p>
          <button onClick={() => navigate('/')} className="btn-gold mt-4">Play Now</button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="card-dark p-4 flex items-center gap-4 hover:bg-million-700/30 transition-colors">
              <div className="w-8 text-center text-lg">
                {i < 3 ? medals[i] : `#${i + 1}`}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{entry.username}</p>
                <p className="text-xs text-gray-500">{entry.games_played} game{entry.games_played !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-million-100 font-bold">${entry.score.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Q{entry.level_reached}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
