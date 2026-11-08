import { FRIEND_MACHINE_GALLERY } from '../data/friends'
import type { FriendMachineOffer } from '../types'
import { MACHINE_META } from '../types'
import { MachineShell } from './MachineShell'

interface Props {
  onClose: () => void
  onRemix: (offer: FriendMachineOffer) => void
}

export function Gallery({ onClose, onRemix }: Props) {
  return (
    <div className="overlay">
      <div className="sheet gallery-sheet">
        <header>
          <h2>Friends’ machines</h2>
          <p>Remix into your attic — credit stays with the original author.</p>
        </header>

        <ul className="gallery-list">
          {FRIEND_MACHINE_GALLERY.map((offer) => (
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
