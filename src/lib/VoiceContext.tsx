'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Web Speech API — not in all TS lib configs, so declare locally
interface SR {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((e: SREvent) => void) | null
  onend:    (() => void) | null
  onerror:  (() => void) | null
  start: () => void
  stop:  () => void
}
interface SREvent {
  resultIndex: number
  results: { [i: number]: { [i: number]: { transcript: string }; isFinal: boolean }; length: number }
}
type SRConstructor = new () => SR
function getSR(): SRConstructor | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as Record<string, unknown>).SpeechRecognition as SRConstructor
    ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition as SRConstructor
    ?? null
}

export type VoiceSpeed   = 'slow' | 'normal' | 'fast'
export type VoicePersona = 'default' | 'lady' | 'wiseman'

const RATE_MAP: Record<VoiceSpeed, number> = { slow: 0.8, normal: 1.0, fast: 1.3 }

// Voice name patterns used to identify browser voices by likely persona
const LADY_NAMES    = /samantha|victoria|karen|moira|fiona|allison|ava|serena|aria|zira|nicky|chloe|emma|sophie|female|woman/i
const WISEMAN_NAMES = /daniel|arthur|david|james|matthew|george|oliver|bruce|evan|mark|male\b|man\b/i

function pickVoice(persona: VoicePersona): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const en     = voices.filter(v => v.lang.startsWith('en'))
  if (persona === 'lady') {
    return en.find(v => LADY_NAMES.test(v.name))
        ?? en.find(v => v.lang.startsWith('en-US'))
        ?? en[0]
  }
  if (persona === 'wiseman') {
    return en.find(v => WISEMAN_NAMES.test(v.name))
        ?? en.find(v => v.lang.startsWith('en-GB'))
        ?? en.find(v => v.lang.startsWith('en'))
        ?? en[0]
  }
  return en.find(v => /natural|samantha|karen|daniel/i.test(v.name))
      ?? en.find(v => v.lang.startsWith('en-US'))
      ?? en[0]
}

interface VoiceContextValue {
  supported:        boolean
  isListening:      boolean
  isSpeaking:       boolean
  transcript:       string
  transcriptId:     number
  voiceEnabled:     boolean
  speed:            VoiceSpeed
  persona:          VoicePersona
  startListening:   () => void
  stopListening:    () => void
  speak:            (text: string) => void
  cancelSpeech:     () => void
  setVoiceEnabled:  (v: boolean) => void
  setSpeed:         (s: VoiceSpeed) => void
  setPersona:       (p: VoicePersona) => void
  clearTranscript:  () => void
}

const VoiceContext = createContext<VoiceContextValue | null>(null)

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [supported,    setSupported]    = useState(false)
  const [isListening,  setIsListening]  = useState(false)
  const [isSpeaking,   setIsSpeaking]   = useState(false)
  const [transcript,   setTranscript]   = useState('')
  const [transcriptId, setTranscriptId] = useState(0)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [speed,        setSpeed]        = useState<VoiceSpeed>('normal')
  const [persona,      setPersona]      = useState<VoicePersona>('default')

  const recognitionRef = useRef<SR | null>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setSupported(!!getSR() && 'speechSynthesis' in window)
  }, [])

  const cancelSpeech = useCallback(() => {
    // Stop ElevenLabs audio element
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    // Stop browser TTS
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speak = useCallback((text: string) => {
    if (!voiceEnabled) return
    cancelSpeech()

    // Browser TTS fallback (also used when ElevenLabs fails or persona is 'default')
    function browserSpeak() {
      if (!('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const utter   = new SpeechSynthesisUtterance(text)
      utter.rate    = RATE_MAP[speed]
      utter.volume  = 1.0
      utter.pitch   = persona === 'lady' ? 1.15 : persona === 'wiseman' ? 0.88 : 1.0
      const chosen  = pickVoice(persona)
      if (chosen) utter.voice = chosen
      utter.onstart = () => setIsSpeaking(true)
      utter.onend   = () => setIsSpeaking(false)
      utter.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utter)
    }

    if (persona !== 'default') {
      // ElevenLabs path — Rachel (lady) or Adam (wiseman)
      setIsSpeaking(true)
      fetch('/api/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: text.slice(0, 3000), persona }),
      })
        .then(res => { if (!res.ok) throw new Error('TTS error'); return res.blob() })
        .then(blob => {
          const url   = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current      = audio
          audio.playbackRate    = RATE_MAP[speed]
          audio.onended  = () => { setIsSpeaking(false); URL.revokeObjectURL(url) }
          audio.onerror  = () => { setIsSpeaking(false); URL.revokeObjectURL(url) }
          return audio.play()
        })
        .catch(() => {
          setIsSpeaking(false)
          browserSpeak()  // fallback if ElevenLabs fails
        })
      return
    }

    browserSpeak()
  }, [voiceEnabled, speed, persona, cancelSpeech])

  const startListening = useCallback(() => {
    const SR = getSR()
    if (!SR) return
    cancelSpeech()

    const rec = new SR()
    rec.continuous      = false
    rec.interimResults  = true
    rec.lang            = 'en-US'

    rec.onstart = () => setIsListening(true)

    rec.onresult = (event: SREvent) => {
      let interim = ''
      let final   = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      setTranscript(final || interim)
      if (final) setTranscriptId(n => n + 1)
    }

    rec.onend   = () => { setIsListening(false); recognitionRef.current = null }
    rec.onerror = () => { setIsListening(false); recognitionRef.current = null }

    recognitionRef.current = rec
    rec.start()
  }, [cancelSpeech])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  return (
    <VoiceContext.Provider value={{
      supported, isListening, isSpeaking, transcript, transcriptId,
      voiceEnabled, speed, persona,
      startListening, stopListening, speak, cancelSpeech,
      setVoiceEnabled, setSpeed, setPersona, clearTranscript,
    }}>
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const ctx = useContext(VoiceContext)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}
