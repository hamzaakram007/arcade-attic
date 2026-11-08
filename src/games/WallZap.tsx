import { useEffect, useRef, useState } from 'react'
import type { MachineConfig } from '../types'

interface Props {
  config: MachineConfig
  onDone: (score: number, won: boolean) => void
}

interface Target {
  x: number
  y: number
  w: number
  h: number
  alive: boolean
}

export function WallZap({ config, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(config.lives)
  const [running, setRunning] = useState(true)
  const pointerX = useRef(0.5)
  const state = useRef({
    ball: { x: 0, y: 0, vx: 0, vy: 0, r: 8 },
    paddle: { x: 0, w: 72, h: 12 },
    targets: [] as Target[],
    score: 0,
    lives: config.lives,
    ended: false,
    ready: false,
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

    const speed = 2.2 + config.speed * 0.55
    const cols = 4
    const rows = 2
    const gap = 10
    const tw = (cssW - gap * (cols + 1)) / cols
    const th = 18
    const targets: Target[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        targets.push({
          x: gap + c * (tw + gap),
          y: 28 + r * (th + gap),
          w: tw,
          h: th,
          alive: true,
        })
      }
    }

    const resetBall = () => {
      state.current.ball = {
        x: cssW / 2,
        y: cssH - 60,
        vx: speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -speed,
        r: 8,
      }
    }

    state.current.targets = targets
    state.current.paddle.w = Math.max(56, 90 - config.speed * 6)
    state.current.paddle.x = cssW / 2 - state.current.paddle.w / 2
    resetBall()
    state.current.ready = true

    let raf = 0
    const tick = () => {
      if (state.current.ended) return
      const s = state.current
      const pw = s.paddle.w
      s.paddle.x = Math.max(0, Math.min(cssW - pw, pointerX.current * cssW - pw / 2))

      s.ball.x += s.ball.vx
      s.ball.y += s.ball.vy

      if (s.ball.x - s.ball.r < 0 || s.ball.x + s.ball.r > cssW) s.ball.vx *= -1
      if (s.ball.y - s.ball.r < 0) s.ball.vy *= -1

      const py = cssH - 28
      if (
        s.ball.vy > 0 &&
        s.ball.y + s.ball.r >= py &&
        s.ball.y + s.ball.r <= py + s.paddle.h + 8 &&
        s.ball.x >= s.paddle.x &&
        s.ball.x <= s.paddle.x + pw
      ) {
        s.ball.vy = -Math.abs(s.ball.vy)
        const hit = (s.ball.x - (s.paddle.x + pw / 2)) / (pw / 2)
        s.ball.vx = speed * hit * 1.2
      }

      if (s.ball.y - s.ball.r > cssH) {
        s.lives -= 1
        setLives(s.lives)
        if (s.lives <= 0) {
          s.ended = true
          setRunning(false)
          onDone(s.score, false)
        } else {
          resetBall()
        }
      }

      for (const t of s.targets) {
        if (!t.alive) continue
        if (
          s.ball.x + s.ball.r > t.x &&
          s.ball.x - s.ball.r < t.x + t.w &&
          s.ball.y + s.ball.r > t.y &&
          s.ball.y - s.ball.r < t.y + t.h
        ) {
          t.alive = false
          s.ball.vy *= -1
          s.score += 1
          setScore(s.score)
          if (s.score >= config.target || s.targets.every((x) => !x.alive)) {
            s.ended = true
            setRunning(false)
            onDone(s.score, true)
          }
        }
      }

      // draw
      const g = ctx.createLinearGradient(0, 0, 0, cssH)
      g.addColorStop(0, '#1a1512')
      g.addColorStop(1, '#0c0a09')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, cssW, cssH)

      for (const t of s.targets) {
        if (!t.alive) continue
        ctx.fillStyle = config.accent
        ctx.fillRect(t.x, t.y, t.w, t.h)
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.fillRect(t.x, t.y, t.w, 4)
      }

      ctx.fillStyle = '#e9b872'
      ctx.fillRect(s.paddle.x, cssH - 28, pw, s.paddle.h)

      const glow = ctx.createRadialGradient(
        s.ball.x,
        s.ball.y,
        1,
        s.ball.x,
        s.ball.y,
        s.ball.r * 2.2,
      )
      glow.addColorStop(0, '#fff')
      glow.addColorStop(0.4, config.accent)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(s.ball.x, s.ball.y, s.ball.r * 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff8e7'
      ctx.beginPath()
      ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2)
      ctx.fill()

      if (!s.ended) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [config, onDone])

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!running) return
    const rect = e.currentTarget.getBoundingClientRect()
    pointerX.current = (e.clientX - rect.left) / rect.width
  }

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <span>
          Hits <strong>{score}</strong> / {config.target}
        </span>
        <span>
          Lives <strong>♥♥♥</strong>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerMove={move}
        onPointerDown={move}
        aria-label="Wall Zap playfield"
      />
      <p className="game-hint">Drag to move the paddle. Zap every target.</p>
    </div>
  )
}
