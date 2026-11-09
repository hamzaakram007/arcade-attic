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
  kind: 'normal' | 'gold' | 'bomb'
  wobble: number
}

interface Pop {
  x: number
  y: number
  life: number
  color: string
  pts: number
}

export function OrbCatch({ config, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(config.lives)
  const [combo, setCombo] = useState(0)
  const [running, setRunning] = useState(true)
  const state = useRef({
    orbs: [] as Orb[],
    pops: [] as Pop[],
    score: 0,
    lives: config.lives,
    combo: 0,
    nextId: 1,
    spawnTimer: 0,
    ended: false,
    shake: 0,
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
      const roll = Math.random()
      const kind: Orb['kind'] = roll > 0.92 ? 'bomb' : roll > 0.78 ? 'gold' : 'normal'
      const r = kind === 'gold' ? 16 + Math.random() * 6 : 13 + Math.random() * 10
      state.current.orbs.push({
        id: state.current.nextId++,
        x: r + Math.random() * (cssW - r * 2),
        y: -r,
        r,
        vy: (1.35 + Math.random() * 1.55) * speedMul * (kind === 'gold' ? 1.15 : 1),
        kind,
        wobble: Math.random() * Math.PI * 2,
      })
    }

    const tick = () => {
      if (state.current.ended) return
      const shake = state.current.shake
      if (shake > 0) state.current.shake *= 0.85

      ctx.save()
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
      ctx.clearRect(-10, -10, cssW + 20, cssH + 20)

      const g = ctx.createLinearGradient(0, 0, 0, cssH)
      g.addColorStop(0, '#1a2422')
      g.addColorStop(0.55, '#121c1a')
      g.addColorStop(1, '#0d1412')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, cssW, cssH)

      ctx.strokeStyle = 'rgba(233,184,114,0.12)'
      for (let i = 0; i < 7; i++) {
        ctx.beginPath()
        ctx.moveTo((cssW / 6) * i + ((Date.now() / 40) % 8), 0)
        ctx.lineTo((cssW / 6) * i, cssH)
        ctx.stroke()
      }

      // attic rafters
      ctx.fillStyle = 'rgba(74,50,36,0.35)'
      ctx.fillRect(0, 0, cssW, 10)

      state.current.spawnTimer -= 1
      if (state.current.spawnTimer <= 0) {
        spawn()
        if (Math.random() > 0.7) spawn()
        state.current.spawnTimer = Math.max(14, 46 - config.speed * 8)
      }

      const kept: Orb[] = []
      for (const orb of state.current.orbs) {
        orb.wobble += 0.08
        orb.x += Math.sin(orb.wobble) * 0.55
        orb.y += orb.vy
        if (orb.y - orb.r > cssH) {
          if (orb.kind !== 'bomb') {
            state.current.lives -= 1
            state.current.combo = 0
            setCombo(0)
            setLives(state.current.lives)
            state.current.shake = 8
            if (state.current.lives <= 0) {
              state.current.ended = true
              setRunning(false)
              onDone(state.current.score, false)
            }
          }
          continue
        }
        kept.push(orb)

        const color =
          orb.kind === 'gold' ? '#ffd166' : orb.kind === 'bomb' ? '#ff5e5e' : config.accent
        const glow = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, orb.r * 1.8)
        glow.addColorStop(0, '#fff8e7')
        glow.addColorStop(0.35, color)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r * 1.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2)
        ctx.fill()
        if (orb.kind === 'gold') {
          ctx.fillStyle = 'rgba(255,255,255,0.55)'
          ctx.beginPath()
          ctx.arc(orb.x - orb.r * 0.25, orb.y - orb.r * 0.25, orb.r * 0.28, 0, Math.PI * 2)
          ctx.fill()
        }
        if (orb.kind === 'bomb') {
          ctx.fillStyle = '#1a120c'
          ctx.font = `bold ${Math.floor(orb.r)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('!', orb.x, orb.y + 1)
        }
      }
      state.current.orbs = kept

      state.current.pops = state.current.pops.filter((p) => p.life > 0)
      for (const p of state.current.pops) {
        p.life -= 1
        p.y -= 0.8
        ctx.globalAlpha = Math.max(0, p.life / 28)
        ctx.fillStyle = p.color
        ctx.font = 'bold 14px Figtree, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`+${p.pts}`, p.x, p.y)
        ctx.beginPath()
        ctx.arc(p.x + 12, p.y + 8, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      ctx.fillStyle = 'rgba(255,138,91,0.4)'
      ctx.fillRect(0, cssH - 6, cssW, 6)
      ctx.restore()

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
      (o) => (o.x - x) ** 2 + (o.y - y) ** 2 <= (o.r + 10) ** 2,
    )
    if (hit < 0) return

    const orb = state.current.orbs[hit]
    state.current.orbs.splice(hit, 1)

    if (orb.kind === 'bomb') {
      state.current.lives -= 1
      state.current.combo = 0
      setCombo(0)
      setLives(state.current.lives)
      state.current.shake = 12
      state.current.pops.push({ x: orb.x, y: orb.y, life: 28, color: '#ff5e5e', pts: 0 })
      if (state.current.lives <= 0) {
        state.current.ended = true
        setRunning(false)
        onDone(state.current.score, false)
      }
      return
    }

    const nextCombo = state.current.combo + 1
    state.current.combo = nextCombo
    setCombo(nextCombo)
    const bonus = orb.kind === 'gold' ? 3 : 1
    const comboBonus = nextCombo >= 5 ? 2 : nextCombo >= 3 ? 1 : 0
    const pts = bonus + comboBonus
    state.current.score += pts
    setScore(state.current.score)
    state.current.pops.push({
      x: orb.x,
      y: orb.y,
      life: 28,
      color: orb.kind === 'gold' ? '#ffd166' : config.accent,
      pts,
    })

    if (state.current.score >= config.target) {
      state.current.ended = true
      setRunning(false)
      onDone(state.current.score, true)
    }
  }

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <span>
          Score <strong>{score}</strong> / {config.target}
        </span>
        <span className={combo >= 3 ? 'combo-hot' : ''}>
          Combo <strong>×{combo}</strong>
        </span>
        <span>
          Lives <strong>{'♥'.repeat(Math.max(0, lives))}</strong>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerDown={handlePointer}
        aria-label="Orb Catch playfield"
      />
      <p className="game-hint">
        Tap glow orbs · gold = bonus · red bangs steal a life. Chain hits for combo.
      </p>
    </div>
  )
}
