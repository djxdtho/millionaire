import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'millionaire.db')

let db: SqlJsDatabase

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

export async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      score INTEGER NOT NULL,
      level_reached INTEGER NOT NULL,
      questions_answered INTEGER NOT NULL,
      won BOOLEAN NOT NULL DEFAULT 0,
      played_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)')
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id)')

  saveDb()
  return db
}

export function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}
