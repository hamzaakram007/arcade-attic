export type Screen =
  | 'welcome'
  | 'attic'
  | 'workshop'
  | 'play'
  | 'party'
  | 'gallery'

export type MachineType = 'orb-catch' | 'wall-zap' | 'lane-dash'

export type DecorId =
  | 'lamp'
  | 'poster'
  | 'beanbag'
  | 'crate'
  | 'plant'
  | 'rug'
  | 'speaker'
  | 'rafter'
  | 'jukebox'
  | 'ticket'
  | 'stool'
  | 'banner'
  | 'snack'
  | 'window'

export type ShellStyle =
  | 'copper'
  | 'teal'
  | 'ember'
  | 'ink'
  | 'sunset'
  | 'moss'
  | 'chrome'
  | 'candy'

export type DifficultyPreset = 'chill' | 'classic' | 'spicy'

export type ComplimentId = 'star' | 'fire' | 'heart' | 'clap' | 'wow'

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

export interface Compliment {
  id: string
  kind: ComplimentId
  from: string
  at: number
}

export type FloorTheme = 'plank' | 'checkered' | 'neon-grid'

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
  floorTheme: FloorTheme
  compliments: Compliment[]
  visitCount: number
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
  jukebox: { label: 'Jukebox', glyph: '🎵', hint: 'Tunes' },
  ticket: { label: 'Ticket booth', glyph: '🎟️', hint: 'Entry' },
  stool: { label: 'Arcade stool', glyph: '🟤', hint: 'Perch' },
  banner: { label: 'Club banner', glyph: '🏁', hint: 'Pride' },
  snack: { label: 'Snack shelf', glyph: '🍿', hint: 'Treats' },
  window: { label: 'Dormer window', glyph: '🪟', hint: 'Daylight' },
}

export const SHELL_STYLES: Record<
  ShellStyle,
  { label: string; body: string; screen: string; trim: string }
> = {
  copper: { label: 'Copper', body: '#b56a3a', screen: '#1a2e2b', trim: '#e9b872' },
  teal: { label: 'Teal glow', body: '#1f6f68', screen: '#0b2422', trim: '#7dfff0' },
  ember: { label: 'Ember', body: '#8b3a2a', screen: '#241410', trim: '#ff8a5b' },
  ink: { label: 'Ink wood', body: '#2a211c', screen: '#0e1a22', trim: '#6ec1ff' },
  sunset: { label: 'Sunset', body: '#c45c26', screen: '#2a1208', trim: '#ffd166' },
  moss: { label: 'Moss', body: '#3d5a3c', screen: '#142018', trim: '#a8e6a1' },
  chrome: { label: 'Chrome', body: '#5a6670', screen: '#101820', trim: '#d7e0ea' },
  candy: { label: 'Candy', body: '#c23b5a', screen: '#1f0c14', trim: '#ff9ec4' },
}

export const DEFAULT_CONFIGS: Record<MachineType, MachineConfig> = {
  'orb-catch': { speed: 2, target: 12, lives: 3, accent: '#2ec4b6' },
  'wall-zap': { speed: 2, target: 8, lives: 3, accent: '#ff8a5b' },
  'lane-dash': { speed: 2, target: 15, lives: 3, accent: '#ffd166' },
}

export const DIFFICULTY_PRESETS: Record<
  DifficultyPreset,
  { label: string; hint: string; patch: Partial<MachineConfig> }
> = {
  chill: {
    label: 'Chill',
    hint: 'Slow & forgiving',
    patch: { speed: 1, lives: 5, target: 8 },
  },
  classic: {
    label: 'Classic',
    hint: 'Just right',
    patch: { speed: 2, lives: 3, target: 12 },
  },
  spicy: {
    label: 'Spicy',
    hint: 'Fast & fierce',
    patch: { speed: 4, lives: 2, target: 18 },
  },
}

export const MACHINE_META: Record<
  MachineType,
  { label: string; blurb: string; glyph: string; tip: string }
> = {
  'orb-catch': {
    label: 'Orb Catch',
    blurb: 'Tap falling glow orbs before they hit the floor.',
    glyph: '🔮',
    tip: 'Gold orbs give combo bonuses.',
  },
  'wall-zap': {
    label: 'Wall Zap',
    blurb: 'Slide the paddle and bounce the spark into targets.',
    glyph: '⚡',
    tip: 'Aim for the glowing center for a power bounce.',
  },
  'lane-dash': {
    label: 'Lane Dash',
    blurb: 'Swipe lanes, grab sparks, dodge crates.',
    glyph: '🏃',
    tip: 'Stay in the spark lane — crates cost a life.',
  },
}

export const COMPLIMENTS: Record<
  ComplimentId,
  { label: string; glyph: string }
> = {
  star: { label: 'Cool attic!', glyph: '⭐' },
  fire: { label: 'On fire!', glyph: '🔥' },
  heart: { label: 'Love it', glyph: '💛' },
  clap: { label: 'Nice cabinets', glyph: '👏' },
  wow: { label: 'Whoa!', glyph: '😮' },
}

export const FLOOR_THEMES: Record<
  FloorTheme,
  { label: string; className: string }
> = {
  plank: { label: 'Warm planks', className: 'floor-plank' },
  checkered: { label: 'Arcade check', className: 'floor-check' },
  'neon-grid': { label: 'Neon grid', className: 'floor-neon' },
}
