import type { AtticState, DecorId, FloorTheme, Machine } from '../types'
import { DECOR_CATALOG, FLOOR_THEMES, GRID_COLS, GRID_ROWS } from '../types'
import { MachineShell } from './MachineShell'

interface Props {
  attic: AtticState
  mode: 'build' | 'place-machine' | 'visit' | 'move-machine'
  placingMachineId?: string | null
  movingMachineId?: string | null
  onSelectCell: (index: number) => void
  onSelectMachine: (machine: Machine) => void
  onSelectDecor: (id: DecorId | null) => void
  onOpenWorkshop: () => void
  onOpenParty: () => void
  onOpenGallery: () => void
  onReset: () => void
  onSetFloor: (theme: FloorTheme) => void
  onStartMove: (machine: Machine) => void
  onDeleteMachine: (machine: Machine) => void
  onLeaveCompliment?: (kind: import('../types').ComplimentId) => void
  toast?: string | null
}

export function AtticView({
  attic,
  mode,
  placingMachineId,
  movingMachineId,
  onSelectCell,
  onSelectMachine,
  onSelectDecor,
  onOpenWorkshop,
  onOpenParty,
  onOpenGallery,
  onReset,
  onSetFloor,
  onStartMove,
  onDeleteMachine,
  onLeaveCompliment,
  toast,
}: Props) {
  const machineAt = (cell: number) => attic.machines.find((m) => m.cell === cell)
  const floor = FLOOR_THEMES[attic.floorTheme]

  return (
    <div className="attic-screen">
      <header className="attic-top">
        <div>
          <p className="brand sm">Arcade Attic</p>
          <h1>{attic.name}</h1>
          <p className="muted">
            Code <strong className="code-inline">{attic.code}</strong>
            {attic.partyOpen ? ' · party open' : ''}
            {attic.friends.length > 0 ? ` · ${attic.friends.length} visiting` : ''}
            {attic.visitCount > 0 ? ` · ${attic.visitCount} peeks` : ''}
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

      {(mode === 'place-machine' || mode === 'move-machine') && (
        <div className="place-banner">
          {mode === 'place-machine'
            ? 'Tap an empty glowing tile to drop your cabinet.'
            : 'Tap an empty tile to move this cabinet.'}
        </div>
      )}

      <div className={`attic-stage ${floor.className}`}>
        <div className="attic-beams" aria-hidden />
        <div
          className="attic-grid"
          style={{ '--cols': GRID_COLS, '--rows': GRID_ROWS } as React.CSSProperties}
        >
          {attic.cells.map((decor, i) => {
            const machine = machineAt(i)
            const isPlacing =
              (mode === 'place-machine' && placingMachineId) ||
              (mode === 'move-machine' && movingMachineId)
            const isMovingSource = movingMachineId && machine?.id === movingMachineId
            return (
              <button
                key={i}
                type="button"
                className={`cell ${decor ? 'has-decor' : ''} ${machine ? 'has-machine' : ''} ${
                  isPlacing && !machine ? 'place-target' : ''
                } ${isMovingSource ? 'moving-source' : ''}`}
                onClick={() => {
                  if (mode === 'move-machine') {
                    onSelectCell(i)
                    return
                  }
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
              <span
                key={f.id}
                className={`visitor ${f.status}`}
                style={{ background: f.color }}
                title={`${f.name} · ${f.status}`}
              >
                {f.name[0]}
                <em>{f.status === 'playing' ? '▶' : f.status === 'cheering' ? '★' : ''}</em>
              </span>
            ))}
          </div>
        )}

        {attic.compliments.length > 0 && (
          <div className="compliment-float" aria-label="Compliments">
            {attic.compliments.slice(-5).map((c) => (
              <span key={c.id} className="comp-chip">
                {c.kind === 'star'
                  ? '⭐'
                  : c.kind === 'fire'
                    ? '🔥'
                    : c.kind === 'heart'
                      ? '💛'
                      : c.kind === 'clap'
                        ? '👏'
                        : '😮'}
              </span>
            ))}
          </div>
        )}
      </div>

      {mode !== 'visit' && (
        <footer className="build-dock">
          <div className="dock-section">
            <span className="dock-label">Floor vibe</span>
            <div className="chip-row">
              {(Object.keys(FLOOR_THEMES) as FloorTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${attic.floorTheme === t ? 'active' : ''}`}
                  onClick={() => onSetFloor(t)}
                >
                  {FLOOR_THEMES[t].label}
                </button>
              ))}
            </div>
          </div>

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

          {attic.machines.length > 0 && (
            <div className="dock-section machine-tools">
              <span className="dock-label">Cabinets</span>
              <div className="dock-scroll">
                {attic.machines.map((m) => (
                  <div key={m.id} className="machine-tool">
                    <span className="machine-tool-name">{m.name}</span>
                    <button
                      type="button"
                      className="btn ghost tight"
                      onClick={() => onStartMove(m)}
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      className="btn ghost tight"
                      onClick={() => onDeleteMachine(m)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dock-cta">
            <button type="button" className="btn primary" onClick={onOpenWorkshop}>
              + New machine
            </button>
            <p className="dock-tip">
              Tap tiles for décor. Author a cabinet in under a minute. Remix friends’ games from
              the gallery.
            </p>
          </div>
        </footer>
      )}

      {mode === 'visit' && (
        <footer className="build-dock visit">
          <p>You’re visiting — play cabinets, leave a compliment (no open chat).</p>
          {onLeaveCompliment && (
            <div className="compliment-bar">
              {(
                [
                  ['star', '⭐'],
                  ['fire', '🔥'],
                  ['heart', '💛'],
                  ['clap', '👏'],
                  ['wow', '😮'],
                ] as const
              ).map(([id, glyph]) => (
                <button
                  key={id}
                  type="button"
                  className="chip compliment-btn"
                  onClick={() => onLeaveCompliment(id)}
                >
                  {glyph}
                </button>
              ))}
            </div>
          )}
        </footer>
      )}
    </div>
  )
}
