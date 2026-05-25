'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Gift, Heart, UserPlus, UserCheck, Lock, Globe, X, Star, Download } from 'lucide-react'
import {
  getProfile, saveProfile, getSocialState,
  setFriendStatus, recordGift, recordEncouragement, getGoldBalance,
  getInstalledTemplates,
} from '@/lib/storage'
import type { DragonStage, ElixirType, FriendStatus, GiftRecord, GoalCategory, RoutineTemplate, SocialState, UserProfile } from '@/lib/types'
import { ROUTINE_TEMPLATES } from '@/lib/routineTemplates'
import { TemplateInstallSheet } from '@/components/community/TemplateInstallSheet'

// ── Seed data ─────────────────────────────────────────────────────────────────

interface DemoUser {
  id:          string
  username:    string
  goal:        string
  streak:      number
  dragonStage: DragonStage
  elixir:      ElixirType
  weeklyRate:  number   // 0–1; <0.5 means they need encouragement
}

const DEMO_USERS: DemoUser[] = [
  { id: 'u1', username: 'marcus_builds',   goal: 'Launch my SaaS product',        streak: 18, dragonStage: 'adult',    elixir: 'iron',      weeklyRate: 0.82 },
  { id: 'u2', username: 'sofia_creates',   goal: 'Grow Instagram to 10K',          streak:  7, dragonStage: 'baby',     elixir: 'storm',     weeklyRate: 0.44 },
  { id: 'u3', username: 'james_fit',       goal: 'Run a marathon by December',     streak: 32, dragonStage: 'adult',    elixir: 'fire',      weeklyRate: 0.91 },
  { id: 'u4', username: 'priya_reads',     goal: 'Read 24 books this year',        streak:  3, dragonStage: 'hatching', elixir: 'wisdom',    weeklyRate: 0.35 },
  { id: 'u5', username: 'leo_meditates',   goal: 'Daily spiritual practice',       streak: 14, dragonStage: 'baby',     elixir: 'celestial', weeklyRate: 0.72 },
  { id: 'u6', username: 'nina_writes',     goal: 'Finish my novel draft',          streak:  9, dragonStage: 'baby',     elixir: 'moon',      weeklyRate: 0.56 },
  { id: 'u7', username: 'dev_chen',        goal: 'Master fullstack development',   streak: 21, dragonStage: 'adult',    elixir: 'wisdom',    weeklyRate: 0.88 },
  { id: 'u8', username: 'amara_wellness',  goal: 'Consistent sleep and nutrition', streak:  5, dragonStage: 'hatching', elixir: 'bloom',     weeklyRate: 0.41 },
  { id: 'u9', username: 'kai_invests',     goal: 'Build a £50K investment portfolio', streak: 11, dragonStage: 'baby',  elixir: 'iron',     weeklyRate: 0.63 },
  { id: 'u10', username: 'zara_art',       goal: 'Post creative work daily',       streak:  2, dragonStage: 'hatching', elixir: 'storm',     weeklyRate: 0.28 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const ELIXIR_COLORS: Record<ElixirType, string> = {
  fire: '#e05c2f', celestial: '#d4a853', iron: '#8a9bb5',
  storm: '#7c6fff', wisdom: '#4a7fff', bloom: '#3dbd7a', moon: '#c4c9e8',
}

const STAGE_SYMBOL: Record<DragonStage, string> = {
  egg: '○', hatching: '◈', baby: '✦', adult: '❋',
}

const STAGE_LABEL: Record<DragonStage, string> = {
  egg: 'Unhatched', hatching: 'Stirring', baby: 'Hatchling', adult: 'Sovereign',
}

const GIFT_PACKS: { pack: GiftRecord['pack']; elixir: number; label: string }[] = [
  { pack: 'small',    elixir:  5, label: 'Small Pack'    },
  { pack: 'standard', elixir: 15, label: 'Standard Pack' },
  { pack: 'premium',  elixir: 30, label: 'Premium Pack'  },
]

// ── Username setup modal ──────────────────────────────────────────────────────

function UsernameModal({ onSave }: { onSave: (p: UserProfile) => void }) {
  const [username, setUsername] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const valid = username.trim().length >= 3

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/70 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
      >
        <div className="w-full max-w-sm bg-deep border border-border/70 rounded-2xl p-6">
          <p className="font-display text-gold text-[11px] tracking-[0.38em] uppercase mb-1">Join the Community</p>
          <p className="text-text text-base font-display tracking-wide mb-1">Choose a username</p>
          <p className="text-muted text-xs font-body mb-5">This is how other builders will find and encourage you.</p>

          <input
            autoFocus
            value={username}
            onChange={e => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
            placeholder="e.g. your_name"
            maxLength={24}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-body placeholder:text-muted/35 focus:outline-none focus:border-border/80 transition-colors mb-4"
          />

          <button
            onClick={() => setIsPublic(v => !v)}
            className="flex items-center gap-2 mb-5 text-xs font-body text-muted hover:text-text transition-colors"
          >
            {isPublic
              ? <><Globe className="w-3.5 h-3.5 text-bloom" /><span className="text-bloom">Public profile</span> — discoverable by others</>
              : <><Lock className="w-3.5 h-3.5" />Private profile — opt out of discovery</>}
          </button>

          <button
            onClick={() => valid && onSave({ username: username.trim(), isPublic })}
            disabled={!valid}
            className="w-full py-3.5 rounded-2xl text-sm font-display tracking-wide transition-all"
            style={valid
              ? { background: '#d4a85320', border: '1px solid #d4a85340', color: '#d4a853' }
              : { background: '#17172e',   border: '1px solid #2a2a4a',   color: '#9896b840' }}
          >
            Enter Community
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ── Gift sheet ────────────────────────────────────────────────────────────────

function GiftSheet({
  user,
  gold,
  onClose,
  onSend,
}: {
  user: DemoUser
  gold: number
  onClose: () => void
  onSend: (pack: GiftRecord['pack']) => void
}) {
  const color = ELIXIR_COLORS[user.elixir]
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40" onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 270 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-deep border-t border-border/70 rounded-t-2xl max-w-lg mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3" />
        <div className="px-5 pt-4 pb-4 border-b border-border/40 flex items-center justify-between">
          <div>
            <p className="font-display text-[11px] tracking-[0.38em] uppercase" style={{ color }}>
              Send a Gift
            </p>
            <p className="text-muted text-xs mt-0.5">to @{user.username}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-3 pb-10">
          {GIFT_PACKS.map(({ pack, elixir, label }) => (
            <button
              key={pack}
              onClick={() => onSend(pack)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-surface/40 hover:border-gold/30 hover:bg-gold/5 transition-all text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-display flex-shrink-0"
                style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
              >
                {elixir}
              </div>
              <div className="flex-1">
                <p className="text-text text-sm font-display tracking-wide">{label}</p>
                <p className="text-muted text-xs font-body mt-0.5">{elixir} Elixir to their tank</p>
              </div>
              <span className="text-muted/50 text-xs font-body">Free</span>
            </button>
          ))}
          <p className="text-center text-muted/40 text-[10px] font-body pt-1">
            Gold pricing unlocks with the Premium Consultant.
          </p>
        </div>
      </motion.div>
    </>
  )
}

// ── User card ─────────────────────────────────────────────────────────────────

interface UserCardProps {
  user:            DemoUser
  friendStatus:    FriendStatus
  hasEncouraged:   boolean
  myUsername:      string
  onFriend:        () => void
  onGift:          () => void
  onEncourage:     () => void
}

function UserCard({ user, friendStatus, hasEncouraged, myUsername, onFriend, onGift, onEncourage }: UserCardProps) {
  const color   = ELIXIR_COLORS[user.elixir]
  const needsEnc = user.weeklyRate < 0.5

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-border/60 bg-surface/35 hover:bg-surface/50 transition-all"
    >
      {/* Top row: avatar + name + dragon */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-base font-display flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
        >
          {user.username[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-text text-sm font-display tracking-wide truncate">@{user.username}</p>
            <span
              className="text-[10px] font-body px-1.5 py-0.5 rounded-full border flex-shrink-0"
              style={{ color, borderColor: `${color}35`, background: `${color}12` }}
            >
              {STAGE_SYMBOL[user.dragonStage]} {STAGE_LABEL[user.dragonStage]}
            </span>
          </div>
          <p className="text-muted text-xs font-body mt-0.5 truncate">{user.goal}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <div className="text-center">
          <p className="text-text text-sm font-display">{user.streak}</p>
          <p className="text-muted/60 text-[10px] font-body">day streak</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-muted/60 text-[10px] font-body">This week</p>
            <p className="text-[10px] font-body" style={{ color: needsEnc ? '#e05c2f' : '#3dbd7a' }}>
              {Math.round(user.weeklyRate * 100)}%
            </p>
          </div>
          <div className="h-1 rounded-full bg-border/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width:      `${user.weeklyRate * 100}%`,
                background: needsEnc ? '#e05c2f' : color,
              }}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Friend request */}
        <button
          onClick={onFriend}
          disabled={friendStatus === 'friends'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-body transition-all ${
            friendStatus === 'friends'
              ? 'border-bloom/30 bg-bloom/10 text-bloom cursor-default'
              : friendStatus === 'requested'
              ? 'border-border/50 text-muted/60 cursor-default'
              : 'border-border text-muted hover:border-gold/30 hover:text-text'
          }`}
        >
          {friendStatus === 'friends'
            ? <><UserCheck className="w-3 h-3" /> Friends</>
            : friendStatus === 'requested'
            ? <><UserPlus className="w-3 h-3" /> Requested</>
            : <><UserPlus className="w-3 h-3" /> Connect</>}
        </button>

        {/* Gift */}
        <button
          onClick={onGift}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-muted hover:border-gold/30 hover:text-gold text-xs font-body transition-all"
        >
          <Gift className="w-3 h-3" /> Gift
        </button>

        {/* Encourage */}
        <button
          onClick={onEncourage}
          disabled={hasEncouraged}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-body transition-all ${
            hasEncouraged
              ? 'border-border/30 text-muted/40 cursor-default'
              : needsEnc
              ? 'border-ember/35 bg-ember/8 text-ember hover:bg-ember/15'
              : 'border-border text-muted hover:border-bloom/30 hover:text-bloom'
          }`}
        >
          <Heart className="w-3 h-3" />
          {hasEncouraged
            ? 'Encouraged'
            : needsEnc
            ? 'Send Encouragement'
            : `Encourage @${user.username.split('_')[0]}`}
        </button>
      </div>
    </motion.div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-deep border border-gold/35 rounded-xl px-4 py-3 text-sm font-body text-text shadow-lg max-w-xs text-center"
    >
      {message}
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'discover' | 'library' | 'friends'

// ── Library helpers ───────────────────────────────────────────────────────────

const SCORE_COLOR = (s: number) =>
  s >= 9   ? '#d4a853' :
  s >= 7.5 ? '#3dbd7a' :
  s >= 6   ? '#8a9bb5' : '#9896b8'

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  fitness: 'Fitness', spiritual: 'Spiritual', business: 'Business',
  creative: 'Creative', relationships: 'Relationships', learning: 'Learning',
  health: 'Health', other: 'Other',
}

function formatInstalls(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  installed,
  onPreview,
}: {
  template:  RoutineTemplate
  installed: boolean
  onPreview: () => void
}) {
  const color = ELIXIR_COLORS[template.elixirType]
  const score = template.consultantScore

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-border/60 bg-surface/35 hover:bg-surface/50 transition-all"
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
        >
          {template.blocks.length}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text text-sm font-display tracking-wide leading-tight">{template.title}</p>
          <p className="text-muted text-xs font-body mt-0.5 truncate">{template.subtitle}</p>
        </div>
        {/* Consultant score */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg border flex-shrink-0"
          style={{ borderColor: `${SCORE_COLOR(score)}40`, background: `${SCORE_COLOR(score)}12` }}
        >
          <Star className="w-2.5 h-2.5" style={{ color: SCORE_COLOR(score) }} />
          <span className="text-[10px] font-display tabular-nums" style={{ color: SCORE_COLOR(score) }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3 px-0.5">
        <div className="flex items-center gap-1 text-muted/60 text-xs font-body">
          <Download className="w-3 h-3" />
          {formatInstalls(template.installCount)} installs
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-muted/50 text-[10px] font-body">Avg completion</p>
            <p className="text-[10px] font-body" style={{ color: template.avgCompletionRate >= 0.7 ? '#3dbd7a' : '#8a9bb5' }}>
              {Math.round(template.avgCompletionRate * 100)}%
            </p>
          </div>
          <div className="h-1 rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${template.avgCompletionRate * 100}%`, background: color }}
            />
          </div>
        </div>
      </div>

      {/* Creator + action */}
      <div className="flex items-center gap-2">
        <p className="text-muted/50 text-[10px] font-body flex-1">by @{template.creatorUsername}</p>
        {installed ? (
          <span className="flex items-center gap-1 text-[10px] font-body text-bloom/70">
            <Star className="w-3 h-3" /> Installed
          </span>
        ) : (
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body transition-all"
            style={{
              border: `1px solid ${color}40`,
              background: `${color}12`,
              color,
            }}
          >
            Preview &amp; Install
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function CommunityPage() {
  const router = useRouter()
  const [profile,    setProfile]    = useState<UserProfile | null>(null)
  const [social,     setSocial]     = useState<SocialState>({ friendStatuses: {}, sentGifts: [], sentEncouragements: [] })
  const [gold,       setGold]       = useState(0)
  const [tab,        setTab]        = useState<Tab>('discover')
  const [giftTarget, setGiftTarget] = useState<DemoUser | null>(null)
  const [toast,      setToast]      = useState<string | null>(null)
  const [booted,     setBooted]     = useState(false)
  // Library
  const [libCategory,       setLibCategory]       = useState<GoalCategory | 'all'>('all')
  const [previewTemplate,   setPreviewTemplate]   = useState<RoutineTemplate | null>(null)
  const [installedTemplates, setInstalledTemplates] = useState<Set<string>>(new Set())

  useEffect(() => {
    setProfile(getProfile())
    setSocial(getSocialState())
    setGold(getGoldBalance())
    setInstalledTemplates(getInstalledTemplates())
    setBooted(true)
  }, [])

  function handleSaveProfile(p: UserProfile) {
    saveProfile(p)
    setProfile(p)
  }

  function handleFriend(user: DemoUser) {
    const current = social.friendStatuses[user.id] ?? 'none'
    if (current !== 'none') return
    setFriendStatus(user.id, 'requested')
    setSocial(s => ({ ...s, friendStatuses: { ...s.friendStatuses, [user.id]: 'requested' } }))
    setToast(`Friend request sent to @${user.username} ✦`)
    // Auto-accept after 1.8s for the demo
    setTimeout(() => {
      setFriendStatus(user.id, 'friends')
      setSocial(s => ({ ...s, friendStatuses: { ...s.friendStatuses, [user.id]: 'friends' } }))
    }, 1800)
  }

  function handleGiftSend(user: DemoUser, pack: GiftRecord['pack']) {
    recordGift(user.id, pack)
    setSocial(s => ({
      ...s,
      sentGifts: [{ userId: user.id, pack, date: new Date().toISOString().slice(0, 10) }, ...s.sentGifts],
    }))
    setGiftTarget(null)
    const packLabel = GIFT_PACKS.find(p => p.pack === pack)!
    setToast(`${packLabel.label} sent to @${user.username} ✦`)
  }

  function handleEncourage(user: DemoUser) {
    recordEncouragement(user.id)
    setSocial(s => ({
      ...s,
      sentEncouragements: [...s.sentEncouragements, user.id],
    }))
    const name = profile?.username ?? 'Someone'
    setToast(`"Hey, @${name} is rooting for you. Keep going." — sent to @${user.username}`)
  }

  const friendIds = Object.entries(social.friendStatuses)
    .filter(([, status]) => status === 'friends' || status === 'requested')
    .map(([id]) => id)

  const discoverUsers = DEMO_USERS.filter(u => (social.friendStatuses[u.id] ?? 'none') === 'none')
  const friendUsers   = DEMO_USERS.filter(u => friendIds.includes(u.id))

  if (!booted) return null

  return (
    <main className="min-h-screen bg-void text-text">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 0%, #0a0820 0%, transparent 50%)' }}
      />

      {/* Username setup */}
      {!profile && <UsernameModal onSave={handleSaveProfile} />}

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-32">

        {/* Header */}
        <div className="flex items-center gap-3 pt-5 pb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-muted hover:text-text transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-text text-base tracking-wide">Community</h1>
            {profile && (
              <p className="text-muted text-xs mt-0.5 flex items-center gap-1.5">
                @{profile.username}
                {profile.isPublic
                  ? <><Globe className="w-2.5 h-2.5 text-bloom" /><span className="text-bloom/70">Public</span></>
                  : <><Lock className="w-2.5 h-2.5" />Private</>}
              </p>
            )}
          </div>
          {profile && (
            <button
              onClick={() => {
                saveProfile({ ...profile, isPublic: !profile.isPublic })
                setProfile(p => p ? { ...p, isPublic: !p.isPublic } : p)
              }}
              className="p-2 text-muted hover:text-text transition-colors"
              title={profile.isPublic ? 'Make private' : 'Make public'}
            >
              {profile.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-surface/40 rounded-xl p-1">
          {([
            { id: 'discover', label: 'Discover' },
            { id: 'library',  label: 'Library'  },
            { id: 'friends',  label: `Friends${friendIds.length > 0 ? ` (${friendIds.length})` : ''}` },
          ] as { id: Tab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-lg text-xs font-display tracking-wide transition-all ${
                tab === id
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'text-muted hover:text-text/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Discover tab ── */}
        {tab === 'discover' && (
          <div className="space-y-3">
            {discoverUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                friendStatus={social.friendStatuses[user.id] ?? 'none'}
                hasEncouraged={social.sentEncouragements.includes(user.id)}
                myUsername={profile?.username ?? 'you'}
                onFriend={() => handleFriend(user)}
                onGift={() => setGiftTarget(user)}
                onEncourage={() => handleEncourage(user)}
              />
            ))}
            {discoverUsers.length === 0 && (
              <p className="text-center text-muted text-sm py-16 font-body">
                You&apos;ve connected with everyone. Check Friends.
              </p>
            )}
          </div>
        )}

        {/* ── Library tab ── */}
        {tab === 'library' && (() => {
          const allCategories: (GoalCategory | 'all')[] = [
            'all', 'fitness', 'business', 'creative', 'learning', 'spiritual', 'health', 'relationships',
          ]
          const filtered = libCategory === 'all'
            ? ROUTINE_TEMPLATES
            : ROUTINE_TEMPLATES.filter(t => t.goalCategory === libCategory)

          return (
            <div>
              {/* Category filter chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                {allCategories.map(cat => {
                  const active = libCategory === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setLibCategory(cat)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-body border transition-all capitalize ${
                        active
                          ? 'bg-gold/15 border-gold/35 text-gold'
                          : 'bg-surface/40 border-border/40 text-muted hover:text-text hover:border-border/70'
                      }`}
                    >
                      {cat === 'all' ? 'All routines' : CATEGORY_LABELS[cat as GoalCategory]}
                    </button>
                  )
                })}
              </div>

              {/* Template cards */}
              <div className="space-y-3">
                {filtered.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    installed={installedTemplates.has(template.id)}
                    onPreview={() => setPreviewTemplate(template)}
                  />
                ))}
              </div>

              <p className="text-center text-muted/35 text-[10px] font-body mt-8 pb-2">
                Templates with ★ 8.0+ are Consultant-verified. More added weekly.
              </p>
            </div>
          )
        })()}

        {/* ── Friends tab ── */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friendUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                friendStatus={social.friendStatuses[user.id] ?? 'none'}
                hasEncouraged={social.sentEncouragements.includes(user.id)}
                myUsername={profile?.username ?? 'you'}
                onFriend={() => handleFriend(user)}
                onGift={() => setGiftTarget(user)}
                onEncourage={() => handleEncourage(user)}
              />
            ))}
            {friendUsers.length === 0 && (
              <p className="text-center text-muted text-sm py-16 font-body">
                No connections yet. Head to Discover to find your people.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Gift sheet */}
      <AnimatePresence>
        {giftTarget && (
          <GiftSheet
            user={giftTarget}
            gold={gold}
            onClose={() => setGiftTarget(null)}
            onSend={pack => handleGiftSend(giftTarget, pack)}
          />
        )}
      </AnimatePresence>

      {/* Template install sheet */}
      <AnimatePresence>
        {previewTemplate && (
          <TemplateInstallSheet
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onInstalled={() => {
              setInstalledTemplates(s => new Set([...s, previewTemplate.id]))
              setPreviewTemplate(null)
              setToast(`${previewTemplate.title} installed ✦`)
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast} message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </main>
  )
}
