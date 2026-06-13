import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { scoresRouter } from './routes/scores'
import { initDb } from './db'

const app = express()
const PORT = parseInt(process.env.PORT || '3001')

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/scores', scoresRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})
