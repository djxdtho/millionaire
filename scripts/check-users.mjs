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
const r = await client.query("SELECT id, email, raw_user_meta_data, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10")
console.log(JSON.stringify(r.rows, null, 2))
const p = await client.query("SELECT id, username FROM public.profiles ORDER BY id DESC LIMIT 10")
console.log('\nProfiles:')
console.log(JSON.stringify(p.rows, null, 2))
await client.end()
