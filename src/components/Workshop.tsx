import { useState } from 'react'
import type { Machine, MachineConfig, MachineType, ShellStyle } from '../types'
import { DEFAULT_CONFIGS, MACHINE_META, SHELL_STYLES } from '../types'
import { MachineShell } from './MachineShell'

interface Props {
  initial?: Partial<Machine> & { remixedFrom?: string; remixedFromAuthor?: string }
  onCancel: () => void
  onSave: (draft: {
    name: string
    type: MachineType
    shell: ShellStyle
    config: MachineConfig
    remixedFrom?: string
    remixedFromAuthor?: string
  }) => void
}

export function Workshop({ initial, onCancel, onSave }: Props) {
  const [type, setType] = useState<MachineType>(initial?.type ?? 'orb-catch')
  const [name, setName] = useState(initial?.name ?? 'My Glow Cabinet')
  const [shell, setShell] = useState<ShellStyle>(initial?.shell ?? 'copper')
  const [config, setConfig] = useState<MachineConfig>(
    initial?.config ?? { ...DEFAULT_CONFIGS['orb-catch'] },
  )

  const switchType = (t: MachineType) => {
    setType(t)
    if (!initial?.config) setConfig({ ...DEFAULT_CONFIGS[t] })
  }

  return (
    <div className="overlay">
      <div className="sheet workshop">
        <header>
          <h2>{initial?.remixedFrom ? 'Remix a machine' : 'Author a machine'}</h2>
          <p>Constrained templates — tweak rules, not code.</p>
        </header>

        <div className="type-pick">
          {(Object.keys(MACHINE_META) as MachineType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={type === t ? 'active' : ''}
              onClick={() => switchType(t)}
            >
              <span>{MACHINE_META[t].glyph}</span>
              <strong>{MACHINE_META[t].label}</strong>
              <small>{MACHINE_META[t].blurb}</small>
            </button>
          ))}
        </div>

        <label>
          Machine name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={28} />
        </label>

        <div className="shell-pick">
          <span>Shell</span>
          <div className="chip-row">
            {(Object.keys(SHELL_STYLES) as ShellStyle[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip shell-chip ${shell === s ? 'active' : ''}`}
                style={{ background: SHELL_STYLES[s].body, color: '#fff' }}
                onClick={() => setShell(s)}
              >
                {SHELL_STYLES[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="sliders">
          <label>
            Speed {config.speed}
            <input
              type="range"
              min={1}
              max={4}
              value={config.speed}
              onChange={(e) => setConfig({ ...config, speed: Number(e.target.value) })}
            />
          </label>
          <label>
            Target score {config.target}
            <input
              type="range"
              min={5}
              max={20}
              value={config.target}
              onChange={(e) => setConfig({ ...config, target: Number(e.target.value) })}
            />
          </label>
          <label>
            Lives {config.lives}
            <input
              type="range"
              min={1}
              max={5}
              value={config.lives}
              onChange={(e) => setConfig({ ...config, lives: Number(e.target.value) })}
            />
          </label>
          <label>
            Accent color
            <input
              type="color"
              value={config.accent}
              onChange={(e) => setConfig({ ...config, accent: e.target.value })}
            />
          </label>
        </div>

        <div className="workshop-preview">
          <MachineShell
            machine={{
              name: name || 'Untitled',
              type,
              shell,
              author: initial?.remixedFrom ? 'You' : 'You',
              remixedFrom: initial?.remixedFrom,
            }}
          />
        </div>

        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() =>
              onSave({
                name: name.trim() || MACHINE_META[type].label,
                type,
                shell,
                config,
                remixedFrom: initial?.remixedFrom,
                remixedFromAuthor: initial?.remixedFromAuthor,
              })
            }
          >
            {initial?.remixedFrom ? 'Place remix' : 'Place in attic'}
          </button>
        </div>
      </div>
    </div>
  )
}
