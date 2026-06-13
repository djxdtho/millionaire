import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { login, register } from '../api'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/')
      } else {
        await register(email, username, password)
        setRegistered(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-dark p-8 w-full max-w-md text-center animate-fade-in">
          <p className="text-4xl mb-4">🎉</p>
          <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-gray-400 mb-6">You can now log in.</p>
          <button onClick={() => { setMode('login'); setRegistered(false) }} className="btn-gold">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-dark p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-million-100 mb-2">MILLIONAIRE</h1>
          <p className="text-gray-400 text-sm">Who Wants to Be a Millionaire</p>
        </div>

        <div className="flex mb-6 bg-million-700/30 rounded-lg p-1">
          <button onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'login' ? 'bg-million-100 text-black' : 'text-gray-400'}`}>
            Login
          </button>
          <button onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'register' ? 'bg-million-100 text-black' : 'text-gray-400'}`}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Email</label>
            <input type="email" className="input-field" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          {mode === 'register' && (
            <div>
              <label className="text-sm text-gray-400 block mb-1">Username</label>
              <input type="text" className="input-field" value={username}
                onChange={e => setUsername(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Password</label>
            <input type="password" className="input-field" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" className="btn-gold w-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Enter the Game' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
