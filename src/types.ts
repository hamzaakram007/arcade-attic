export type Screen =
  | 'welcome'
  | 'attic'
  | 'workshop'
  | 'play'
  | 'party'
  | 'gallery'

export type MachineType = 'orb-catch' | 'wall-zap'

export type DecorId =
  | 'lamp'
  | 'poster'
  | 'beanbag'
  | 'crate'
  | 'plant'
  | 'rug'
  | 'speaker'
  | 'rafter'

export type ShellStyle = 'copper' | 'teal' | 'ember' | 'ink'

export interface MachineConfig {
  speed: number
  target: number
  lives: number
  accent: string
}

export interface Machine {
  id: string
  name: string
  type: MachineType
  cell: number
  shell: ShellStyle
  author: string
  remixedFrom?: string
  remixedFromAuthor?: string
  config: MachineConfig
  highScore: number
}

export interface Friend {
  id: string
  name: string
  color: string
  status: 'visiting' | 'playing' | 'cheering'
  playingMachineId?: string
}

export interface FriendMachineOffer {
  id: string
  name: string
  type: MachineType
  shell: ShellStyle
  author: string
  config: MachineConfig
  blurb: string
}

export interface AtticState {
  name: string
  code: string
  cells: (DecorId | null)[]
  machines: Machine[]
  friends: Friend[]
  selectedDecor: DecorId | null
  selectedShell: ShellStyle
  partyOpen: boolean
  createdAt: number
}

export const GRID_COLS = 6
export const GRID_ROWS = 5
export const GRID_SIZE = GRID_COLS * GRID_ROWS

export const DECOR_CATALOG: Record<
  DecorId,
  { label: string; glyph: string; hint: string }
> = {
  lamp: { label: 'Attic lamp', glyph: '💡', hint: 'Warm glow' },
  poster: { label: 'Pixel poster', glyph: '🖼️', hint: 'Wall art' },
  beanbag: { label: 'Beanbag', glyph: '🪑', hint: 'Sit spot' },
  crate: { label: 'Crate stack', glyph: '📦', hint: 'Storage' },
  plant: { label: 'Dusty fern', glyph: '🌿', hint: 'Life' },
  rug: { label: 'Round rug', glyph: '🟠', hint: 'Floor' },
  speaker: { label: 'Boom box', glyph: '📻', hint: 'Beats' },
  rafter: { label: 'Fairy lights', glyph: '✨', hint: 'Ceiling' },
}

export const SHELL_STYLES: Record<
  ShellStyle,
  { label: string; body: string; screen: string; trim: string }
> = {
  copper: { label: 'Copper', body: '#b56a3a', screen: '#1a2e2b', trim: '#e9b872' },
  teal: { label: 'Teal glow', body: '#1f6f68', screen: '#0b2422', trim: '#7dfff0' },
  ember: { label: 'Ember', body: '#8b3a2a', screen: '#241410', trim: '#ff8a5b' },
  ink: { label: 'Ink wood', body: '#2a211c', screen: '#0e1a22', trim: '#6ec1ff' },
}

export const DEFAULT_CONFIGS: Record<MachineType, MachineConfig> = {
  'orb-catch': { speed: 2, target: 12, lives: 3, accent: '#2ec4b6' },
  'wall-zap': { speed: 2, target: 8, lives: 3, accent: '#ff8a5b' },
}

export const MACHINE_META: Record<
  MachineType,
  { label: string; blurb: string; glyph: string }
> = {
  'orb-catch': {
    label: 'Orb Catch',
    blurb: 'Tap falling glow orbs before they hit the floor.',
    glyph: '🔮',
  },
  'wall-zap': {
    label: 'Wall Zap',
    blurb: 'Slide the paddle and bounce the spark into targets.',
    glyph: '⚡',
  },
}
