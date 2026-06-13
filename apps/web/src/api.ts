import { supabase } from './lib/supabase'

export async function register(email: string, username: string, password: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error('Registration failed')

  const username_ = authData.user.user_metadata?.username || username

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email!,
      username: username_,
    },
  }
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Login failed')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .single()

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username || data.user.email?.split('@')[0] || 'Player',
    },
  }
}

export async function getMe() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email!,
      username: profile?.username || user.email?.split('@')[0] || 'Player',
    },
    stats: stats || { games_played: 0, best_score: 0, games_won: 0 },
  }
}

export async function saveScore(score: number, levelReached: number, questionsAnswered: number, won: boolean) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('scores').insert({
    user_id: user.id,
    score,
    level_reached: levelReached,
    questions_answered: questionsAnswered,
    won,
  })
  if (error) throw new Error(error.message)
}

export async function getLeaderboard(limit = 100, offset = 0) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw new Error(error.message)

  const { data: { user } } = await supabase.auth.getUser()
  let userRank: number | null = null
  if (user) {
    const { data: userBest } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(1)
      .single()

    if (userBest) {
      const { count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('score', userBest.score)
      userRank = (count || 0) + 1
    }
  }

  return { leaderboard: data || [], userRank }
}

export async function getHistory() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return { history: data || [] }
}
