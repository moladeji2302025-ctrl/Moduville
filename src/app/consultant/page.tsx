'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Loader2, Mic, MicOff, ShoppingBag } from 'lucide-react'
import { useVoice } from '@/lib/VoiceContext'
import { GoldShopSheet } from '@/components/dashboard/GoldShopSheet'
import { buildPremiumConsultantPrompt } from '@/lib/claude'
import { loadRoutine, loadGoals, getGoldBalance, deductGold } from '@/lib/storage'
import type { ConsultantMessage, GeneratedRoutine, UserGoal } from '@/lib/types'

// ── Config ────────────────────────────────────────────────────────────────────

const SESSION_GOLD = 10       // Gold deducted per session
const SESSION_SECS = 15 * 60  // 15 minutes in seconds

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConsultantPage() {
  const router = useRouter()

  // Data
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null)
  const [goals,   setGoals]   = useState<UserGoal[]>([])
  const [gold,    setGold]    = useState(getGoldBalance())

  // Session phases: gate → active → expired
  const [phase, setPhase] = useState<'gate' | 'active' | 'expired'>('gate')

  // Chat
  const [messages,      setMessages]      = useState<ConsultantMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [input,         setInput]         = useState('')
  const [isStreaming,   setIsStreaming]    = useState(false)

  // Timer
  const [timeLeft,  setTimeLeft]  = useState(SESSION_SECS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // UI
  const [showShop, setShowShop] = useState(false)

  const hasInitialized = useRef(false)
  const bottomRef      = useRef<HTMLDivElement>(null)

  const {
    supported, isListening, transcript, transcriptId,
    speak, startListening, stopListening,
  } = useVoice()
  const lastTranscriptId = useRef(0)

  // ── Boot ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const r = loadRoutine()
    const g = loadGoals()
    if (!r) { router.replace('/onboarding'); return }
    setRoutine(r)
    setGoals(g)
    setGold(getGoldBalance())
  }, [router])

  // ── Scroll to latest ────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // ── Voice → input ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!transcript || transcriptId === lastTranscriptId.current) return
    lastTranscriptId.current = transcriptId
    setInput(transcript)
  }, [transcriptId, transcript])

  // ── Session timer ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'active') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setPhase('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function startSession() {
    const next = deductGold(SESSION_GOLD)
    setGold(next)
    setPhase('active')
    setTimeLeft(SESSION_SECS)
    if (!hasInitialized.current) {
      hasInitialized.current = true
      callConsultant([])
    }
  }

  function extendSession() {
    if (gold < SESSION_GOLD) return
    const next = deductGold(SESSION_GOLD)
    setGold(next)
    setPhase('active')
    setTimeLeft(SESSION_SECS)
  }

  async function callConsultant(currentMessages: ConsultantMessage[]) {
    if (!routine) return
    setIsStreaming(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/consultant', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:  currentMessages,
          goals,
          routine,
          isPremium: true,
        }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setStreamingText(full)
      }

      const finalMessages: ConsultantMessage[] = [
        ...currentMessages,
        { role: 'assistant', content: full },
      ]
      setMessages(finalMessages)
      setStreamingText('')
      speak(full)
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Connection issue. Please try again." },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming || phase !== 'active') return
    setInput('')
    const next: ConsultantMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    callConsultant(next)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Timer colour ────────────────────────────────────────────────────────────

  const timerColor = timeLeft <= 120 ? '#e05c2f' : timeLeft <= 300 ? '#d4a853' : '#9896b8'

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-void text-text flex flex-col max-w-lg mx-auto">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <p className="font-display text-[10px] tracking-[0.38em] uppercase text-gold">
            The Consultant
          </p>
          {phase === 'active' && (
            <p className="text-[11px] font-body tabular-nums" style={{ color: timerColor }}>
              {formatTime(timeLeft)} remaining
            </p>
          )}
        </div>

        {/* Gold balance + shop */}
        <button
          onClick={() => setShowShop(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gold/25 bg-gold/8 hover:bg-gold/14 transition-colors"
        >
          <ShoppingBag className="w-3 h-3 text-gold/70" />
          <span className="text-gold text-xs font-body tabular-nums">{gold.toFixed(0)}G</span>
        </button>
      </div>

      {/* ── Gate screen ── */}
      {phase === 'gate' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gold/12 border border-gold/25 flex items-center justify-center">
            <span className="font-display text-gold text-xl">C</span>
          </div>
          <div>
            <p className="font-display text-gold text-lg tracking-wide mb-2">Premium Consultation</p>
            <p className="text-muted/80 text-sm leading-relaxed">
              A focused 15-minute session with your Consultant.
              Bring a question, a frustration, or just show up.
            </p>
          </div>

          {gold >= SESSION_GOLD ? (
            <div className="space-y-3 w-full max-w-xs">
              <button
                onClick={startSession}
                className="w-full py-3.5 rounded-2xl font-display text-sm tracking-wide transition-all bg-gold/15 border border-gold/40 text-gold hover:bg-gold/22"
              >
                Start Session · {SESSION_GOLD}G
              </button>
              <p className="text-muted/40 text-[11px]">
                Your balance: {gold.toFixed(1)}G
              </p>
            </div>
          ) : (
            <div className="space-y-3 w-full max-w-xs">
              <p className="text-ember text-sm font-body">
                You need {SESSION_GOLD}G — you have {gold.toFixed(1)}G.
              </p>
              <button
                onClick={() => setShowShop(true)}
                className="w-full py-3.5 rounded-2xl font-display text-sm tracking-wide bg-surface border border-border text-muted hover:text-text transition-colors"
              >
                Buy Gold
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Active chat ── */}
      {(phase === 'active' || phase === 'expired') && (
        <>
          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'assistant'
                        ? 'bg-deep border border-border/60 text-text'
                        : 'bg-ember/10 border border-ember/25 text-text'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {streamingText && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[85%] bg-deep border border-border/60 rounded-2xl px-4 py-3 text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-0.5 h-3.5 bg-gold ml-0.5 align-text-bottom"
                  />
                </div>
              </motion.div>
            )}

            {isStreaming && !streamingText && (
              <div className="flex justify-start">
                <div className="bg-deep border border-border/60 rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 text-gold animate-spin" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Session expired overlay ── */}
          <AnimatePresence>
            {phase === 'expired' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-void/80 backdrop-blur-sm z-20 flex items-center justify-center px-8"
              >
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-deep border border-border/60 rounded-2xl p-7 max-w-xs w-full text-center space-y-4"
                >
                  <p className="font-display text-gold text-sm tracking-wide">Session ended</p>
                  <p className="text-muted text-xs leading-relaxed">
                    Your 15 minutes are up. Extend for another {SESSION_GOLD}G, or wrap up.
                  </p>
                  <div className="space-y-2.5">
                    {gold >= SESSION_GOLD ? (
                      <button
                        onClick={extendSession}
                        className="w-full py-3 rounded-xl font-display text-xs tracking-wide bg-gold/15 border border-gold/40 text-gold hover:bg-gold/22 transition-colors"
                      >
                        Extend · {SESSION_GOLD}G ({gold.toFixed(0)}G left)
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowShop(true)}
                        className="w-full py-3 rounded-xl font-display text-xs tracking-wide bg-surface border border-border text-muted hover:text-text transition-colors"
                      >
                        Buy Gold ({gold.toFixed(0)}G — need {SESSION_GOLD}G)
                      </button>
                    )}
                    <button
                      onClick={() => router.back()}
                      className="w-full py-3 rounded-xl text-xs font-body text-muted/60 hover:text-muted transition-colors"
                    >
                      End session
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input bar ── */}
          <div className="flex gap-2 items-end px-5 pb-8 pt-3 border-t border-border/25 flex-shrink-0">
            {supported && (
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => isListening ? stopListening() : startListening()}
                disabled={phase !== 'active'}
                className={`relative p-3 rounded-xl border transition-all flex-shrink-0 ${
                  isListening
                    ? 'bg-ember/15 border-ember/40 text-ember'
                    : 'bg-deep border-border text-muted hover:text-text hover:border-border/80'
                } disabled:opacity-30`}
              >
                {isListening && (
                  <motion.div
                    animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-xl bg-ember/30"
                  />
                )}
                {isListening ? <MicOff className="w-4 h-4 relative" /> : <Mic className="w-4 h-4" />}
              </motion.button>
            )}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={
                phase === 'expired' ? 'Session ended'
                : isListening      ? 'Listening…'
                : 'Talk to your Consultant…'
              }
              rows={1}
              disabled={isStreaming || phase === 'expired'}
              className="flex-1 bg-deep border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted/50 resize-none focus:outline-none focus:border-gold/45 transition-colors disabled:opacity-40"
              style={{ minHeight: 44, maxHeight: 140 }}
            />
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || phase !== 'active'}
              whileTap={{ scale: 0.93 }}
              className="p-3 bg-ember/10 border border-ember/30 rounded-xl text-text hover:bg-ember/20 hover:border-ember/55 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </>
      )}

      {/* ── Gold Shop Sheet ── */}
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
