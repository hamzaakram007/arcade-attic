import type { AtticState, DecorId, Machine } from '../types'
import { DECOR_CATALOG, GRID_COLS, GRID_ROWS, SHELL_STYLES } from '../types'
import { MachineShell } from './MachineShell'

interface Props {
  attic: AtticState
  mode: 'build' | 'place-machine' | 'visit'
  placingMachineId?: string | null
  onSelectCell: (index: number) => void
  onSelectMachine: (machine: Machine) => void
  onSelectDecor: (id: DecorId | null) => void
  onOpenWorkshop: () => void
  onOpenParty: () => void
  onOpenGallery: () => void
  onReset: () => void
  toast?: string | null
}

export function AtticView({
  attic,
  mode,
  placingMachineId,
  onSelectCell,
  onSelectMachine,
  onSelectDecor,
  onOpenWorkshop,
  onOpenParty,
  onOpenGallery,
  onReset,
  toast,
}: Props) {
  const machineAt = (cell: number) => attic.machines.find((m) => m.cell === cell)

  return (
    <div className="attic-screen">
      <header className="attic-top">
        <div>
          <p className="brand sm">Arcade Attic</p>
          <h1>{attic.name}</h1>
          <p className="muted">
            Code <strong>{attic.code}</strong>
            {attic.partyOpen ? ' · party open' : ''}
            {attic.friends.length > 0 ? ` · ${attic.friends.length} visiting` : ''}
          </p>
        </div>
        <div className="attic-actions">
          <button type="button" className="btn ghost tight" onClick={onOpenGallery}>
            Remix gallery
          </button>
          <button type="button" className="btn ghost tight" onClick={onOpenParty}>
            Party
          </button>
          <button type="button" className="btn ghost tight" onClick={onReset}>
            New attic
          </button>
        </div>
      </header>

      {toast && <div className="toast">{toast}</div>}

      <div className="attic-stage">
        <div
          className="attic-grid"
          style={{ '--cols': GRID_COLS, '--rows': GRID_ROWS } as React.CSSProperties}
        >
          {attic.cells.map((decor, i) => {
            const machine = machineAt(i)
            const isPlacing = mode === 'place-machine' && placingMachineId
            return (
              <button
                key={i}
                type="button"
                className={`cell ${decor ? 'has-decor' : ''} ${machine ? 'has-machine' : ''} ${
                  isPlacing ? 'place-target' : ''
                }`}
                onClick={() => {
                  if (machine && mode !== 'place-machine') onSelectMachine(machine)
                  else onSelectCell(i)
                }}
              >
                {decor && (
                  <span className="decor" title={DECOR_CATALOG[decor].label}>
                    {DECOR_CATALOG[decor].glyph}
                  </span>
                )}
                {machine && (
                  <span className="cell-machine">
                    <MachineShell machine={machine} compact active />
                  </span>
                )}
                {!decor && !machine && <span className="cell-empty" />}
              </button>
            )
          })}
        </div>

        {attic.friends.length > 0 && (
          <div className="visitor-rail" aria-label="Visiting friends">
            {attic.friends.map((f) => (
              <span key={f.id} className="visitor" style={{ background: f.color }} title={f.name}>
                {f.name[0]}
                <em>{f.status === 'playing' ? '▶' : ''}</em>
              </span>
            ))}
          </div>
        )}
      </div>

      {mode !== 'visit' && (
        <footer className="build-dock">
          <div className="dock-section">
            <span className="dock-label">Décor</span>
            <div className="dock-scroll">
              {(Object.keys(DECOR_CATALOG) as DecorId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`dock-item ${attic.selectedDecor === id ? 'active' : ''}`}
                  onClick={() => onSelectDecor(id)}
                >
                  <span>{DECOR_CATALOG[id].glyph}</span>
                  <small>{DECOR_CATALOG[id].label}</small>
                </button>
              ))}
              <button
                type="button"
                className={`dock-item ${attic.selectedDecor === null ? 'active' : ''}`}
                onClick={() => onSelectDecor(null)}
              >
                <span>🧹</span>
                <small>Clear tile</small>
              </button>
            </div>
          </div>
          <div className="dock-cta">
            <button type="button" className="btn primary" onClick={onOpenWorkshop}>
              + New machine
            </button>
            <p className="dock-tip">
              Tap a tile to place décor. Tap a cabinet to play. Shell preview:{' '}
              <span style={{ color: SHELL_STYLES[attic.selectedShell].trim }}>
                {SHELL_STYLES[attic.selectedShell].label}
              </span>
            </p>
          </div>
        </footer>
      )}

      {mode === 'visit' && (
        <footer className="build-dock visit">
          <p>You’re visiting — play cabinets, leave compliments (no open chat).</p>
        </footer>
      )}
    </div>
  )
}
