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

async function run() {
  await client.connect()

  // Check for triggers on auth.users
  const triggers = await client.query(`
    SELECT tgname, tgrelid::regclass, pg_get_triggerdef(oid)
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
  `)
  console.log('Triggers on auth.users:')
  triggers.rows.forEach(r => console.log(`  ${r.tgname}: ${r.pg_get_triggerdef.slice(0, 200)}`))

  // Check for functions related to handle_new_user
  const funcs = await client.query(`
    SELECT proname, prosrc::text
    FROM pg_proc
    WHERE proname LIKE '%handle%user%' OR proname LIKE '%new%user%' OR proname LIKE '%profile%'
  `)
  console.log('\nRelevant functions:')
  funcs.rows.forEach(r => console.log(`  ${r.proname}: ${r.prosrc?.slice(0, 200) || 'N/A'}`))

  await client.end()
}

run().catch(console.error)
