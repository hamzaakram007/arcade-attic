import { useCallback, useState } from 'react'
import type { Machine } from '../types'
import { MACHINE_META } from '../types'
import { LaneDash } from '../games/LaneDash'
import { OrbCatch } from '../games/OrbCatch'
import { WallZap } from '../games/WallZap'
import { MachineShell } from './MachineShell'

interface Props {
  machine: Machine
  onClose: () => void
  onScore: (machineId: string, score: number) => void
  onRemixMine?: (machine: Machine) => void
}

export function PlayModal({ machine, onClose, onScore, onRemixMine }: Props) {
  const [result, setResult] = useState<{ score: number; won: boolean } | null>(null)
  const [nonce, setNonce] = useState(0)

  const finish = useCallback(
    (score: number, won: boolean) => {
      setResult({ score, won })
      onScore(machine.id, score)
    },
    [machine.id, onScore],
  )

  const game =
    machine.type === 'orb-catch' ? (
      <OrbCatch key={nonce} config={machine.config} onDone={finish} />
    ) : machine.type === 'wall-zap' ? (
      <WallZap key={nonce} config={machine.config} onDone={finish} />
    ) : (
      <LaneDash key={nonce} config={machine.config} onDone={finish} />
    )

  return (
    <div className="overlay">
      <div className="sheet play-sheet">
        <header className="play-head">
          <MachineShell machine={machine} compact />
          <div>
            <h2>{machine.name}</h2>
            <p>
              {MACHINE_META[machine.type].label} · by {machine.author}
              {machine.remixedFromAuthor
                ? ` · remix of ${machine.remixedFromAuthor}`
                : ''}
            </p>
          </div>
          <button type="button" className="btn ghost tight" onClick={onClose}>
            Close
          </button>
        </header>

        {!result ? (
          game
        ) : (
          <div className="play-result">
            <p className={`result-badge ${result.won ? 'win' : ''}`}>
              {result.won ? 'Clear!' : 'Try again'}
            </p>
            <p className="result-score">Score {result.score}</p>
            <p className="muted">
              Best on this cabinet: {Math.max(machine.highScore, result.score)}
            </p>
            <div className="sheet-actions">
              <button type="button" className="btn ghost" onClick={onClose}>
                Back to attic
              </button>
              {onRemixMine && (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => onRemixMine(machine)}
                >
                  Remix this
                </button>
              )}
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setResult(null)
                  setNonce((n) => n + 1)
                }}
              >
                Play again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
