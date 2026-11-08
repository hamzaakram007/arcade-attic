import { SAMPLE_FRIENDS } from '../data/friends'
import type { AtticState, Friend, Machine } from '../types'

interface Props {
  attic: AtticState
  onClose: () => void
  onSimulateJoin: (friend: Friend) => void
  onFriendPlay: (friendId: string, machine: Machine) => void
  onToggleParty: () => void
}

export function PartyPanel({
  attic,
  onClose,
  onSimulateJoin,
  onFriendPlay,
  onToggleParty,
}: Props) {
  const available = SAMPLE_FRIENDS.filter((f) => !attic.friends.some((x) => x.id === f.id))

  return (
    <div className="overlay">
      <div className="sheet party-sheet">
        <header>
          <h2>Attic party</h2>
          <p>Invite approved pals — no open stranger lobby.</p>
        </header>

        <div className="invite-card">
          <span className="label">Your friend code</span>
          <strong className="code">{attic.code}</strong>
          <p className="muted">Share with siblings or classmates you know in real life.</p>
          <button type="button" className="btn primary" onClick={onToggleParty}>
            {attic.partyOpen ? 'Party is open' : 'Open party for friends'}
          </button>
        </div>

        <section>
          <h3>In your attic now</h3>
          {attic.friends.length === 0 ? (
            <p className="muted">Nobody visiting yet. Simulate a friend join below.</p>
          ) : (
            <ul className="friend-list">
              {attic.friends.map((f) => (
                <li key={f.id}>
                  <span className="avatar" style={{ background: f.color }}>
                    {f.name[0]}
                  </span>
                  <div>
                    <strong>{f.name}</strong>
                    <small>
                      {f.status === 'playing'
                        ? `Playing ${attic.machines.find((m) => m.id === f.playingMachineId)?.name ?? 'a cabinet'}`
                        : f.status}
                    </small>
                  </div>
                  {attic.machines[0] && f.status !== 'playing' && (
                    <button
                      type="button"
                      className="btn ghost tight"
                      onClick={() => onFriendPlay(f.id, attic.machines[0])}
                    >
                      Let them play
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Simulate friend join</h3>
          <div className="chip-row wrap">
            {available.map((f) => (
              <button
                key={f.id}
                type="button"
                className="chip"
                style={{ borderColor: f.color }}
                onClick={() => onSimulateJoin(f)}
                disabled={!attic.partyOpen}
              >
                + {f.name}
              </button>
            ))}
            {available.length === 0 && <p className="muted">All sample pals are here.</p>}
          </div>
          {!attic.partyOpen && (
            <p className="muted warn">Open the party first so friends can drop in.</p>
          )}
        </section>

        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Back to attic
          </button>
        </div>
      </div>
    </div>
  )
}
