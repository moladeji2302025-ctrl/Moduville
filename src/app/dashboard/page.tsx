'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Mail, Sparkles, SlidersHorizontal, Archive, Users, ShoppingBag, MessageSquare, Map, List } from 'lucide-react'
import { DragonEvolution } from '@/components/dragon/DragonEvolution'
import { useVoice } from '@/lib/VoiceContext'
import { ElixirTank } from '@/components/dashboard/ElixirTank'
import { BlockModal } from '@/components/dashboard/BlockModal'
import { WindDownRitual } from '@/components/dashboard/WindDownRitual'
import { MailboxDrawer } from '@/components/dashboard/MailboxDrawer'
import { MicroReward, pickMicroReward } from '@/components/dashboard/MicroReward'
import type { MicroRewardKind } from '@/components/dashboard/MicroReward'
import { DraggableBlockList } from '@/components/dashboard/DraggableBlockList'
import { DailyRoadmap } from '@/components/dashboard/DailyRoadmap'
import { ProofDropPanel } from '@/components/dashboard/ProofDropPanel'
import { GoldShopSheet } from '@/components/dashboard/GoldShopSheet'
import { NotifPermissionBanner } from '@/components/dashboard/NotifPermissionBanner'
import { registerServiceWorker, scheduleNotifications } from '@/lib/notifications'
import {
  loadRoutine, loadLetters, addLetter, loadGoals,
  getLastLetterDate, getCompletions, toggleCompletion,
  calcGoodWeeksFromHistory, calcDragonStage, stageRank,
  getDragonStage, saveDragonStage, saveRoutine,
  getDisabledNotifIds, getGoldBalance,
} from '@/lib/storage'
import type { CitizenLetter, CitizenType, DayOfWeek, DragonStage, ElixirType, GeneratedRoutine, RoutineBlock, UserGoal } from '@/lib/types'

const DAYS_OF_WEEK: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_ORDER:   DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS:  Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
}
const ELIXIR_COLORS: Record<ElixirType, string> = {
  fire: '#e05c2f', celestial: '#d4a853', iron: '#8a9bb5',
  storm: '#7c6fff', wisdom: '#4a7fff', bloom: '#3dbd7a', moon: '#c4c9e8',
}

function todayKey() { return new Date().toISOString().slice(0, 10) }

/** Days since ISO date string */
function daysSince(iso: string | null): number {
  if (!iso) return 999
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default function DashboardPage() {
  const router = useRouter()
  const [routine, setRoutine]           = useState<GeneratedRoutine | null>(null)
  const [selectedDay, setSelectedDay]   = useState<DayOfWeek>(DAYS_OF_WEEK[new Date().getDay()])
  const [completions, setCompletions]   = useState<Set<string>>(new Set())
  const [activeBlock, setActiveBlock]   = useState<RoutineBlock | null>(null)
  const [showWindDown, setShowWindDown] = useState(false)
  const [mvdActive, setMvdActive]       = useState(false)
  const [hyperfocusBlock, setHyperfocusBlock] = useState<RoutineBlock | null>(null)
  // Mailbox
  const [letters, setLetters]           = useState<CitizenLetter[]>([])
  const [showMailbox, setShowMailbox]   = useState(false)
  const letterFetching = useRef(false)
  // Micro-reward
  const [microReward, setMicroReward]   = useState<MicroRewardKind | null>(null)
  // Dragon evolution
  const [dragonStage, setDragonStage]   = useState<DragonStage>('egg')
  const [showEvolution, setShowEvolution] = useState(false)
  const [evolvingTo, setEvolvingTo]     = useState<DragonStage | null>(null)
  // Rest-block reorder warning
  const [showRestWarning, setShowRestWarning] = useState(false)
  // Proof drop panel
  const [proofBlock, setProofBlock] = useState<RoutineBlock | null>(null)
  // Gold shop
  const [gold,      setGold]      = useState(getGoldBalance())
  const [showShop,  setShowShop]  = useState(false)
  // Roadmap
  const [goals,          setGoals]          = useState<UserGoal[]>([])
  const [viewMode,       setViewMode]       = useState<'roadmap' | 'list'>('roadmap')
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null)

  const todayDay = DAYS_OF_WEEK[new Date().getDay()]

  const { transcript, transcriptId, speak } = useVoice()
  const lastTranscriptId = useRef(0)

  // ── Boot ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const r = loadRoutine()
    if (!r) { router.replace('/onboarding'); return }
    setRoutine(r)
    setGoals(loadGoals())
    setCompletions(getCompletions(todayKey()))
    const saved = loadLetters()
    setLetters(saved)
    // Generate a letter if none exist or last one is >3 days old
    if (daysSince(getLastLetterDate()) >= 3 && !letterFetching.current) {
      letterFetching.current = true
      fetchLetter(saved, r.blocks, 0.5)
    }
    // Dragon stage check
    const goodWeeks = calcGoodWeeksFromHistory(r)
    const newStage  = calcDragonStage(goodWeeks)
    const stored    = getDragonStage()
    setDragonStage(newStage)
    if (stageRank(newStage) > stageRank(stored)) {
      saveDragonStage(newStage)
      setEvolvingTo(newStage)
      setShowEvolution(true)
    }
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Service worker + notification scheduling ──────────────────────────────

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (!routine) return
    const cancel = scheduleNotifications({
      blocks:      routine.blocks,
      disabledIds: getDisabledNotifIds(),
      todayDow:    todayDay,
    })
    return cancel
  }, [routine, todayDay])

  // ── Hyperfocus Guard (checks every 60s) ───────────────────────────────────

  useEffect(() => {
    if (!routine) return
    function check() {
      const now = new Date()
      const nowMins = now.getHours() * 60 + now.getMinutes()
      const found = routine!.blocks.find(b => {
        if (!b.days.includes(todayDay)) return false
        if (completions.has(b.id)) return false
        if (b.type !== 'goal') return false
        const [h, m] = b.time.split(':').map(Number)
        return nowMins - (h * 60 + m + b.duration) >= 10
      })
      setHyperfocusBlock(found ?? null)
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [routine, completions, todayDay])

  // ── Voice commands ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!transcript || transcriptId === lastTranscriptId.current) return
    lastTranscriptId.current = transcriptId
    const lower = transcript.toLowerCase().trim()

    if (lower.includes('how am i') || lower.includes('progress') || lower.includes('doing today')) {
      speak(`You've completed ${completedGoals.length} of ${todayGoalBlocks.length} goal blocks today.`)
      return
    }

    for (const day of DAY_ORDER) {
      if (lower.includes(DAY_LABELS[day].toLowerCase())) {
        setSelectedDay(day as DayOfWeek)
        speak(`Showing ${DAY_LABELS[day]}`)
        return
      }
    }

    const match = lower.match(/(?:complete|mark|finish|done with|check off)\s+(.+?)(?:\s+done|\s+complete)?$/)
    if (match) {
      const query = match[1].trim()
      const block = routine?.blocks.find(b =>
        b.days.includes(todayDay) && b.name.toLowerCase().includes(query)
      )
      if (block && !completions.has(block.id)) {
        handleToggle(block.id)
        speak(`${block.name} marked complete.`)
      } else if (!block) {
        speak("I couldn't find that block. Try saying the block name more clearly.")
      }
    }
  }, [transcriptId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Letter fetching ───────────────────────────────────────────────────────

  async function fetchLetter(
    current: CitizenLetter[],
    _blocks: RoutineBlock[],
    rate: number,
  ) {
    try {
      const lastType = current[0]?.citizenType as CitizenType | undefined
      const res = await fetch('/api/citizen-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionRate: rate, lastCitizenType: lastType }),
      })
      if (!res.ok) return
      const { letter } = await res.json() as { letter: CitizenLetter }
      addLetter(letter)
      setLetters(prev => [letter, ...prev])
    } catch { /* silent */ }
  }

  if (!routine) return null

  // ── Derived values ────────────────────────────────────────────────────────

  const dayBlocks = routine.blocks
    .filter(b => b.days.includes(selectedDay))
    .sort((a, b) => a.time.localeCompare(b.time))

  const todayBlocks     = routine.blocks.filter(b => b.days.includes(todayDay))
  const todayGoalBlocks = todayBlocks.filter(b => b.type === 'goal')
  const completedGoals  = todayGoalBlocks.filter(b => completions.has(b.id))

  // MVD focus block = first goal block today
  const mvdBlock = todayGoalBlocks[0]

  const fillLevel = todayGoalBlocks.length > 0
    ? completedGoals.length / todayGoalBlocks.length : 0

  const elixirCounts = completedGoals.reduce<Record<string, number>>((acc, b) => {
    if (b.elixirType) acc[b.elixirType] = (acc[b.elixirType] ?? 0) + 1
    return acc
  }, {})
  const dominantElixir = (
    Object.entries(elixirCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  ) as ElixirType | null

  const warmth = todayBlocks.length > 0
    ? Math.max(0.04, completions.size / todayBlocks.length) : 0.04

  const tomorrowDay = DAYS_OF_WEEK[(new Date().getDay() + 1) % 7]
  const tomorrowFirstBlock = routine.blocks
    .filter(b => b.days.includes(tomorrowDay) && b.type !== 'rest' && b.type !== 'leisure')
    .sort((a, b) => a.time.localeCompare(b.time))[0] ?? null

  const unreadCount = letters.filter(l => !l.read).length

  // Completion rate for letter generation (7-day rough average via today)
  const todayRate = todayGoalBlocks.length > 0
    ? completedGoals.length / todayGoalBlocks.length : 0.5

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleToggle(blockId: string) {
    if (selectedDay !== todayDay) return
    const next = toggleCompletion(todayKey(), blockId)
    setCompletions(next)
    if (next.has(blockId)) {
      if (Math.random() < 0.25) setMicroReward(pickMicroReward())
      const block = dayBlocks.find(b => b.id === blockId)
      if (block) setProofBlock(block)
      setJustCompletedId(blockId)
      setTimeout(() => setJustCompletedId(null), 2000)
    }
  }

  function handleBlockComplete(blockId: string) {
    const next = toggleCompletion(todayKey(), blockId)
    setCompletions(next)
    if (next.has(blockId) && Math.random() < 0.25) {
      setMicroReward(pickMicroReward())
    }
    // Generate new letter every 3+ days
    if (daysSince(getLastLetterDate()) >= 3 && !letterFetching.current) {
      letterFetching.current = true
      fetchLetter(letters, routine?.blocks ?? [], todayRate)
    }
  }

  function handleReorder(newDayBlocks: RoutineBlock[]) {
    // Cascade times: first block keeps its time, each subsequent block starts when previous ends
    const recalculated = newDayBlocks.reduce<RoutineBlock[]>((acc, block, i) => {
      if (i === 0) return [block]
      const prev = acc[i - 1]
      const [h, m] = prev.time.split(':').map(Number)
      const endMins = h * 60 + m + prev.duration
      const newTime = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`
      return [...acc, { ...block, time: newTime }]
    }, [])

    // Warn if a non-rest block is now adjacent to a rest block
    const adjacentToRest = recalculated.some((b, i) => {
      if (b.type === 'rest') return false
      return recalculated[i - 1]?.type === 'rest' || recalculated[i + 1]?.type === 'rest'
    })

    const updatedBlocks = routine!.blocks.map(b => recalculated.find(r => r.id === b.id) ?? b)
    const newRoutine = { ...routine!, blocks: updatedBlocks }
    saveRoutine(newRoutine)
    setRoutine(newRoutine)

    if (adjacentToRest) {
      setShowRestWarning(true)
      setTimeout(() => setShowRestWarning(false), 4500)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-void text-text">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 15% 90%, #0a0820 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 88% 10%, #0a0d22 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-24">

        {/* ── Top bar: edit routine · weekly wrap · mailbox ── */}
        <div className="flex items-center justify-end pt-5 pb-2 gap-1">
          {/* Gold balance pill */}
          <button
            onClick={() => setShowShop(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gold/25 bg-gold/8 hover:bg-gold/14 transition-colors mr-1"
            title="Gold Shop"
          >
            <ShoppingBag className="w-3 h-3 text-gold/70" />
            <span className="text-gold text-xs font-body tabular-nums">{gold.toFixed(0)}G</span>
          </button>
          <motion.button
            onClick={() => router.push('/consultant')}
            title="Premium Consultant"
            animate={{ boxShadow: ['0 0 0px 0px #d4a85300', '0 0 10px 3px #d4a85340', '0 0 0px 0px #d4a85300'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="p-2 rounded-xl border border-gold/35 bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </motion.button>
          <button
            onClick={() => router.push('/community')}
            className="p-2 text-muted hover:text-text transition-colors"
            title="Community"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/edit-routine')}
            className="p-2 text-muted hover:text-text transition-colors"
            title="Edit Routine"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/weekly-wrap')}
            className="p-2 text-muted hover:text-text transition-colors"
            title="Weekly Wrap"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/proof-bank')}
            className="p-2 text-muted hover:text-text transition-colors"
            title="Proof Bank"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMailbox(true)}
            className="relative p-2 text-muted hover:text-text transition-colors"
          >
            <Mail className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ember text-white text-[9px] font-body flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </button>
        </div>

        {/* ── Hero: Dragon + Elixir Tank ── */}
        <div className="flex items-end justify-center gap-6 pb-6">
          <ElixirTank fillLevel={fillLevel} dominantElixir={dominantElixir} height={128} />
          <div className="flex flex-col items-center">
            <DragonEvolution
              stage={dragonStage}
              warmth={warmth}
              glowColor={dominantElixir ? ELIXIR_COLORS[dominantElixir] : undefined}
              size={108}
              showEvolution={showEvolution}
              evolvingTo={evolvingTo}
              onEvolutionDone={() => setShowEvolution(false)}
            />
            <p className="font-display text-gold text-xs tracking-[0.2em] uppercase mt-3 mb-1">
              Moduville
            </p>
            {selectedDay === todayDay ? (
              <p className="text-muted text-xs">
                {completedGoals.length} / {todayGoalBlocks.length} goal blocks done
              </p>
            ) : (
              <p className="text-muted text-xs">{DAY_LABELS[selectedDay]}</p>
            )}
          </div>
          <div className="w-10" />
        </div>

        {/* ── MVD toggle ── */}
        {selectedDay === todayDay && todayGoalBlocks.length > 0 && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setMvdActive(v => !v)}
              className={`text-xs font-body px-4 py-1.5 rounded-full border transition-all ${
                mvdActive
                  ? 'border-gold/40 text-gold bg-gold/10'
                  : 'border-border/40 text-muted hover:border-border hover:text-text/60'
              }`}
            >
              {mvdActive ? '↩ Return to full day' : 'Tough day? MVD Mode'}
            </button>
          </div>
        )}

        {/* MVD banner */}
        <AnimatePresence>
          {mvdActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="px-4 py-3 rounded-xl bg-gold/8 border border-gold/25 text-center">
                <p className="font-display text-gold text-xs tracking-wide mb-0.5">
                  Minimum Viable Day
                </p>
                <p className="text-muted/80 text-xs">
                  One block. That&apos;s enough. Even legends rest.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hyperfocus Guard ── */}
        <AnimatePresence>
          {hyperfocusBlock && selectedDay === todayDay && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gold/8 border border-gold/22 mb-4"
            >
              <span className="text-gold text-base leading-none">◑</span>
              <div className="flex-1 min-w-0">
                <p className="text-gold text-xs font-display tracking-wide">
                  Your dragon is hungry
                </p>
                <p className="text-muted text-xs mt-0.5 truncate">
                  {hyperfocusBlock.name} ended a while ago — time to move on.
                </p>
              </div>
              <button
                onClick={() => setActiveBlock(hyperfocusBlock)}
                className="text-gold text-xs font-body border border-gold/30 px-2.5 py-1 rounded-lg hover:bg-gold/15 transition-colors shrink-0"
              >
                Complete
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rest-block reorder warning ── */}
        <AnimatePresence>
          {showRestWarning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-moon/8 border border-moon/22 mb-4"
            >
              <span className="text-moon text-base leading-none">☽</span>
              <p className="text-moon/80 text-xs font-body flex-1">
                This block is now next to your rest time. This may affect your sleep block.
              </p>
              <button onClick={() => setShowRestWarning(false)} className="text-muted text-xs font-body">OK</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Notification permission banner ── */}
        <NotifPermissionBanner />

        {/* ── Day tabs ── */}
        <div className="flex gap-1 mb-5 bg-surface/40 rounded-xl p-1">
          {DAY_ORDER.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2 rounded-lg text-xs font-display tracking-wide transition-all duration-200 ${
                day === selectedDay
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : day === todayDay
                  ? 'text-text/65 border border-border/35'
                  : 'text-muted hover:text-text/60'
              }`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>

        {/* ── View mode toggle ── */}
        <div className="flex justify-end mb-3 -mt-1">
          <div className="flex items-center gap-0.5 bg-surface/40 rounded-xl p-1">
            <button
              onClick={() => setViewMode('roadmap')}
              title="Roadmap view"
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'roadmap' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-text'}`}
            >
              <Map className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-text'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Roadmap view ── */}
        {viewMode === 'roadmap' && (
          <DailyRoadmap
            blocks={dayBlocks}
            completions={completions}
            isToday={selectedDay === todayDay}
            routine={routine}
            goals={goals}
            justCompletedId={justCompletedId}
            onToggle={handleToggle}
          />
        )}

        {/* ── List view ── */}
        {viewMode === 'list' && (
          <DraggableBlockList
            blocks={dayBlocks}
            completions={completions}
            isToday={selectedDay === todayDay}
            mvdActive={mvdActive}
            mvdBlock={mvdBlock}
            onReorder={handleReorder}
            onBlockClick={block => setActiveBlock(block)}
            onToggle={handleToggle}
          />
        )}
      </div>

      {/* ── Wind-down button ── */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-30 pointer-events-none">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowWindDown(true)}
          className="pointer-events-auto inline-flex items-center gap-2 px-6 py-3 bg-void/90 border border-border/60 rounded-full text-muted text-sm font-body hover:border-gold/30 hover:text-gold transition-all backdrop-blur-sm"
        >
          <Moon className="w-3.5 h-3.5" />
          Wind Down
        </motion.button>
      </div>

      {/* ── Micro-reward ── */}
      <AnimatePresence>
        {microReward && (
          <MicroReward
            key={microReward + Date.now()}
            kind={microReward}
            onDone={() => setMicroReward(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Block modal ── */}
      <AnimatePresence>
        {activeBlock && (
          <BlockModal
            key={activeBlock.id}
            block={activeBlock}
            alreadyDone={completions.has(activeBlock.id)}
            isToday={selectedDay === todayDay}
            onComplete={handleBlockComplete}
            onClose={() => setActiveBlock(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Wind-down ritual ── */}
      <AnimatePresence>
        {showWindDown && (
          <WindDownRitual
            completedBlocks={completedGoals}
            totalGoalBlocks={todayGoalBlocks.length}
            warmth={warmth}
            tomorrowFirstBlock={tomorrowFirstBlock}
            onClose={() => setShowWindDown(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mailbox ── */}
      <AnimatePresence>
        {showMailbox && (
          <MailboxDrawer
            letters={letters}
            onClose={() => setShowMailbox(false)}
            onLettersChange={setLetters}
          />
        )}
      </AnimatePresence>

      {/* ── Proof Drop Panel ── */}
      <AnimatePresence>
        {proofBlock && (
          <ProofDropPanel
            block={proofBlock}
            onClose={() => setProofBlock(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Gold Shop ── */}
      <AnimatePresence>
        {showShop && (
          <GoldShopSheet
            onClose={() => setShowShop(false)}
            onGoldUpdated={newBalance => {
              setGold(newBalance)
              setShowShop(false)
            }}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
