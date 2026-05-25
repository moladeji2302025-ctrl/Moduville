'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, Settings } from 'lucide-react'
import { useVoice } from '@/lib/VoiceContext'
import type { VoicePersona, VoiceSpeed } from '@/lib/VoiceContext'

export function VoiceMicButton() {
  const {
    supported, isListening, isSpeaking, transcript,
    voiceEnabled, speed, persona,
    startListening, stopListening, cancelSpeech,
    setVoiceEnabled, setSpeed, setPersona,
  } = useVoice()

  const [showSettings, setShowSettings] = useState(false)

  if (!supported) return null

  function handleMicClick() {
    if (showSettings) { setShowSettings(false); return }
    if (isListening)  stopListening()
    else              { cancelSpeech(); startListening() }
  }

  return (
    <div className="fixed bottom-6 right-4 z-30 flex flex-col items-end gap-2 pointer-events-none">

      {/* Transcript bubble */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            className="pointer-events-auto bg-deep border border-border/70 rounded-xl px-3 py-2 max-w-[180px] text-xs text-text font-body shadow-lg"
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings popover */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            className="pointer-events-auto bg-deep border border-border/70 rounded-xl p-3.5 w-44 shadow-lg"
          >
            {/* TTS toggle */}
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-muted text-xs font-body">Spoken replies</span>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-9 h-5 rounded-full transition-colors relative ${voiceEnabled ? 'bg-gold/55' : 'bg-border'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${voiceEnabled ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            {/* Voice persona */}
            <p className="text-muted text-[10px] font-body mb-1.5 uppercase tracking-widest">Voice</p>
            <div className="flex gap-1 mb-3.5">
              {([
                { id: 'lady',    label: 'Lady'     },
                { id: 'wiseman', label: 'Wise Man' },
              ] as { id: VoicePersona; label: string }[]).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setPersona(id)}
                  className={`flex-1 py-1.5 text-[10px] font-body rounded-lg border transition-all ${
                    persona === id ? 'border-gold/40 bg-gold/12 text-gold' : 'border-border/50 text-muted hover:text-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Speed */}
            <p className="text-muted text-[10px] font-body mb-1.5 uppercase tracking-widest">Speed</p>
            <div className="flex gap-1">
              {(['slow', 'normal', 'fast'] as VoiceSpeed[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`flex-1 py-1.5 text-[10px] font-body rounded-lg border transition-all capitalize ${
                    speed === s ? 'border-gold/40 bg-gold/12 text-gold' : 'border-border/50 text-muted hover:text-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button row */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setShowSettings(v => !v)}
          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all backdrop-blur-sm ${
            showSettings ? 'border-gold/35 bg-gold/10 text-gold' : 'border-border/50 bg-deep/80 text-muted/50 hover:text-muted'
          }`}
        >
          <Settings className="w-3 h-3" />
        </button>

        {/* Main mic button */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring */}
          {isListening && (
            <>
              <motion.div
                animate={{ scale: [1, 1.55], opacity: [0.35, 0] }}
                transition={{ repeat: Infinity, duration: 1.1, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-ember/40"
              />
              <motion.div
                animate={{ scale: [1, 1.9], opacity: [0.15, 0] }}
                transition={{ repeat: Infinity, duration: 1.1, delay: 0.28, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-ember/20"
              />
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.93 }}
            onClick={handleMicClick}
            className={`relative w-11 h-11 rounded-full border flex items-center justify-center backdrop-blur-sm transition-all ${
              isListening
                ? 'bg-ember/18 border-ember/50 text-ember'
                : isSpeaking
                ? 'bg-gold/10 border-gold/30 text-gold'
                : 'bg-deep/80 border-border/50 text-muted hover:text-text hover:border-border/80'
            }`}
          >
            {isSpeaking
              ? <Volume2 className="w-4 h-4" />
              : isListening
              ? <MicOff className="w-4 h-4" />
              : <Mic className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
