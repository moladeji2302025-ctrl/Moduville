import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildConsultantSystemPrompt, buildPremiumConsultantPrompt } from '@/lib/claude'
import type { UserGoal, GeneratedRoutine, ConsultantMessage } from '@/lib/types'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const {
    messages,
    goals,
    routine,
    isPremium,
  }: {
    messages: ConsultantMessage[]
    goals: UserGoal[]
    routine: GeneratedRoutine
    isPremium?: boolean
  } = await req.json()

  const systemPrompt = isPremium
    ? buildPremiumConsultantPrompt(goals, routine)
    : buildConsultantSystemPrompt(goals, routine)

  // When messages is empty, use a trigger so Claude speaks first
  const apiMessages =
    messages.length === 0
      ? [{ role: 'user' as const, content: '[Begin the consultation]' }]
      : messages.map(m => ({ role: m.role, content: m.content }))

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: systemPrompt,
    messages: apiMessages,
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
