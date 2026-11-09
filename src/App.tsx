import { useCallback, useEffect, useMemo, useState } from 'react'
import { AtticView } from './components/AtticView'
import { Gallery } from './components/Gallery'
import { PartyPanel } from './components/PartyPanel'
import { PlayModal } from './components/PlayModal'
import { Welcome } from './components/Welcome'
import { Workshop } from './components/Workshop'
import { SAMPLE_FRIENDS } from './data/friends'
import {
  decodeShareToken,
  fromSnapshot,
  lookupShortCode,
  parseVisitFromLocation,
  publishShortCode,
} from './share'
import { clearAttic, createStarterAttic, loadAttic, saveAttic, uid } from './storage'
import type {
  AtticState,
  ComplimentId,
  DecorId,
  FloorTheme,
  Friend,
  FriendMachineOffer,
  Machine,
  MachineConfig,
  MachineType,
  ShellStyle,
} from './types'
import { GRID_SIZE } from './types'

type Overlay = null | 'workshop' | 'play' | 'party' | 'gallery'

function buildDemoAttic(code: string): AtticState {
  const demo = createStarterAttic(`${code.split('-')[0]} Loft`)
  demo.code = code
  demo.machines = [
    {
      id: uid('m'),
      name: 'Host Orb Cabinet',
      type: 'orb-catch',
      cell: 8,
      shell: 'ember',
      author: 'Host',
      config: { speed: 2, target: 10, lives: 3, accent: '#ff8a5b' },
      highScore: 4,
    },
    {
      id: uid('m'),
      name: 'Guest Zap',
      type: 'wall-zap',
      cell: 16,
      shell: 'ink',
      author: 'Host',
      config: { speed: 2, target: 8, lives: 3, accent: '#6ec1ff' },
      highScore: 2,
    },
    {
      id: uid('m'),
      name: 'Dash Alley',
      type: 'lane-dash',
      cell: 10,
      shell: 'sunset',
      author: 'Host',
      config: { speed: 2, target: 12, lives: 3, accent: '#ffd166' },
      highScore: 3,
    },
  ]
  demo.friends = SAMPLE_FRIENDS.slice(0, 2).map((f) => ({ ...f, status: 'cheering' as const }))
  demo.partyOpen = true
  demo.compliments = [
    { id: uid('c'), kind: 'star', from: 'Rio', at: Date.now() - 60000 },
    { id: uid('c'), kind: 'clap', from: 'Mira', at: Date.now() - 30000 },
  ]
  demo.visitCount = 3
  demo.floorTheme = code.includes('DASH') ? 'neon-grid' : 'checkered'
  return demo
}

function atticFromVisitSnap(): { attic: AtticState; toast: string } | null {
  const snap = parseVisitFromLocation()
  if (!snap) return null
  const base = fromSnapshot(snap)
  return {
    attic: {
      ...base,
      friends: [],
      selectedDecor: null,
      selectedShell: 'copper',
      partyOpen: true,
      createdAt: Date.now(),
      compliments: base.compliments,
      visitCount: base.visitCount + 1,
    },
    toast: `Visiting ${base.name} via shared link.`,
  }
}

export default function App() {
  const bootVisit = useMemo(() => atticFromVisitSnap(), [])
  const [attic, setAttic] = useState<AtticState | null>(
    () => bootVisit?.attic ?? loadAttic(),
  )
  const [visitMode, setVisitMode] = useState(() => Boolean(bootVisit))
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [activeMachineId, setActiveMachineId] = useState<string | null>(null)
  const [pendingMachine, setPendingMachine] = useState<{
    name: string
    type: MachineType
    shell: ShellStyle
    config: MachineConfig
    remixedFrom?: string
    remixedFromAuthor?: string
  } | null>(null)
  const [movingMachineId, setMovingMachineId] = useState<string | null>(null)
  const [workshopSeed, setWorkshopSeed] = useState<
    (Partial<Machine> & { remixedFrom?: string; remixedFromAuthor?: string }) | undefined
  >()
  const [toast, setToast] = useState<string | null>(() => bootVisit?.toast ?? null)
  const [hasSave] = useState(() => !!loadAttic())

  useEffect(() => {
    if (attic && !visitMode) saveAttic(attic)
  }, [attic, visitMode])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  const activeMachine = useMemo(
    () => attic?.machines.find((m) => m.id === activeMachineId) ?? null,
    [attic, activeMachineId],
  )

  const flash = (msg: string) => setToast(msg)

  const startNew = (name: string) => {
    setVisitMode(false)
    setAttic(createStarterAttic(name))
    flash('Attic ready — place décor or play the starter cabinet.')
  }

  const joinDemo = (raw: string) => {
    const trimmed = raw.trim()

    // Full AA2 token
    const tokenSnap = decodeShareToken(trimmed.startsWith('AA2.') ? trimmed : trimmed)
    if (tokenSnap) {
      const base = fromSnapshot(tokenSnap)
      setVisitMode(true)
      setAttic({
        ...base,
        friends: SAMPLE_FRIENDS.slice(0, 1).map((f) => ({ ...f, status: 'visiting' as const })),
        selectedDecor: null,
        selectedShell: 'copper',
        partyOpen: true,
        createdAt: Date.now(),
        compliments: [],
        visitCount: 1,
      })
      flash(`Visiting ${base.name} from shared token.`)
      return
    }

    const code = trimmed.toUpperCase()
    const local = lookupShortCode(code)
    if (local) {
      const base = fromSnapshot(local, code)
      setVisitMode(true)
      setAttic({
        ...base,
        friends: [],
        selectedDecor: null,
        selectedShell: 'copper',
        partyOpen: true,
        createdAt: Date.now(),
        compliments: [],
        visitCount: 1,
      })
      flash(`Visiting ${base.name} — tap a cabinet to play.`)
      return
    }

    const demo = buildDemoAttic(code)
    setVisitMode(true)
    setAttic(demo)
    flash(`Visiting ${demo.name} — tap a cabinet to play.`)
  }

  const selectCell = (index: number) => {
    if (!attic || visitMode) return

    if (movingMachineId) {
      if (attic.machines.some((m) => m.cell === index && m.id !== movingMachineId)) {
        flash('That tile already has a machine.')
        return
      }
      setAttic({
        ...attic,
        machines: attic.machines.map((m) =>
          m.id === movingMachineId ? { ...m, cell: index } : m,
        ),
      })
      setMovingMachineId(null)
      flash('Cabinet moved.')
      return
    }

    if (pendingMachine) {
      if (attic.machines.some((m) => m.cell === index)) {
        flash('That tile already has a machine.')
        return
      }
      const machine: Machine = {
        id: uid('m'),
        name: pendingMachine.name,
        type: pendingMachine.type,
        cell: index,
        shell: pendingMachine.shell,
        author: 'You',
        remixedFrom: pendingMachine.remixedFrom,
        remixedFromAuthor: pendingMachine.remixedFromAuthor,
        config: pendingMachine.config,
        highScore: 0,
      }
      const next = { ...attic, machines: [...attic.machines, machine] }
      setAttic(next)
      publishShortCode(next)
      setPendingMachine(null)
      flash(`${machine.name} placed. Tap it to play.`)
      return
    }
    const cells = [...attic.cells]
    if (attic.selectedDecor === null) {
      cells[index] = null
    } else {
      cells[index] = attic.selectedDecor
    }
    setAttic({ ...attic, cells })
  }

  const onScore = useCallback((machineId: string, score: number) => {
    setAttic((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        machines: prev.machines.map((m) =>
          m.id === machineId ? { ...m, highScore: Math.max(m.highScore, score) } : m,
        ),
      }
    })
  }, [])

  const simulateJoin = (friend: Friend) => {
    if (!attic) return
    setAttic({
      ...attic,
      friends: [...attic.friends, { ...friend, status: 'visiting' }],
      visitCount: attic.visitCount + 1,
    })
    flash(`${friend.name} hopped into the attic.`)
  }

  const friendPlay = (friendId: string, machine: Machine) => {
    if (!attic) return
    setAttic({
      ...attic,
      friends: attic.friends.map((f) =>
        f.id === friendId
          ? { ...f, status: 'playing', playingMachineId: machine.id }
          : f,
      ),
    })
    flash(`${attic.friends.find((f) => f.id === friendId)?.name} is playing ${machine.name}.`)
  }

  const cheerFriend = (friendId: string) => {
    if (!attic) return
    const friend = attic.friends.find((f) => f.id === friendId)
    setAttic({
      ...attic,
      friends: attic.friends.map((f) =>
        f.id === friendId ? { ...f, status: 'cheering', playingMachineId: undefined } : f,
      ),
    })
    flash(`${friend?.name ?? 'Friend'} is cheering — no chat needed.`)
  }

  const leaveCompliment = (kind: ComplimentId) => {
    if (!attic) return
    const next = {
      ...attic,
      compliments: [
        ...attic.compliments,
        { id: uid('c'), kind, from: 'Guest', at: Date.now() },
      ],
    }
    setAttic(next)
    flash('Sticker left for the host!')
  }

  const saveWorkshop = (draft: {
    name: string
    type: MachineType
    shell: ShellStyle
    config: MachineConfig
    remixedFrom?: string
    remixedFromAuthor?: string
  }) => {
    setOverlay(null)
    setWorkshopSeed(undefined)
    setPendingMachine(draft)
    flash('Tap an empty glowing tile to place your machine.')
  }

  const startRemix = (offer: FriendMachineOffer | Machine) => {
    setOverlay('workshop')
    setWorkshopSeed({
      name: `${offer.name} Remix`,
      type: offer.type,
      shell: offer.shell,
      config: { ...offer.config },
      remixedFrom: offer.id,
      remixedFromAuthor: 'author' in offer ? offer.author : 'You',
    })
  }

  if (!attic) {
    return (
      <Welcome
        hasSave={hasSave}
        onCreate={startNew}
        onJoin={joinDemo}
        onContinue={() => {
          const saved = loadAttic()
          if (saved) {
            setVisitMode(false)
            setAttic(saved)
          }
        }}
      />
    )
  }

  const mode = visitMode
    ? 'visit'
    : movingMachineId
      ? 'move-machine'
      : pendingMachine
        ? 'place-machine'
        : 'build'

  return (
    <>
      <AtticView
        attic={attic}
        mode={mode}
        placingMachineId={pendingMachine ? 'pending' : null}
        movingMachineId={movingMachineId}
        toast={toast}
        onSelectCell={selectCell}
        onSelectMachine={(m) => {
          setActiveMachineId(m.id)
          setOverlay('play')
        }}
        onSelectDecor={(id: DecorId | null) => setAttic({ ...attic, selectedDecor: id })}
        onOpenWorkshop={() => {
          setWorkshopSeed(undefined)
          setOverlay('workshop')
        }}
        onOpenParty={() => setOverlay('party')}
        onOpenGallery={() => setOverlay('gallery')}
        onReset={() => {
          clearAttic()
          setAttic(null)
          setVisitMode(false)
          setPendingMachine(null)
          setMovingMachineId(null)
        }}
        onSetFloor={(theme: FloorTheme) => setAttic({ ...attic, floorTheme: theme })}
        onStartMove={(m) => {
          setPendingMachine(null)
          setMovingMachineId(m.id)
          flash(`Moving ${m.name} — tap an empty tile.`)
        }}
        onDeleteMachine={(m) => {
          setAttic({
            ...attic,
            machines: attic.machines.filter((x) => x.id !== m.id),
          })
          if (movingMachineId === m.id) setMovingMachineId(null)
          flash(`${m.name} removed.`)
        }}
        onLeaveCompliment={visitMode ? leaveCompliment : undefined}
      />

      {overlay === 'workshop' && (
        <Workshop
          initial={workshopSeed}
          onCancel={() => {
            setOverlay(null)
            setWorkshopSeed(undefined)
          }}
          onSave={saveWorkshop}
        />
      )}

      {overlay === 'play' && activeMachine && (
        <PlayModal
          machine={activeMachine}
          onClose={() => {
            setOverlay(null)
            setActiveMachineId(null)
          }}
          onScore={onScore}
          onRemixMine={
            visitMode
              ? undefined
              : (m) => {
                  setOverlay(null)
                  setActiveMachineId(null)
                  if (attic.machines.length >= GRID_SIZE) {
                    flash('Attic is full of cabinets.')
                    return
                  }
                  startRemix(m)
                }
          }
        />
      )}

      {overlay === 'party' && (
        <PartyPanel
          attic={attic}
          onClose={() => setOverlay(null)}
          onSimulateJoin={simulateJoin}
          onFriendPlay={friendPlay}
          onCheer={cheerFriend}
          onToggleParty={() => {
            const next = { ...attic, partyOpen: !attic.partyOpen }
            if (next.partyOpen) publishShortCode(next)
            setAttic(next)
            flash(next.partyOpen ? 'Party open — code is shareable.' : 'Party closed.')
          }}
        />
      )}

      {overlay === 'gallery' && (
        <Gallery
          onClose={() => setOverlay(null)}
          onRemix={(offer) => {
            if (visitMode) {
              flash('Start your own attic to remix machines.')
              return
            }
            if (attic.machines.length >= GRID_SIZE) {
              flash('Attic is full of cabinets.')
              return
            }
            startRemix(offer)
          }}
        />
      )}
    </>
  )
}
