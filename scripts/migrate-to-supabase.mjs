import pkg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '..', 'supabase-migration.sql')
const raw = fs.readFileSync(sqlPath, 'utf-8')

// Remove all SQL comments (lines starting with --)
const sql = raw
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n')

// Split by semicolons, clean whitespace
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0)

console.log(`${statements.length} statements to execute:`)
statements.forEach((s, i) => console.log(`  [${i}] ${s.slice(0, 70)}`))

const client = new Client({
  user: 'postgres.zcteutslzvctjevjqpwe',
  password: 'P@ssword_X2009LOL',
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('\nConnected. Running migration...')

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    try {
      await client.query(stmt)
      console.log(`  OK [${i}]: ${stmt.slice(0, 70)}`)
    } catch (err) {
      console.error(`  FAIL [${i}]: ${stmt.slice(0, 70)}`)
      console.error(`  Error: ${err.message}`)
    }
  }

  console.log('\nMigration complete!')
} catch (err) {
  console.error('Connection error:', err.message)
} finally {
  await client.end()
}
