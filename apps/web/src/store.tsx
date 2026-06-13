import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from './lib/supabase'
import type { User as AuthUser } from '@supabase/supabase-js'

interface AppUser {
  id: string
  email: string
  username: string
}

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setUser(null)
        if (!loading) setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authUser: AuthUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', authUser.id)
      .single()

    setUser({
      id: authUser.id,
      email: authUser.email!,
      username: profile?.username || authUser.email?.split('@')[0] || 'Player',
    })
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
