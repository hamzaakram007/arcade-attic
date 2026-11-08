import type { Friend, FriendMachineOffer } from '../types'

export const SAMPLE_FRIENDS: Friend[] = [
  { id: 'f-rio', name: 'Rio', color: '#2ec4b6', status: 'visiting' },
  { id: 'f-mira', name: 'Mira', color: '#ff8a5b', status: 'visiting' },
  { id: 'f-jun', name: 'Jun', color: '#e9b872', status: 'visiting' },
  { id: 'f-cleo', name: 'Cleo', color: '#6ec1ff', status: 'visiting' },
]

export const FRIEND_MACHINE_GALLERY: FriendMachineOffer[] = [
  {
    id: 'offer-rio-orbs',
    name: 'Rio’s Meteor Catch',
    type: 'orb-catch',
    shell: 'ember',
    author: 'Rio',
    config: { speed: 3, target: 15, lives: 3, accent: '#ff8a5b' },
    blurb: 'Faster orbs, fiery palette. Remix and tweak the target.',
  },
  {
    id: 'offer-mira-zap',
    name: 'Mira Bounce Lab',
    type: 'wall-zap',
    shell: 'teal',
    author: 'Mira',
    config: { speed: 2, target: 10, lives: 4, accent: '#7dfff0' },
    blurb: 'Extra life, chill teal spark. Great starter remix.',
  },
  {
    id: 'offer-jun-orbs',
    name: 'Jun Slow Glow',
    type: 'orb-catch',
    shell: 'copper',
    author: 'Jun',
    config: { speed: 1, target: 8, lives: 5, accent: '#e9b872' },
    blurb: 'Easy mode for younger siblings — slow and golden.',
  },
  {
    id: 'offer-cleo-zap',
    name: 'Cleo Sparkwall',
    type: 'wall-zap',
    shell: 'ink',
    author: 'Cleo',
    config: { speed: 3, target: 12, lives: 2, accent: '#6ec1ff' },
    blurb: 'Hard mode ink cabinet. Remix if you dare.',
  },
]

export const SAMPLE_JOIN_CODES = ['ATTIC-DEMO', 'GLOW-4421', 'ZAP-8800'] as const

export function makeInviteCode(): string {
  const words = ['ATTIC', 'GLOW', 'LOFT', 'PIXEL', 'SPARK', 'COZY']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${word}-${num}`
}
