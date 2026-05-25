'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Zap, Crown, CheckCircle2, Loader2 } from 'lucide-react'
import { getGoldBalance, setGoldBalance, getProfile, saveProfile } from '@/lib/storage'

// ── Pack definitions ──────────────────────────────────────────────────────────

const PACKS = [
  {
    id:          'starter',
    label:       'Starter',
    gold:        50,
    amountCents: 100,    // $1.00 USD  (smallest unit)
    price:       '$1',
    Icon:        Star,
    color:       '#8a9bb5',
    desc:        'Try it out',
  },
  {
    id:          'standard',
    label:       'Standard',
    gold:        250,
    amountCents: 500,    // $5.00 USD
    price:       '$5',
    Icon:        Zap,
    color:       '#d4a853',
    desc:        'Best value',
    popular:     true,
  },
  {
    id:          'pro',
    label:       'Pro',
    gold:        500,
    amountCents: 1000,   // $10.00 USD
    price:       '$10',
    Icon:        Crown,
    color:       '#7c6fff',
    desc:        'Full power',
  },
] as const

// ── Global type for Paystack Inline JS ───────────────────────────────────────

declare global {
  interface Window {
    PaystackPop?: {
      setup(opts: {
        key:      string
        email:    string
        amount:   number
        currency?: string
        ref:      string
        callback: (res: { reference: string }) => void
        onClose:  () => void
      }): { openIframe(): void }
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onClose:         () => void
  onGoldUpdated?:  (balance: number) => void
}

export function GoldShopSheet({ onClose, onGoldUpdated }: Props) {
  const [balance,    setBalanceState] = useState(getGoldBalance())
  const [email,      setEmail]        = useState(getProfile()?.email ?? '')
  const [processing, setProcessing]   = useState<string | null>(null)
  const [success,    setSuccess]      = useState<{ gold: number } | null>(null)
  const [error,      setError]        = useState<string | null>(null)
  const scriptLoaded = useRef(false)

  // Lazily inject the Paystack inline script
  useEffect(() => {
    if (scriptLoaded.current) return
    scriptLoaded.current = true
    if (!document.querySelector('script[src*="paystack"]')) {
      const s = document.createElement('script')
      s.src   = 'https://js.paystack.co/v1/inline.js'
      s.async = true
      document.head.appendChild(s)
    }
  }, [])

  const pubKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? ''

  async function handleBuy(packId: string, amountCents: number, gold: number) {
    if (!email.trim()) { setError('Enter your email to continue.'); return }
    if (!pubKey)       { setError('Paystack not configured. Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.'); return }
    if (!window.PaystackPop) { setError('Payment SDK still loading — try again in a moment.'); return }

    setError(null)
    setProcessing(packId)

    // Persist email to profile so it pre-fills next time
    const profile = getProfile()
    if (profile) saveProfile({ ...profile, email: email.trim() })

    const ref = `mod-${packId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    window.PaystackPop.setup({
      key:      pubKey,
      email:    email.trim(),
      amount:   amountCents,
      currency: 'USD',
      ref,
      callback: async ({ reference }) => {
        try {
          const res  = await fetch('/api/paystack/verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ reference }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Verification failed')

          const newBalance = balance + (data.gold as number)
          setGoldBalance(newBalance)
          setBalanceState(newBalance)
          onGoldUpdated?.(newBalance)
          setSuccess({ gold: data.gold as number })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not verify payment')
        } finally {
          setProcessing(null)
        }
      },
      onClose: () => setProcessing(null),
    }).openIframe()
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 270 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-deep border-t border-border/70 rounded-t-2xl max-w-lg mx-auto"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
          <div>
            <p className="font-display text-[11px] tracking-[0.38em] uppercase text-gold">Gold Shop</p>
            <p className="text-muted text-[11px] mt-0.5">
              Balance: <span className="text-gold font-body">{balance.toFixed(1)}G</span>
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div
          className="overflow-y-auto px-5 py-5 space-y-4"
          style={{ maxHeight: 'calc(90vh - 64px)' }}
        >
          <AnimatePresence mode="wait">

            {/* ── Success state ── */}
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-10 gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 250 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-gold" />
                </motion.div>
                <p className="font-display text-gold text-base tracking-wide">
                  +{success.gold}G added
                </p>
                <p className="text-muted text-xs">New balance: {balance.toFixed(1)}G</p>
                <button
                  onClick={onClose}
                  className="mt-5 text-xs text-muted/60 hover:text-muted transition-colors"
                >
                  Done
                </button>
              </motion.div>

            ) : (

              /* ── Shop state ── */
              <motion.div key="shop" className="space-y-4">

                {/* Email */}
                <div>
                  <label className="text-muted text-xs font-body block mb-1.5">Payment email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-body placeholder:text-muted/35 focus:outline-none focus:border-border/80 transition-colors"
                  />
                </div>

                {/* Pack cards */}
                <div className="space-y-2.5">
                  {PACKS.map(({ id, label, gold, amountCents, price, Icon, color, desc, ...rest }) => {
                    const isLoading = processing === id
                    const isPopular = 'popular' in rest && rest.popular
                    return (
                      <button
                        key={id}
                        onClick={() => handleBuy(id, amountCents, gold)}
                        disabled={!!processing}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all disabled:opacity-50 relative overflow-hidden text-left"
                        style={{ borderColor: `${color}35`, background: `${color}09` }}
                      >
                        {isPopular && (
                          <span
                            className="absolute top-2.5 right-3 text-[9px] font-display tracking-widest uppercase"
                            style={{ color }}
                          >
                            Popular
                          </span>
                        )}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${color}22` }}
                        >
                          {isLoading
                            ? <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />
                            : <Icon  className="w-4 h-4" style={{ color }} />
                          }
                        </div>
                        <div className="flex-1">
                          <p className="text-text text-sm font-body font-medium">{label}</p>
                          <p className="text-muted text-xs">{gold} Gold · {desc}</p>
                        </div>
                        <p className="font-display text-sm flex-shrink-0" style={{ color }}>{price}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-ember text-xs font-body text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <p className="text-muted/40 text-[11px] font-body text-center pt-1">
                  Secured by Paystack · Card, bank transfer &amp; mobile money accepted
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}
