const API = '/api'

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function register(email: string, username: string, password: string) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  })
}

export function login(email: string, password: string) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getMe() {
  return request('/auth/me')
}

export function saveScore(score: number, levelReached: number, questionsAnswered: number, won: boolean) {
  return request('/scores', {
    method: 'POST',
    body: JSON.stringify({ score, levelReached, questionsAnswered, won }),
  })
}

export function getLeaderboard(limit = 100, offset = 0) {
  return request(`/scores/leaderboard?limit=${limit}&offset=${offset}`)
}

export function getHistory() {
  return request('/scores/history')
}
