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
  hp: number
  maxHp: number
  kind: 'normal' | 'bonus'
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
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
    sparks: [] as Spark[],
    score: 0,
    lives: config.lives,
    ended: false,
    ready: false,
    trail: [] as { x: number; y: number }[],
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
    const cols = 5
    const rows = 3
    const gap = 8
    const tw = (cssW - gap * (cols + 1)) / cols
    const th = 16
    const targets: Target[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bonus = r === 0 && c === Math.floor(cols / 2)
        targets.push({
          x: gap + c * (tw + gap),
          y: 24 + r * (th + gap),
          w: tw,
          h: th,
          hp: bonus ? 1 : r === 0 ? 2 : 1,
          maxHp: bonus ? 1 : r === 0 ? 2 : 1,
          kind: bonus ? 'bonus' : 'normal',
        })
      }
    }

    const resetBall = () => {
      state.current.ball = {
        x: cssW / 2,
        y: cssH - 60,
        vx: speed * (Math.random() > 0.5 ? 1 : -1) * 0.85,
        vy: -speed,
        r: 8,
      }
      state.current.trail = []
    }

    const burst = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10
        state.current.sparks.push({
          x,
          y,
          vx: Math.cos(a) * (1.5 + Math.random()),
          vy: Math.sin(a) * (1.5 + Math.random()),
          life: 18 + Math.random() * 10,
          color,
        })
      }
    }

    state.current.targets = targets
    state.current.paddle.w = Math.max(52, 92 - config.speed * 7)
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
      s.trail.push({ x: s.ball.x, y: s.ball.y })
      if (s.trail.length > 8) s.trail.shift()

      if (s.ball.x - s.ball.r < 0) {
        s.ball.x = s.ball.r
        s.ball.vx = Math.abs(s.ball.vx)
      }
      if (s.ball.x + s.ball.r > cssW) {
        s.ball.x = cssW - s.ball.r
        s.ball.vx = -Math.abs(s.ball.vx)
      }
      if (s.ball.y - s.ball.r < 0) {
        s.ball.y = s.ball.r
        s.ball.vy = Math.abs(s.ball.vy)
      }

      const py = cssH - 28
      if (
        s.ball.vy > 0 &&
        s.ball.y + s.ball.r >= py &&
        s.ball.y + s.ball.r <= py + s.paddle.h + 10 &&
        s.ball.x >= s.paddle.x - 2 &&
        s.ball.x <= s.paddle.x + pw + 2
      ) {
        s.ball.vy = -Math.abs(s.ball.vy) * 1.02
        const hit = (s.ball.x - (s.paddle.x + pw / 2)) / (pw / 2)
        s.ball.vx = speed * hit * 1.25
        // center power bounce
        if (Math.abs(hit) < 0.2) {
          s.ball.vy *= 1.15
          burst(s.ball.x, py, '#fff8e7')
        }
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
        if (t.hp <= 0) continue
        if (
          s.ball.x + s.ball.r > t.x &&
          s.ball.x - s.ball.r < t.x + t.w &&
          s.ball.y + s.ball.r > t.y &&
          s.ball.y - s.ball.r < t.y + t.h
        ) {
          t.hp -= 1
          s.ball.vy *= -1
          s.ball.y += s.ball.vy
          const pts = t.kind === 'bonus' ? 3 : 1
          if (t.hp <= 0) {
            s.score += pts
            setScore(s.score)
            burst(t.x + t.w / 2, t.y + t.h / 2, t.kind === 'bonus' ? '#ffd166' : config.accent)
          }
          const cleared = s.targets.every((x) => x.hp <= 0)
          if (s.score >= config.target || cleared) {
            s.ended = true
            setRunning(false)
            onDone(Math.max(s.score, cleared ? config.target : s.score), true)
          }
        }
      }

      s.sparks = s.sparks.filter((sp) => sp.life > 0)
      for (const sp of s.sparks) {
        sp.x += sp.vx
        sp.y += sp.vy
        sp.life -= 1
      }

      const g = ctx.createLinearGradient(0, 0, 0, cssH)
      g.addColorStop(0, '#1a1512')
      g.addColorStop(1, '#0c0a09')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, cssW, cssH)

      // wall glow
      ctx.fillStyle = 'rgba(255,138,91,0.08)'
      ctx.fillRect(0, 16, cssW, rows * (th + gap) + 20)

      for (const t of s.targets) {
        if (t.hp <= 0) continue
        const alpha = 0.45 + (t.hp / t.maxHp) * 0.55
        ctx.globalAlpha = alpha
        ctx.fillStyle = t.kind === 'bonus' ? '#ffd166' : config.accent
        ctx.beginPath()
        ctx.roundRect(t.x, t.y, t.w, t.h, 4)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillRect(t.x, t.y, t.w, 3)
        if (t.maxHp > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.35)'
          ctx.fillRect(t.x + 4, t.y + t.h - 5, t.w - 8, 2)
          ctx.fillStyle = '#fff8e7'
          ctx.fillRect(t.x + 4, t.y + t.h - 5, ((t.w - 8) * t.hp) / t.maxHp, 2)
        }
        ctx.globalAlpha = 1
      }

      // paddle
      const padGrad = ctx.createLinearGradient(s.paddle.x, 0, s.paddle.x + pw, 0)
      padGrad.addColorStop(0, '#c48a3a')
      padGrad.addColorStop(0.5, '#e9b872')
      padGrad.addColorStop(1, '#c48a3a')
      ctx.fillStyle = padGrad
      ctx.beginPath()
      ctx.roundRect(s.paddle.x, cssH - 28, pw, s.paddle.h, 6)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(s.paddle.x + pw * 0.35, cssH - 26, pw * 0.3, 3)

      for (let i = 0; i < s.trail.length; i++) {
        const t = s.trail[i]
        ctx.globalAlpha = (i + 1) / s.trail.length / 3
        ctx.fillStyle = config.accent
        ctx.beginPath()
        ctx.arc(t.x, t.y, s.ball.r * 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      for (const sp of s.sparks) {
        ctx.globalAlpha = Math.max(0, sp.life / 24)
        ctx.fillStyle = sp.color
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const glow = ctx.createRadialGradient(
        s.ball.x,
        s.ball.y,
        1,
        s.ball.x,
        s.ball.y,
        s.ball.r * 2.4,
      )
      glow.addColorStop(0, '#fff')
      glow.addColorStop(0.4, config.accent)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(s.ball.x, s.ball.y, s.ball.r * 2.4, 0, Math.PI * 2)
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
          Lives <strong>{'♥'.repeat(Math.max(0, lives))}</strong>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerMove={move}
        onPointerDown={move}
        aria-label="Wall Zap playfield"
      />
      <p className="game-hint">
        Drag the paddle. Hit the gold brick for bonus. Center hits power-bounce.
      </p>
    </div>
  )
}
