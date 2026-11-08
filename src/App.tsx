import { useCallback, useEffect, useMemo, useState } from 'react'
import { AtticView } from './components/AtticView'
import { Gallery } from './components/Gallery'
import { PartyPanel } from './components/PartyPanel'
import { PlayModal } from './components/PlayModal'
import { Welcome } from './components/Welcome'
import { Workshop } from './components/Workshop'
import { SAMPLE_FRIENDS } from './data/friends'
import { clearAttic, createStarterAttic, loadAttic, saveAttic, uid } from './storage'
import type {
  AtticState,
  DecorId,
  Friend,
  FriendMachineOffer,
  Machine,
  MachineConfig,
  MachineType,
  ShellStyle,
} from './types'
import { GRID_SIZE } from './types'

type Overlay = null | 'workshop' | 'play' | 'party' | 'gallery'

export default function App() {
  const [attic, setAttic] = useState<AtticState | null>(() => loadAttic())
  const [visitMode, setVisitMode] = useState(false)
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
  const [workshopSeed, setWorkshopSeed] = useState<
    (Partial<Machine> & { remixedFrom?: string; remixedFromAuthor?: string }) | undefined
  >()
  const [toast, setToast] = useState<string | null>(null)
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

  const joinDemo = (code: string) => {
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
    ]
    demo.friends = SAMPLE_FRIENDS.slice(0, 2).map((f) => ({ ...f, status: 'cheering' as const }))
    demo.partyOpen = true
    setVisitMode(true)
    setAttic(demo)
    flash(`Visiting ${demo.name} — tap a cabinet to play.`)
  }

  const selectCell = (index: number) => {
    if (!attic || visitMode) return
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
      setAttic({ ...attic, machines: [...attic.machines, machine] })
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
    flash('Tap an empty tile to place your machine.')
  }

  const startRemix = (offer: FriendMachineOffer) => {
    setOverlay('workshop')
    setWorkshopSeed({
      name: `${offer.name} Remix`,
      type: offer.type,
      shell: offer.shell,
      config: { ...offer.config },
      remixedFrom: offer.id,
      remixedFromAuthor: offer.author,
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

  return (
    <>
      <AtticView
        attic={attic}
        mode={
          visitMode ? 'visit' : pendingMachine ? 'place-machine' : 'build'
        }
        placingMachineId={pendingMachine ? 'pending' : null}
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
        }}
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
        />
      )}

      {overlay === 'party' && (
        <PartyPanel
          attic={attic}
          onClose={() => setOverlay(null)}
          onSimulateJoin={simulateJoin}
          onFriendPlay={friendPlay}
          onToggleParty={() =>
            setAttic({ ...attic, partyOpen: !attic.partyOpen })
          }
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
