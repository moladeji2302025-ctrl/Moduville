'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'
import type { UserGoal, GeneratedRoutine, ConsultantMessage } from '@/lib/types'

interface Props {
  goals: UserGoal[]
  routine: GeneratedRoutine
  onComplete: () => void
}

const LOCK_IN_SIGNAL = 'Your routine is now locked in.'

export function StepConsultant({ goals, routine, onComplete }: Props) {
  const [messages, setMessages] = useState<ConsultantMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Fetch the consultant's opening message once
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    callConsultant([])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function callConsultant(currentMessages: ConsultantMessage[]) {
    setIsStreaming(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, goals, routine }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
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

      if (full.includes(LOCK_IN_SIGNAL)) {
        setIsLocked(true)
        setTimeout(onComplete, 2800)
      }
    } catch (err) {
      console.error('Consultant error:', err)
      setStreamingText('')
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please refresh and try again.",
        },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming || isLocked) return
    setInput('')
    const next: ConsultantMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    callConsultant(next)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-5 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 pb-5 border-b border-border/50"
      >
        <p className="font-display text-gold text-xs tracking-[0.4em] uppercase mb-1">
          The Consultant
        </p>
        <p className="text-muted text-xs">
          Let&apos;s make sure this routine actually fits your life.
        </p>
      </motion.div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-5 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
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

        {/* Streaming assistant message */}
        {streamingText && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
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

        {/* Thinking indicator (before first chunk) */}
        {isStreaming && !streamingText && (
          <div className="flex justify-start">
            <div className="bg-deep border border-border/60 rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-gold animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Lock-in notice */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4 font-display text-gold text-xs tracking-[0.35em] uppercase mb-2"
          >
            Routine Locked In · Opening your world...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {!isLocked && (
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Reply to the Consultant..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-deep border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted/50 resize-none focus:outline-none focus:border-gold/45 transition-colors disabled:opacity-50"
            style={{ minHeight: 44, maxHeight: 140 }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            whileTap={{ scale: 0.93 }}
            className="p-3 bg-ember/10 border border-ember/30 rounded-xl text-text hover:bg-ember/20 hover:border-ember/55 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </div>
  )
}
