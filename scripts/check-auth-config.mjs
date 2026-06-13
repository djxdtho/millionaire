import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcteutslzvctjevjqpwe.supabase.co',
  'sb_publishable_Y2SNTxwUX-mEjXbLBzfRLQ_VtbeJL7w'
)

// Check auth settings - use admin API to check config
// We can check by trying to sign up with a known-disabled domain
console.log('Supabase URL:', supabase.supabaseUrl)
console.log('To disable email confirmation, visit:')
console.log('https://supabase.com/dashboard/project/zcteutslzvctjevjqpwe/auth/settings')
console.log('Then set "Confirm email" to OFF and click Save')
