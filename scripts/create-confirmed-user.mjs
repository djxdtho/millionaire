import pkg from 'pg'
const { Client } = pkg

const client = new Client({
  user: 'postgres.zcteutslzvctjevjqpwe',
  password: 'P@ssword_X2009LOL',
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
})

await client.connect()

// Create user with confirmed email - bypasses the email rate limit
// Use auth.users() helper to properly create user with all required columns
const email = 'testuser@example.com'
const password = 'test123456'
const username = 'testuser'

// Supabase uses the auth schema's built-in functions
// Actually, let's use the GoTrue approach: insert with encrypted password
const { data: existing } = await client.query(
  "SELECT id FROM auth.users WHERE email = $1", [email]
)

if (existing.rows.length > 0) {
  console.log('User already exists, id:', existing.rows[0].id)
} else {
  // Insert with properly encrypted password using pgcrypto
  const r = await client.query(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      confirmation_sent_at, confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      $1,
      crypt($2, gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('username', $3),
      now(),
      now()
    )
    RETURNING id, email
  `, [email, password, username])
  
  console.log('User created:', r.rows[0].id, r.rows[0].email)
}

// Wait a moment for the trigger to fire
await new Promise(r => setTimeout(r, 1000))

// Check profile
const { rows: profiles } = await client.query(
  "SELECT id, username FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = $1)", 
  [email]
)
console.log('Profiles:', JSON.stringify(profiles))

// Now test login via the supabase client
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://zcteutslzvctjevjqpwe.supabase.co',
  'sb_publishable_Y2SNTxwUX-mEjXbLBzfRLQ_VtbeJL7w'
)

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (error) console.log('Login error:', error.message)
else console.log('Login OK! User:', data.user?.email, 'Session:', !!data.session)

await client.end()
