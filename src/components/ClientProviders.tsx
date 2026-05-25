'use client'

import { VoiceProvider } from '@/lib/VoiceContext'
import { VoiceMicButton } from '@/components/VoiceMicButton'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <VoiceProvider>
      {children}
      <VoiceMicButton />
    </VoiceProvider>
  )
}
