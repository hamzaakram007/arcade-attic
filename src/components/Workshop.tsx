import { useMemo, useState } from 'react'
import type {
  DifficultyPreset,
  Machine,
  MachineConfig,
  MachineType,
  ShellStyle,
} from '../types'
import {
  DEFAULT_CONFIGS,
  DIFFICULTY_PRESETS,
  MACHINE_META,
  SHELL_STYLES,
} from '../types'
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

type Step = 'game' | 'look' | 'feel' | 'name'

function guessPreset(config: MachineConfig): DifficultyPreset {
  if (config.speed <= 1) return 'chill'
  if (config.speed >= 3 || config.lives <= 2) return 'spicy'
  return 'classic'
}

export function Workshop({ initial, onCancel, onSave }: Props) {
  const remixing = Boolean(initial?.remixedFrom)
  const [step, setStep] = useState<Step>(remixing ? 'feel' : 'game')
  const [type, setType] = useState<MachineType>(initial?.type ?? 'orb-catch')
  const [name, setName] = useState(
    initial?.name ?? (remixing ? 'My Remix' : 'My Glow Cabinet'),
  )
  const [shell, setShell] = useState<ShellStyle>(initial?.shell ?? 'copper')
  const [config, setConfig] = useState<MachineConfig>(
    initial?.config ?? { ...DEFAULT_CONFIGS['orb-catch'] },
  )
  const [preset, setPreset] = useState<DifficultyPreset>(
    initial?.config ? guessPreset(initial.config) : 'classic',
  )
  const [showKnobs, setShowKnobs] = useState(false)

  const steps: Step[] = remixing ? ['feel', 'look', 'name'] : ['game', 'look', 'feel', 'name']
  const stepIndex = steps.indexOf(step)

  const preview = useMemo(
    () => ({
      name: name || 'Untitled',
      type,
      shell,
      author: 'You' as const,
      remixedFrom: initial?.remixedFrom,
    }),
    [name, type, shell, initial?.remixedFrom],
  )

  const applyPreset = (p: DifficultyPreset) => {
    setPreset(p)
    const base = DEFAULT_CONFIGS[type]
    setConfig({
      ...base,
      ...DIFFICULTY_PRESETS[p].patch,
      accent: config.accent || base.accent,
      // lane-dash classic target differs
      target:
        DIFFICULTY_PRESETS[p].patch.target ??
        (type === 'lane-dash' ? 15 : type === 'wall-zap' ? 8 : 12),
    })
  }

  const switchType = (t: MachineType) => {
    setType(t)
    const base = { ...DEFAULT_CONFIGS[t], accent: config.accent || DEFAULT_CONFIGS[t].accent }
    setConfig({ ...base, ...DIFFICULTY_PRESETS[preset].patch, accent: base.accent })
  }

  const next = () => {
    const i = steps.indexOf(step)
    if (i < steps.length - 1) setStep(steps[i + 1])
  }
  const back = () => {
    const i = steps.indexOf(step)
    if (i > 0) setStep(steps[i - 1])
    else onCancel()
  }

  return (
    <div className="overlay">
      <div className="sheet workshop">
        <header>
          <p className="brand sm">{remixing ? 'Remix' : 'Workshop'}</p>
          <h2>
            {step === 'game' && '1 · Pick a game'}
            {step === 'look' && `${remixing ? '1' : '2'} · Pick a shell`}
            {step === 'feel' && `${remixing ? '2' : '3'} · How hard?`}
            {step === 'name' && `${remixing ? '3' : '4'} · Name it`}
          </h2>
          <p>
            {remixing
              ? `Remix of ${initial?.remixedFromAuthor ?? 'a friend'} — tweak and place.`
              : 'Three taps and you’re done. No coding.'}
          </p>
          <div className="step-dots" aria-hidden>
            {steps.map((s, i) => (
              <span key={s} className={i <= stepIndex ? 'on' : ''} />
            ))}
          </div>
        </header>

        {step === 'game' && (
          <div className="type-pick triple">
            {(Object.keys(MACHINE_META) as MachineType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={type === t ? 'active' : ''}
                onClick={() => switchType(t)}
              >
                <span className="type-glyph">{MACHINE_META[t].glyph}</span>
                <strong>{MACHINE_META[t].label}</strong>
                <small>{MACHINE_META[t].blurb}</small>
              </button>
            ))}
          </div>
        )}

        {step === 'look' && (
          <>
            <div className="shell-grid">
              {(Object.keys(SHELL_STYLES) as ShellStyle[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`shell-card ${shell === s ? 'active' : ''}`}
                  onClick={() => setShell(s)}
                >
                  <MachineShell
                    machine={{ name: SHELL_STYLES[s].label, type, shell: s, author: 'You' }}
                    compact
                  />
                </button>
              ))}
            </div>
            <label className="accent-row">
              Glow color
              <input
                type="color"
                value={config.accent}
                onChange={(e) => setConfig({ ...config, accent: e.target.value })}
                aria-label="Accent color"
              />
            </label>
          </>
        )}

        {step === 'feel' && (
          <>
            <div className="preset-row">
              {(Object.keys(DIFFICULTY_PRESETS) as DifficultyPreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`preset-card ${preset === p ? 'active' : ''}`}
                  onClick={() => applyPreset(p)}
                >
                  <strong>{DIFFICULTY_PRESETS[p].label}</strong>
                  <small>{DIFFICULTY_PRESETS[p].hint}</small>
                </button>
              ))}
            </div>
            <p className="muted tip-line">{MACHINE_META[type].tip}</p>
            <button
              type="button"
              className="btn ghost tight"
              onClick={() => setShowKnobs((v) => !v)}
            >
              {showKnobs ? 'Hide extra knobs' : 'More knobs (optional)'}
            </button>
            {showKnobs && (
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
                    max={24}
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
              </div>
            )}
          </>
        )}

        {step === 'name' && (
          <>
            <label>
              Machine name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={28}
                aria-label="Machine name"
                autoFocus
              />
            </label>
            <div className="workshop-preview big">
              <MachineShell machine={preview} />
            </div>
            <p className="muted center">
              {MACHINE_META[type].label} · {SHELL_STYLES[shell].label} ·{' '}
              {DIFFICULTY_PRESETS[preset].label}
            </p>
          </>
        )}

        <div className="sheet-actions workshop-nav">
          <button type="button" className="btn ghost" onClick={back}>
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </button>
          {step !== 'name' ? (
            <button type="button" className="btn primary" onClick={next}>
              Next
            </button>
          ) : (
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
              {remixing ? 'Place remix' : 'Place in attic'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
