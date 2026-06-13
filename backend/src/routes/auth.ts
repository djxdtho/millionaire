import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { getDb, saveDb } from '../db'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'millionaire-dev-secret-change-in-prod'

function queryOne(sql: string, params: any[] = []): any {
  const db = getDb()
  const stmt = db.prepare(sql)
  stmt.bind(params)
  let row: any = null
  if (stmt.step()) row = stmt.getAsObject()
  stmt.free()
  return row
}

function queryAll(sql: string, params: any[] = []): any[] {
  const db = getDb()
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

router.post('/register', (req: Request, res: Response) => {
  const { email, username, password } = req.body
  if (!email || !username || !password) {
    res.status(400).json({ error: 'Email, username, and password required' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }

  const existing = queryOne('SELECT id FROM users WHERE email = ? OR username = ?', [email, username])
  if (existing) {
    res.status(409).json({ error: 'Email or username already taken' })
    return
  }

  const id = uuid()
  const hash = bcrypt.hashSync(password, 10)
  const db = getDb()
  db.run('INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)', [id, email, username, hash])
  saveDb()

  const token = jwt.sign({ userId: id, username }, JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: { id, email, username } })
})

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' })
    return
  }

  const user = queryOne('SELECT * FROM users WHERE email = ?', [email])
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, email: user.email, username: user.username } })
})

router.get('/me', (req: Request, res: Response) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token' })
    return
  }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as any
    const user = queryOne('SELECT id, email, username, created_at FROM users WHERE id = ?', [payload.userId])
    if (!user) { res.status(404).json({ error: 'User not found' }); return }

    const stats = queryOne(`
      SELECT COUNT(*) as games_played, COALESCE(MAX(score),0) as best_score,
             COALESCE(SUM(CASE WHEN won THEN 1 ELSE 0 END),0) as games_won
      FROM scores WHERE user_id = ?
    `, [user.id])

    res.json({ user, stats })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export { router as authRouter, JWT_SECRET }
