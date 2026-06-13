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

const statements = [
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
  `DROP FUNCTION IF EXISTS handle_new_user`,
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $trigger$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$trigger$`,
  `CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user()`,
]

async function run() {
  await client.connect()

  for (const stmt of statements) {
    try {
      await client.query(stmt)
      console.log(`  OK: ${stmt.slice(0, 60)}`)
    } catch (err) {
      console.error(`  FAIL: ${stmt.slice(0, 60)}`)
      console.error(`  Error: ${err.message}`)
    }
  }

  console.log('Done!')
  await client.end()
}

run().catch(console.error)
