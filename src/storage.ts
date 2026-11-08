import type { AtticState, DecorId, FloorTheme } from './types'
import { GRID_SIZE } from './types'
import { makeInviteCode } from './data/friends'
import { publishShortCode } from './share'

const KEY = 'arcade-attic-v2'
const LEGACY_KEY = 'arcade-attic-v1'

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function migrate(raw: Record<string, unknown>): AtticState {
  const cells = Array.isArray(raw.cells)
    ? (raw.cells as AtticState['cells']).slice(0, GRID_SIZE)
    : Array.from({ length: GRID_SIZE }, () => null)
  while (cells.length < GRID_SIZE) cells.push(null)

  return {
    name: typeof raw.name === 'string' ? raw.name : 'My Attic',
    code: typeof raw.code === 'string' ? raw.code : makeInviteCode(),
    cells,
    machines: Array.isArray(raw.machines) ? (raw.machines as AtticState['machines']) : [],
    friends: Array.isArray(raw.friends) ? (raw.friends as AtticState['friends']) : [],
    selectedDecor: (raw.selectedDecor as DecorId | null) ?? 'lamp',
    selectedShell: (raw.selectedShell as AtticState['selectedShell']) ?? 'copper',
    partyOpen: Boolean(raw.partyOpen),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    floorTheme: (raw.floorTheme as FloorTheme) ?? 'plank',
    compliments: Array.isArray(raw.compliments)
      ? (raw.compliments as AtticState['compliments'])
      : [],
    visitCount: typeof raw.visitCount === 'number' ? raw.visitCount : 0,
  }
}

export function createStarterAttic(name: string): AtticState {
  const cells = Array.from({ length: GRID_SIZE }, () => null) as AtticState['cells']
  cells[0] = 'lamp'
  cells[1] = 'poster'
  cells[2] = 'banner'
  cells[5] = 'window'
  cells[6] = 'rug'
  cells[7] = 'beanbag'
  cells[11] = 'jukebox'
  cells[12] = 'crate'
  cells[17] = 'snack'
  cells[18] = 'rafter'
  cells[23] = 'stool'
  cells[24] = 'ticket'

  const attic: AtticState = {
    name: name.trim() || 'My Attic',
    code: makeInviteCode(),
    cells,
    machines: [
      {
        id: uid('m'),
        name: 'Starter Orb Box',
        type: 'orb-catch',
        cell: 14,
        shell: 'teal',
        author: 'You',
        config: { speed: 2, target: 10, lives: 3, accent: '#2ec4b6' },
        highScore: 0,
      },
    ],
    friends: [],
    selectedDecor: 'lamp',
    selectedShell: 'copper',
    partyOpen: false,
    createdAt: Date.now(),
    floorTheme: 'plank',
    compliments: [],
    visitCount: 0,
  }
  publishShortCode(attic)
  return attic
}

export function loadAttic(): AtticState | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const attic = migrate(parsed)
    if (!localStorage.getItem(KEY)) {
      saveAttic(attic)
    }
    return attic
  } catch {
    return null
  }
}

export function saveAttic(state: AtticState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
  if (state.partyOpen) publishShortCode(state)
}

export function clearAttic(): void {
  localStorage.removeItem(KEY)
  localStorage.removeItem(LEGACY_KEY)
}
