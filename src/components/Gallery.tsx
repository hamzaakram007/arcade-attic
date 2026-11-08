import { FRIEND_MACHINE_GALLERY } from '../data/friends'
import type { FriendMachineOffer, MachineType } from '../types'
import { MACHINE_META } from '../types'
import { MachineShell } from './MachineShell'
import { useMemo, useState } from 'react'

interface Props {
  onClose: () => void
  onRemix: (offer: FriendMachineOffer) => void
}

export function Gallery({ onClose, onRemix }: Props) {
  const [filter, setFilter] = useState<MachineType | 'all'>('all')
  const offers = useMemo(
    () =>
      filter === 'all'
        ? FRIEND_MACHINE_GALLERY
        : FRIEND_MACHINE_GALLERY.filter((o) => o.type === filter),
    [filter],
  )

  return (
    <div className="overlay">
      <div className="sheet gallery-sheet">
        <header>
          <h2>Friends’ machines</h2>
          <p>One tap remix — credit stays with the original author.</p>
        </header>

        <div className="chip-row">
          <button
            type="button"
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {(Object.keys(MACHINE_META) as MachineType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {MACHINE_META[t].glyph} {MACHINE_META[t].label}
            </button>
          ))}
        </div>

        <ul className="gallery-list">
          {offers.map((offer) => (
            <li key={offer.id}>
              <MachineShell
                machine={{
                  name: offer.name,
                  type: offer.type,
                  shell: offer.shell,
                  author: offer.author,
                }}
                compact
              />
              <div className="gallery-meta">
                <strong>{offer.name}</strong>
                <small>
                  {MACHINE_META[offer.type].label} · {offer.author}
                </small>
                <p>{offer.blurb}</p>
                <button type="button" className="btn primary tight" onClick={() => onRemix(offer)}>
                  Remix into my attic
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
