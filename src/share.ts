import type { AtticState, DecorId, FloorTheme, Machine, MachineType, ShellStyle } from './types'
import { DECOR_CATALOG, GRID_SIZE } from './types'

/** Compact attic snapshot for shareable codes / URL hashes (no friends). */
export interface ShareSnapshot {
  v: 2
  n: string
  c: string
  f: FloorTheme
  d: (number | null)[]
  m: Array<{
    n: string
    t: MachineType
    cell: number
    s: ShellStyle
    a: string
    rf?: string
    ra?: string
    cfg: [number, number, number, string]
    hs: number
  }>
}

const DECOR_IDS = Object.keys(DECOR_CATALOG) as DecorId[]

function decorIndex(id: DecorId | null): number | null {
  if (id === null) return null
  const i = DECOR_IDS.indexOf(id)
  return i >= 0 ? i : null
}

function decorFromIndex(i: number | null): DecorId | null {
  if (i === null || i < 0 || i >= DECOR_IDS.length) return null
  return DECOR_IDS[i]
}

export function toSnapshot(attic: AtticState): ShareSnapshot {
  return {
    v: 2,
    n: attic.name,
    c: attic.code,
    f: attic.floorTheme,
    d: attic.cells.map(decorIndex),
    m: attic.machines.map((machine) => ({
      n: machine.name,
      t: machine.type,
      cell: machine.cell,
      s: machine.shell,
      a: machine.author,
      rf: machine.remixedFrom,
      ra: machine.remixedFromAuthor,
      cfg: [
        machine.config.speed,
        machine.config.target,
        machine.config.lives,
        machine.config.accent,
      ],
      hs: machine.highScore,
    })),
  }
}

export function fromSnapshot(snap: ShareSnapshot, codeOverride?: string): Omit<
  AtticState,
  'friends' | 'selectedDecor' | 'selectedShell' | 'partyOpen' | 'createdAt' | 'compliments' | 'visitCount'
> & {
  compliments: AtticState['compliments']
  visitCount: number
} {
  const cells = Array.from({ length: GRID_SIZE }, (_, i) =>
    decorFromIndex(snap.d[i] ?? null),
  ) as AtticState['cells']

  const machines: Machine[] = snap.m.map((m, idx) => ({
    id: `share-m-${idx}-${m.cell}`,
    name: m.n,
    type: m.t,
    cell: m.cell,
    shell: m.s,
    author: m.a,
    remixedFrom: m.rf,
    remixedFromAuthor: m.ra,
    config: {
      speed: m.cfg[0],
      target: m.cfg[1],
      lives: m.cfg[2],
      accent: m.cfg[3],
    },
    highScore: m.hs,
  }))

  return {
    name: snap.n,
    code: codeOverride ?? snap.c,
    cells,
    machines,
    floorTheme: snap.f ?? 'plank',
    compliments: [],
    visitCount: 0,
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Encode attic into a portable share token (prefix `AA2.`). */
export function encodeShareToken(attic: AtticState): string {
  const json = JSON.stringify(toSnapshot(attic))
  const bytes = new TextEncoder().encode(json)
  return `AA2.${bytesToBase64Url(bytes)}`
}

export function decodeShareToken(token: string): ShareSnapshot | null {
  try {
    const raw = token.trim()
    if (!raw.startsWith('AA2.')) return null
    const bytes = base64UrlToBytes(raw.slice(4))
    const json = new TextDecoder().decode(bytes)
    const snap = JSON.parse(json) as ShareSnapshot
    if (snap.v !== 2 || !snap.n || !Array.isArray(snap.m)) return null
    return snap
  } catch {
    return null
  }
}

export function buildVisitHash(attic: AtticState): string {
  return `#visit=${encodeURIComponent(encodeShareToken(attic))}`
}

export function parseVisitFromLocation(): ShareSnapshot | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (hash.startsWith('#visit=')) {
    return decodeShareToken(decodeURIComponent(hash.slice('#visit='.length)))
  }
  const params = new URLSearchParams(window.location.search)
  const q = params.get('visit')
  if (q) return decodeShareToken(q)
  return null
}

const SHARE_BOOK_KEY = 'arcade-attic-share-book-v2'

/** Local registry so short codes work on the same device / browser. */
export function publishShortCode(attic: AtticState): void {
  try {
    const book = JSON.parse(localStorage.getItem(SHARE_BOOK_KEY) || '{}') as Record<
      string,
      ShareSnapshot
    >
    book[attic.code.toUpperCase()] = toSnapshot(attic)
    localStorage.setItem(SHARE_BOOK_KEY, JSON.stringify(book))
  } catch {
    /* ignore quota */
  }
}

export function lookupShortCode(code: string): ShareSnapshot | null {
  try {
    const book = JSON.parse(localStorage.getItem(SHARE_BOOK_KEY) || '{}') as Record<
      string,
      ShareSnapshot
    >
    return book[code.toUpperCase()] ?? null
  } catch {
    return null
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}
