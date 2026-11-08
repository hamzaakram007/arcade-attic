import { useState } from 'react'
import { SAMPLE_JOIN_CODES } from '../data/friends'

interface Props {
  onCreate: (name: string) => void
  onJoin: (code: string) => void
  hasSave: boolean
  onContinue: () => void
}

export function Welcome({ onCreate, onJoin, hasSave, onContinue }: Props) {
  const [name, setName] = useState('Loft Lab')
  const [code, setCode] = useState('')

  return (
    <div className="welcome">
      <div className="welcome-sky" aria-hidden />
      <header className="welcome-hero">
        <p className="brand">Arcade Attic</p>
        <h1>Build your clubhouse. Drop in tiny games.</h1>
        <p className="lede">
          Creation first, party play second. Friends &amp; family only — no stranger chat.
        </p>
      </header>

      <div className="welcome-panels">
        {hasSave && (
          <button type="button" className="panel continue" onClick={onContinue}>
            Continue your attic
          </button>
        )}

        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault()
            onCreate(name)
          }}
        >
          <h2>Start a new attic</h2>
          <label>
            Attic name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Loft Lab"
              required
            />
          </label>
          <button type="submit" className="btn primary">
            Build attic
          </button>
        </form>

        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault()
            if (code.trim()) onJoin(code.trim().toUpperCase())
          }}
        >
          <h2>Visit a friend’s attic</h2>
          <label>
            Friend code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ATTIC-DEMO"
              maxLength={16}
            />
          </label>
          <div className="chip-row">
            {SAMPLE_JOIN_CODES.map((c) => (
              <button key={c} type="button" className="chip" onClick={() => setCode(c)}>
                {c}
              </button>
            ))}
          </div>
          <button type="submit" className="btn ghost" disabled={!code.trim()}>
            Peek inside
          </button>
        </form>
      </div>
    </div>
  )
}
