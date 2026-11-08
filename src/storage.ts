import type { AtticState } from './types'
import { GRID_SIZE } from './types'
import { makeInviteCode } from './data/friends'

const KEY = 'arcade-attic-v1'

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function createStarterAttic(name: string): AtticState {
  const cells = Array.from({ length: GRID_SIZE }, () => null) as AtticState['cells']
  // Seed a cozy starter corner so the attic never feels blank.
  cells[0] = 'lamp'
  cells[1] = 'poster'
  cells[6] = 'rug'
  cells[7] = 'beanbag'
  cells[12] = 'crate'
  cells[18] = 'rafter'

  return {
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
  }
}

export function loadAttic(): AtticState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as AtticState
  } catch {
    return null
  }
}

export function saveAttic(state: AtticState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearAttic(): void {
  localStorage.removeItem(KEY)
}
