import { useState } from 'react'
import { SAMPLE_FRIENDS } from '../data/friends'
import {
  buildVisitHash,
  copyText,
  encodeShareToken,
  publishShortCode,
} from '../share'
import type { AtticState, Friend, Machine } from '../types'

interface Props {
  attic: AtticState
  onClose: () => void
  onSimulateJoin: (friend: Friend) => void
  onFriendPlay: (friendId: string, machine: Machine) => void
  onToggleParty: () => void
  onCheer: (friendId: string) => void
}

export function PartyPanel({
  attic,
  onClose,
  onSimulateJoin,
  onFriendPlay,
  onToggleParty,
  onCheer,
}: Props) {
  const available = SAMPLE_FRIENDS.filter((f) => !attic.friends.some((x) => x.id === f.id))
  const [copied, setCopied] = useState<'code' | 'link' | 'token' | null>(null)

  const flashCopy = (kind: 'code' | 'link' | 'token') => {
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const shareLink = () => {
    publishShortCode(attic)
    const url = `${window.location.origin}${window.location.pathname}${buildVisitHash(attic)}`
    return url
  }

  return (
    <div className="overlay">
      <div className="sheet party-sheet">
        <header>
          <h2>Attic party</h2>
          <p>Invite approved pals — stickers &amp; cheers only, no open chat.</p>
        </header>

        <div className="invite-card">
          <span className="label">Your shareable attic code</span>
          <strong className="code">{attic.code}</strong>
          <p className="muted">
            Friends type this code on the welcome screen. Opening a party also saves it on this
            device.
          </p>
          <div className="chip-row">
            <button
              type="button"
              className="btn tight"
              onClick={async () => {
                publishShortCode(attic)
                if (await copyText(attic.code)) flashCopy('code')
              }}
            >
              {copied === 'code' ? 'Copied!' : 'Copy code'}
            </button>
            <button
              type="button"
              className="btn tight"
              onClick={async () => {
                if (await copyText(shareLink())) flashCopy('link')
              }}
            >
              {copied === 'link' ? 'Link copied!' : 'Copy visit link'}
            </button>
            <button
              type="button"
              className="btn tight"
              onClick={async () => {
                if (await copyText(encodeShareToken(attic))) flashCopy('token')
              }}
            >
              {copied === 'token' ? 'Token copied!' : 'Copy attic token'}
            </button>
          </div>
          <button type="button" className="btn primary" onClick={onToggleParty}>
            {attic.partyOpen ? 'Party is open ✓' : 'Open party for friends'}
          </button>
        </div>

        {attic.compliments.length > 0 && (
          <section>
            <h3>Compliments wall</h3>
            <ul className="compliment-list">
              {attic.compliments
                .slice()
                .reverse()
                .slice(0, 8)
                .map((c) => (
                  <li key={c.id}>
                    <span>
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
                    <span>
                      <strong>{c.from}</strong>
                      <small> left a sticker</small>
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}

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
                        : f.status === 'cheering'
                          ? 'Cheering (no chat)'
                          : 'Visiting'}
                    </small>
                  </div>
                  <div className="friend-actions">
                    {attic.machines[0] && f.status !== 'playing' && (
                      <button
                        type="button"
                        className="btn ghost tight"
                        onClick={() => onFriendPlay(f.id, attic.machines[0])}
                      >
                        Let play
                      </button>
                    )}
                    {f.status !== 'cheering' && (
                      <button
                        type="button"
                        className="btn ghost tight"
                        onClick={() => onCheer(f.id)}
                      >
                        Cheer
                      </button>
                    )}
                  </div>
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
