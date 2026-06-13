import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcteutslzvctjevjqpwe.supabase.co',
  'sb_publishable_Y2SNTxwUX-mEjXbLBzfRLQ_VtbeJL7w'
)

async function test() {
  const ts = Date.now()
  const email = `user${ts}@mail.com`
  const username = `user${ts}`

  console.log('Testing registration with:', email, username)

  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'test123456',
    options: { data: { username } },
  })

  if (error) {
    console.log('signUp ERROR:', error.message)
    return
  }

  console.log('signUp OK')
  console.log('  user.id:', data.user?.id)
  console.log('  session:', !!data.session)
  console.log('  username:', data.user?.user_metadata?.username)

  // wait a moment for the trigger to fire
  await new Promise(r => setTimeout(r, 1000))

  // Check if profile was auto-created by trigger
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user?.id)
    .single()

  if (profileError) {
    console.log('profile ERROR:', profileError.message)
  } else {
    console.log('profile:', JSON.stringify(profile))
  }

  // If no auto-session (email confirmation on), test login
  if (!data.session) {
    console.log('\nNo auto-session (email confirmation may be ON)')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: 'test123456',
    })

    if (loginError) {
      console.log('login ERROR:', loginError.message)
    } else {
      console.log('login OK, user:', loginData.user?.email)
    }
  } else {
    console.log('\nAuto-session available (email confirmation OFF)')
  }
}

test().catch(console.error)
