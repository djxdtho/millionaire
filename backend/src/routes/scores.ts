import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { getDb, saveDb } from '../db'
import { JWT_SECRET } from './auth'

const router = Router()

function getUser(req: Request): { userId: string; username: string } | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET) as any
  } catch {
    return null
  }
}

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

router.post('/', (req: Request, res: Response) => {
  const user = getUser(req)
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { score, levelReached, questionsAnswered, won } = req.body
  if (score === undefined || levelReached === undefined) {
    res.status(400).json({ error: 'Score and levelReached required' })
    return
  }

  const db = getDb()
  const id = uuid()
  db.run(
    'INSERT INTO scores (id, user_id, score, level_reached, questions_answered, won) VALUES (?, ?, ?, ?, ?, ?)',
    [id, user.userId, score, levelReached, questionsAnswered || 0, won ? 1 : 0]
  )
  saveDb()
  res.status(201).json({ id })
})

router.get('/leaderboard', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 200)
  const offset = parseInt(req.query.offset as string) || 0
  const user = getUser(req)

  let userRank: number | null = null
  if (user) {
    const userBest = queryOne('SELECT MAX(score) as best FROM scores WHERE user_id = ?', [user.userId])
    if (userBest?.best) {
      const rank = queryOne(
        'SELECT COUNT(*) + 1 as rank FROM (SELECT user_id, MAX(score) as best FROM scores GROUP BY user_id) WHERE best > ?',
        [userBest.best]
      )
      userRank = rank.rank
    }
  }

  const leaderboard = queryAll(`
    SELECT u.username, MAX(s.score) as score, MAX(s.level_reached) as level_reached,
           COUNT(s.id) as games_played, MAX(s.won) as won_million
    FROM scores s JOIN users u ON s.user_id = u.id
    GROUP BY s.user_id
    ORDER BY score DESC
    LIMIT ? OFFSET ?
  `, [limit, offset])

  res.json({ leaderboard, userRank })
})

router.get('/history', (req: Request, res: Response) => {
  const user = getUser(req)
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return }

  const history = queryAll(
    'SELECT * FROM scores WHERE user_id = ? ORDER BY played_at DESC LIMIT 50',
    [user.userId]
  )
  res.json({ history })
})

export { router as scoresRouter }
