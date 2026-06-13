import { useEffect, useState } from 'react'

const COLORS = ['#d4a853', '#f0d68a', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#ec4899']

interface Piece {
  id: number
  x: number
  color: string
  size: number
  delay: number
  duration: number
  rotation: number
}

export default function Confetti({ count = 80 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    const p: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
      rotation: Math.random() * 360,
    }))
    setPieces(p)
    const t = setTimeout(() => setPieces([]), 5000)
    return () => clearTimeout(t)
  }, [count])

  if (pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `-20px`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotation}deg)`,
            opacity: 1,
          }}
        />
      ))}
    </div>
  )
}
