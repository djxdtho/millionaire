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

// Get auth.users columns
const cols = await client.query(`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'users'
  ORDER BY ordinal_position
`)
console.log('auth.users columns:')
cols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) nullable=${c.is_nullable} default=${c.column_default}`))

await client.end()
