'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, Mail, MailOpen } from 'lucide-react'
import { markLetterRead } from '@/lib/storage'
import type { CitizenLetter, CitizenType } from '@/lib/types'

const CITIZEN_COLORS: Record<CitizenType, string> = {
  philosopher: '#d4a853',
  doctor:      '#3dbd7a',
  lawyer:      '#8a9bb5',
  builder:     '#e05c2f',
  healer:      '#7c6fff',
  scholar:     '#4a7fff',
  artist:      '#c4c9e8',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

interface Props {
  letters: CitizenLetter[]
  onClose: () => void
  onLettersChange: (updated: CitizenLetter[]) => void
}

export function MailboxDrawer({ letters, onClose, onLettersChange }: Props) {
  const [openLetter, setOpenLetter] = useState<CitizenLetter | null>(null)

  function handleOpen(letter: CitizenLetter) {
    if (!letter.read) {
      markLetterRead(letter.id)
      onLettersChange(
        letters.map(l => (l.id === letter.id ? { ...l, read: true } : l))
      )
    }
    setOpenLetter(letter)
  }

  const color = openLetter ? CITIZEN_COLORS[openLetter.citizenType] : '#d4a853'

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 270 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-deep border-t border-border/70 rounded-t-2xl max-w-lg mx-auto"
        style={{ maxHeight: '82vh' }}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3" />

        {/* ── Letter detail view ── */}
        <AnimatePresence mode="wait">
          {openLetter ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col h-full"
              style={{ maxHeight: '76vh' }}
            >
              {/* Detail header */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-border/40">
                <button
                  onClick={() => setOpenLetter(null)}
                  className="text-muted hover:text-text transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm font-display truncate">{openLetter.subject}</p>
                  <p className="text-muted text-xs mt-0.5" style={{ color }}>
                    {openLetter.citizenName} · {openLetter.citizenTitle}
                  </p>
                </div>
                <p className="text-muted/50 text-xs shrink-0">{timeAgo(openLetter.date)}</p>
              </div>

              {/* Letter body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {openLetter.body.split('\n\n').map((para, i) => (
                  <p key={i} className="text-text/85 text-sm leading-7 mb-5 last:mb-0">
                    {para}
                  </p>
                ))}

                {/* Signature line */}
                <div className="mt-8 pt-5 border-t border-border/30">
                  <p className="font-display text-sm" style={{ color }}>
                    {openLetter.citizenName}
                  </p>
                  <p className="text-muted text-xs mt-0.5">{openLetter.citizenTitle}, Moduville</p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Letter list view ── */
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col"
              style={{ maxHeight: '76vh' }}
            >
              {/* List header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-border/40">
                <div>
                  <p className="font-display text-gold text-xs tracking-[0.35em] uppercase">Mailbox</p>
                  <p className="text-muted text-xs mt-0.5">Letters from Moduville</p>
                </div>
                <button onClick={onClose} className="text-muted hover:text-text transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Letters */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/25">
                {letters.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Mail className="w-8 h-8 text-border" />
                    <p className="text-muted text-sm">No letters yet.</p>
                    <p className="text-muted/60 text-xs">Keep showing up — the city will write.</p>
                  </div>
                )}

                {letters.map(letter => {
                  const lc = CITIZEN_COLORS[letter.citizenType]
                  return (
                    <button
                      key={letter.id}
                      onClick={() => handleOpen(letter)}
                      className="w-full flex items-start gap-3 px-5 py-4 hover:bg-surface/30 transition-colors text-left"
                    >
                      {/* Read indicator */}
                      <div className="mt-1 shrink-0">
                        {letter.read
                          ? <MailOpen className="w-4 h-4 text-muted/40" />
                          : <Mail className="w-4 h-4" style={{ color: lc }} />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={`text-sm font-display truncate ${letter.read ? 'text-muted' : 'text-text'}`}
                          >
                            {letter.citizenName}
                          </p>
                          <p className="text-muted/50 text-xs shrink-0">{timeAgo(letter.date)}</p>
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${letter.read ? 'text-muted/60' : 'text-text/70'}`}>
                          {letter.subject}
                        </p>
                        <p className="text-muted/50 text-xs mt-0.5 truncate">
                          {letter.body.slice(0, 80)}…
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
