'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, FileText, Video, Camera, Check, XCircle, AlertCircle, Coins } from 'lucide-react'
import { getGoldBalance, deductGold, saveProof } from '@/lib/storage'
import type { ProofStatus, ProofType, RoutineBlock } from '@/lib/types'

const PROOF_COST = 0.25

const OPTIONS: { type: ProofType; icon: React.ElementType; label: string; hint: string }[] = [
  { type: 'social',   icon: Link2,     label: 'Social Post',  hint: 'Paste a link to your post'     },
  { type: 'document', icon: FileText,  label: 'Document',     hint: 'Paste a link to a doc or PDF'  },
  { type: 'video',    icon: Video,     label: 'Video Clip',   hint: 'Upload a short clip (≤10s)'    },
  { type: 'photo',    icon: Camera,    label: 'Photo',        hint: 'Upload a photo'                },
]

type Step = 'choose' | 'input' | 'analyzing' | 'result'

function mockAnalyse(): Promise<ProofStatus> {
  return new Promise(resolve =>
    setTimeout(() => {
      const r = Math.random()
      resolve(r < 0.70 ? 'approved' : r < 0.85 ? 'uncertain' : 'rejected')
    }, 2600)
  )
}

interface Props {
  block: RoutineBlock
  onClose: () => void
}

export function ProofDropPanel({ block, onClose }: Props) {
  const [step,         setStep]        = useState<Step>('choose')
  const [proofType,    setProofType]   = useState<ProofType | null>(null)
  const [inputValue,   setInputValue]  = useState('')
  const [fileName,     setFileName]    = useState('')
  const [result,       setResult]      = useState<ProofStatus | null>(null)
  const [note,         setNote]        = useState('')
  const [gold,         setGold]        = useState(getGoldBalance)
  const [noteSubmitted, setNoteSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isFileType  = proofType === 'video' || proofType === 'photo'
  const canSubmit   = isFileType ? !!fileName : inputValue.trim().length > 0
  const hasGold     = gold >= PROOF_COST

  function selectType(type: ProofType) {
    setProofType(type)
    setStep('input')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFileName(f.name)
  }

  async function handleSubmit() {
    if (!canSubmit || !proofType) return
    setStep('analyzing')
    const status = await mockAnalyse()
    setResult(status)

    const content = isFileType ? fileName : inputValue.trim()

    if (status !== 'rejected') {
      const newBal = deductGold(PROOF_COST)
      setGold(newBal)
      saveProof({
        id:          Date.now().toString(36) + Math.random().toString(36).slice(2),
        blockId:     block.id,
        blockName:   block.name,
        date:        new Date().toISOString().slice(0, 10),
        type:        proofType,
        content,
        status,
        submittedAt: new Date().toISOString(),
      })
    }
    setStep('result')
  }

  function submitNote() {
    if (!note.trim()) return
    setNoteSubmitted(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 270 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-deep border-t border-border/70 rounded-t-2xl max-w-lg mx-auto"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-border/40">
          <p className="font-display text-[11px] tracking-[0.38em] uppercase text-gold">
            {step === 'choose' ? 'Drop Proof' : step === 'analyzing' ? 'Analysing' : step === 'result' ? 'Result' : 'Your Proof'}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gold/70 text-xs font-body">
              <Coins className="w-3 h-3" />
              <span>{gold.toFixed(2)} G</span>
            </div>
            <button onClick={onClose} className="text-muted hover:text-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-6 overflow-y-auto" style={{ maxHeight: 'calc(88vh - 64px)' }}>
          <AnimatePresence mode="wait">

            {/* ── Choose ── */}
            {step === 'choose' && (
              <motion.div key="choose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <p className="text-text text-base font-display tracking-wide mb-1">
                  Care to drop a proof?
                </p>
                <p className="text-muted text-xs font-body mb-6">
                  Show what you actually did for <span className="text-text/80">{block.name}</span>.
                  Each submission costs <span className="text-gold">0.25 Gold</span>.
                </p>

                {!hasGold && (
                  <div className="mb-5 px-4 py-3 rounded-xl bg-ember/8 border border-ember/25">
                    <p className="text-ember/80 text-xs font-body">
                      Proof validation costs 0.25 Gold per submission. Add Gold to continue.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {OPTIONS.map(({ type, icon: Icon, label, hint }) => (
                    <button
                      key={type}
                      onClick={() => hasGold && selectType(type)}
                      disabled={!hasGold}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left ${
                        hasGold
                          ? 'border-border bg-surface/40 hover:border-gold/35 hover:bg-gold/5'
                          : 'border-border/30 bg-surface/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-gold/70" />
                      <div>
                        <p className="text-text text-xs font-display tracking-wide">{label}</p>
                        <p className="text-muted/60 text-[10px] font-body mt-0.5">{hint}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 text-muted text-xs font-body hover:text-text transition-colors"
                >
                  Skip for now
                </button>
              </motion.div>
            )}

            {/* ── Input ── */}
            {step === 'input' && proofType && (
              <motion.div key="input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <button
                  onClick={() => setStep('choose')}
                  className="text-muted text-xs font-body mb-4 hover:text-text transition-colors"
                >
                  ← Back
                </button>
                <p className="text-text text-base font-display tracking-wide mb-5">
                  {OPTIONS.find(o => o.type === proofType)?.label}
                </p>

                {isFileType ? (
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={proofType === 'video' ? 'video/*' : 'image/*'}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-10 rounded-xl border-2 border-dashed border-border/60 hover:border-gold/30 transition-colors flex flex-col items-center gap-2"
                    >
                      {fileName ? (
                        <>
                          <Check className="w-5 h-5 text-bloom" />
                          <p className="text-text text-xs font-body truncate max-w-[80%]">{fileName}</p>
                        </>
                      ) : (
                        <>
                          {proofType === 'video'
                            ? <Video className="w-5 h-5 text-muted/40" />
                            : <Camera className="w-5 h-5 text-muted/40" />}
                          <p className="text-muted text-xs font-body">Tap to select a file</p>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <input
                    autoFocus
                    type="url"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="https://"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-body placeholder:text-muted/35 focus:outline-none focus:border-border/80 transition-colors"
                  />
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full mt-5 py-3.5 rounded-2xl text-sm font-display tracking-wide transition-all"
                  style={canSubmit
                    ? { background: '#d4a85320', border: '1px solid #d4a85340', color: '#d4a853' }
                    : { background: '#17172e',   border: '1px solid #2a2a4a',   color: '#9896b840' }}
                >
                  Submit Proof
                </button>
              </motion.div>
            )}

            {/* ── Analyzing ── */}
            {step === 'analyzing' && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center py-12 gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold"
                />
                <p className="text-muted text-sm font-body">Analysing proof</p>
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="text-muted/40 text-xs font-body"
                >
                  Cross-referencing with {block.name}…
                </motion.p>
              </motion.div>
            )}

            {/* ── Result ── */}
            {step === 'result' && result && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>

                {result === 'approved' && (
                  <div className="flex flex-col items-center py-8 gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-bloom/15 border border-bloom/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-bloom" />
                    </div>
                    <div>
                      <p className="text-text font-display tracking-wide text-base">Proof accepted.</p>
                      <p className="text-bloom text-sm font-body mt-1">Full Elixir unlocked.</p>
                    </div>
                    <p className="text-muted/60 text-xs font-body">0.25 Gold deducted · Balance: {gold.toFixed(2)} G</p>
                    <button onClick={onClose}
                      className="mt-4 px-6 py-2.5 rounded-xl border border-bloom/30 bg-bloom/10 text-bloom text-sm font-body">
                      Done
                    </button>
                  </div>
                )}

                {result === 'rejected' && (
                  <div className="flex flex-col items-center py-8 gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-ember/12 border border-ember/28 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-ember" />
                    </div>
                    <div>
                      <p className="text-text font-display tracking-wide text-base">Doesn&apos;t seem to match.</p>
                      <p className="text-muted text-sm font-body mt-1 max-w-xs">
                        This doesn&apos;t quite line up with your <span className="text-text/80">{block.name}</span> block.
                        No Gold charged.
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setStep('input')}
                        className="px-5 py-2.5 rounded-xl border border-border text-muted text-sm font-body hover:text-text transition-colors">
                        Try again
                      </button>
                      <button onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-border/50 text-muted/60 text-sm font-body">
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                {result === 'uncertain' && (
                  <div className="flex flex-col items-center py-6 gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gold/12 border border-gold/28 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-text font-display tracking-wide text-base">We&apos;re not certain.</p>
                      <p className="text-muted text-sm font-body mt-1">60% Elixir awarded. Add a note to help us understand.</p>
                    </div>
                    <p className="text-muted/60 text-xs font-body">0.25 Gold deducted · Balance: {gold.toFixed(2)} G</p>

                    {!noteSubmitted ? (
                      <div className="w-full mt-2">
                        <textarea
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="e.g. This is my gym selfie from the 6am session…"
                          rows={3}
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-body placeholder:text-muted/35 focus:outline-none focus:border-border/80 transition-colors resize-none"
                        />
                        <div className="flex gap-3 mt-3">
                          <button
                            onClick={submitNote}
                            disabled={!note.trim()}
                            className="flex-1 py-2.5 rounded-xl border border-gold/30 bg-gold/10 text-gold text-sm font-body disabled:opacity-40"
                          >
                            Add Note
                          </button>
                          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border/50 text-muted text-sm font-body">
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 mt-2">
                        <Check className="w-4 h-4 text-bloom" />
                        <p className="text-muted text-xs font-body">Note saved. Thanks for the context.</p>
                        <button onClick={onClose}
                          className="px-6 py-2.5 rounded-xl border border-border text-muted text-sm font-body">
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}
