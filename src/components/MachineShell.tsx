import type { Machine, ShellStyle } from '../types'
import { MACHINE_META, SHELL_STYLES } from '../types'

interface Props {
  machine: Pick<Machine, 'name' | 'type' | 'shell' | 'author' | 'remixedFrom'>
  compact?: boolean
  onClick?: () => void
  active?: boolean
}

export function MachineShell({ machine, compact, onClick, active }: Props) {
  const style = SHELL_STYLES[machine.shell as ShellStyle]
  const meta = MACHINE_META[machine.type]
  return (
    <button
      type="button"
      className={`machine-shell ${compact ? 'compact' : ''} ${active ? 'active' : ''}`}
      style={
        {
          '--shell-body': style.body,
          '--shell-screen': style.screen,
          '--shell-trim': style.trim,
        } as React.CSSProperties
      }
      onClick={onClick}
      aria-label={`${machine.name}, ${meta.label}`}
    >
      <span className="machine-marquee">{machine.name}</span>
      <span className="machine-screen">
        <span className="machine-glyph">{meta.glyph}</span>
      </span>
      <span className="machine-base" />
      {!compact && (
        <span className="machine-credit">
          by {machine.author}
          {machine.remixedFrom ? ' · remix' : ''}
        </span>
      )}
    </button>
  )
}
