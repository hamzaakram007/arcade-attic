import { useEffect, useRef, useState } from 'react'
import type { MachineConfig } from '../types'

interface Props {
  config: MachineConfig
  onDone: (score: number, won: boolean) => void
}

type Kind = 'spark' | 'crate' | 'heart'

interface Entity {
  id: number
  lane: number
  y: number
  kind: Kind
}

export function LaneDash({ config, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(config.lives)
  const [running, setRunning] = useState(true)
  const laneRef = useRef(1)
  const touchX = useRef<number | null>(null)
  const state = useRef({
    lane: 1,
    entities: [] as Entity[],
    score: 0,
    lives: config.lives,
    nextId: 1,
    spawnTimer: 0,
    ended: false,
    distance: 0,
    flash: 0,
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

    const lanes = 3
    const laneW = cssW / lanes
    const speed = 2.4 + config.speed * 0.7
    let raf = 0

    const spawn = () => {
      const lane = Math.floor(Math.random() * lanes)
      const roll = Math.random()
      const kind: Kind = roll > 0.88 ? 'heart' : roll > 0.45 ? 'spark' : 'crate'
      // avoid stacking same lane too tight
      const crowded = state.current.entities.some((e) => e.lane === lane && e.y < 70)
      if (crowded) return
      state.current.entities.push({
        id: state.current.nextId++,
        lane,
        y: -30,
        kind,
      })
    }

    const tick = () => {
      if (state.current.ended) return
      state.current.lane = laneRef.current
      state.current.distance += speed

      state.current.spawnTimer -= 1
      if (state.current.spawnTimer <= 0) {
        spawn()
        if (config.speed >= 3 && Math.random() > 0.55) spawn()
        state.current.spawnTimer = Math.max(16, 38 - config.speed * 5)
      }

      const playerY = cssH - 56
      const kept: Entity[] = []
      for (const e of state.current.entities) {
        e.y += speed
        if (e.y > cssH + 40) continue

        const sameLane = e.lane === state.current.lane
        const near = Math.abs(e.y - playerY) < 28
        if (sameLane && near) {
          if (e.kind === 'spark') {
            state.current.score += 1
            setScore(state.current.score)
            state.current.flash = 8
            if (state.current.score >= config.target) {
              state.current.ended = true
              setRunning(false)
              onDone(state.current.score, true)
            }
            continue
          }
          if (e.kind === 'heart') {
            state.current.lives = Math.min(config.lives + 1, state.current.lives + 1)
            setLives(state.current.lives)
            state.current.flash = 6
            continue
          }
          // crate
          state.current.lives -= 1
          setLives(state.current.lives)
          state.current.flash = 12
          if (state.current.lives <= 0) {
            state.current.ended = true
            setRunning(false)
            onDone(state.current.score, false)
          }
          continue
        }
        kept.push(e)
      }
      state.current.entities = kept

      // draw
      const g = ctx.createLinearGradient(0, 0, 0, cssH)
      g.addColorStop(0, '#142018')
      g.addColorStop(1, '#0a100e')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, cssW, cssH)

      const scroll = state.current.distance % 36
      for (let i = -1; i < cssH / 36 + 2; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(46,196,182,0.05)' : 'rgba(233,184,114,0.04)'
        ctx.fillRect(0, i * 36 + scroll, cssW, 36)
      }

      for (let i = 1; i < lanes; i++) {
        ctx.strokeStyle = 'rgba(255,209,102,0.25)'
        ctx.setLineDash([10, 12])
        ctx.beginPath()
        ctx.moveTo(laneW * i, 0)
        ctx.lineTo(laneW * i, cssH)
        ctx.stroke()
        ctx.setLineDash([])
      }

      for (const e of state.current.entities) {
        const x = e.lane * laneW + laneW / 2
        if (e.kind === 'spark') {
          const glow = ctx.createRadialGradient(x, e.y, 2, x, e.y, 22)
          glow.addColorStop(0, '#fff8e7')
          glow.addColorStop(0.4, config.accent)
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(x, e.y, 22, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = config.accent
          ctx.beginPath()
          ctx.arc(x, e.y, 9, 0, Math.PI * 2)
          ctx.fill()
        } else if (e.kind === 'heart') {
          ctx.font = '20px serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('♥', x, e.y)
        } else {
          ctx.fillStyle = '#6b4428'
          ctx.beginPath()
          ctx.roundRect(x - 16, e.y - 14, 32, 28, 4)
          ctx.fill()
          ctx.strokeStyle = '#e9b872'
          ctx.stroke()
          ctx.fillStyle = 'rgba(0,0,0,0.25)'
          ctx.fillRect(x - 16, e.y - 2, 32, 3)
        }
      }

      // player
      const px = state.current.lane * laneW + laneW / 2
      if (state.current.flash > 0) {
        ctx.fillStyle = `rgba(255,138,91,${state.current.flash / 20})`
        ctx.fillRect(0, 0, cssW, cssH)
        state.current.flash -= 1
      }
      ctx.fillStyle = '#e9b872'
      ctx.beginPath()
      ctx.arc(px, playerY, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a120c'
      ctx.beginPath()
      ctx.arc(px - 5, playerY - 3, 2.5, 0, Math.PI * 2)
      ctx.arc(px + 5, playerY - 3, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = config.accent
      ctx.fillRect(px - 10, playerY + 10, 20, 6)

      // lane hints
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(state.current.lane * laneW + 6, cssH - 18, laneW - 12, 6)

      if (!state.current.ended) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [config, onDone])

  const shift = (dir: -1 | 1) => {
    if (!running || state.current.ended) return
    laneRef.current = Math.max(0, Math.min(2, laneRef.current + dir))
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    touchX.current = e.clientX
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = (e.clientX - rect.left) / rect.width
    if (rel < 0.33) laneRef.current = 0
    else if (rel > 0.66) laneRef.current = 2
    else laneRef.current = 1
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchX.current == null) return
    const dx = e.clientX - touchX.current
    if (Math.abs(dx) > 28) shift(dx > 0 ? 1 : -1)
    touchX.current = null
  }

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <span>
          Sparks <strong>{score}</strong> / {config.target}
        </span>
        <span>
          Lives <strong>{'♥'.repeat(Math.max(0, lives))}</strong>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          touchX.current = null
        }}
        aria-label="Lane Dash playfield"
      />
      <div className="lane-controls">
        <button type="button" className="btn tight" onClick={() => shift(-1)} aria-label="Left lane">
          ←
        </button>
        <p className="game-hint">Tap a lane or swipe. Grab sparks, dodge crates.</p>
        <button type="button" className="btn tight" onClick={() => shift(1)} aria-label="Right lane">
          →
        </button>
      </div>
    </div>
  )
}
