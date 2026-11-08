import { useEffect, useRef, useState } from 'react'
import type { MachineConfig } from '../types'

interface Props {
  config: MachineConfig
  onDone: (score: number, won: boolean) => void
}

interface Orb {
  id: number
  x: number
  y: number
  r: number
  vy: number
}

export function OrbCatch({ config, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(config.lives)
  const [running, setRunning] = useState(true)
  const state = useRef({
    orbs: [] as Orb[],
    score: 0,
    lives: config.lives,
    nextId: 1,
    spawnTimer: 0,
    ended: false,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = canvas.clientWidth
    const cssH = canvas.clientHeight
    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let raf = 0
    const speedMul = 0.7 + config.speed * 0.45

    const spawn = () => {
      const r = 14 + Math.random() * 10
      state.current.orbs.push({
        id: state.current.nextId++,
        x: r + Math.random() * (cssW - r * 2),
        y: -r,
        r,
        vy: (1.4 + Math.random() * 1.6) * speedMul,
      })
    }

    const tick = () => {
      if (state.current.ended) return
      ctx.clearRect(0, 0, cssW, cssH)

      // attic playfield
      const g = ctx.createLinearGradient(0, 0, 0, cssH)
      g.addColorStop(0, '#1a2422')
      g.addColorStop(1, '#0d1412')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, cssW, cssH)
      ctx.strokeStyle = 'rgba(233,184,114,0.15)'
      for (let i = 0; i < 6; i++) {
        ctx.beginPath()
        ctx.moveTo((cssW / 6) * i, 0)
        ctx.lineTo((cssW / 6) * i, cssH)
        ctx.stroke()
      }

      state.current.spawnTimer -= 1
      if (state.current.spawnTimer <= 0) {
        spawn()
        state.current.spawnTimer = Math.max(18, 48 - config.speed * 8)
      }

      const kept: Orb[] = []
      for (const orb of state.current.orbs) {
        orb.y += orb.vy
        if (orb.y - orb.r > cssH) {
          state.current.lives -= 1
          setLives(state.current.lives)
          if (state.current.lives <= 0) {
            state.current.ended = true
            setRunning(false)
            onDone(state.current.score, false)
          }
          continue
        }
        kept.push(orb)

        const glow = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, orb.r * 1.6)
        glow.addColorStop(0, '#fff8e7')
        glow.addColorStop(0.35, config.accent)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r * 1.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = config.accent
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2)
        ctx.fill()
      }
      state.current.orbs = kept

      // floor hazard line
      ctx.fillStyle = 'rgba(255,138,91,0.35)'
      ctx.fillRect(0, cssH - 6, cssW, 6)

      if (!state.current.ended) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [config, onDone])

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!running || state.current.ended) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const hit = state.current.orbs.findIndex(
      (o) => (o.x - x) ** 2 + (o.y - y) ** 2 <= (o.r + 8) ** 2,
    )
    if (hit >= 0) {
      state.current.orbs.splice(hit, 1)
      state.current.score += 1
      setScore(state.current.score)
      if (state.current.score >= config.target) {
        state.current.ended = true
        setRunning(false)
        onDone(state.current.score, true)
      }
    }
  }

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <span>
          Score <strong>{score}</strong> / {config.target}
        </span>
        <span>
          Lives <strong>{'\u2665'.repeat(Math.max(0, lives))}</strong>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerDown={handlePointer}
        aria-label="Orb Catch playfield"
      />
      <p className="game-hint">Tap the glowing orbs before they hit the floor.</p>
    </div>
  )
}
