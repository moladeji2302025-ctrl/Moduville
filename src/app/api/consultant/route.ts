import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildConsultantSystemPrompt } from '@/lib/claude'
import type { UserGoal, GeneratedRoutine, ConsultantMessage } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const {
    messages,
    goals,
    routine,
  }: {
    messages: ConsultantMessage[]
    goals: UserGoal[]
    routine: GeneratedRoutine
  } = await req.json()

  const systemPrompt = buildConsultantSystemPrompt(goals, routine)

  // When messages is empty, use a trigger so Claude speaks first
  const apiMessages =
    messages.length === 0
      ? [{ role: 'user' as const, content: '[Begin the consultation]' }]
      : messages.map(m => ({ role: m.role, content: m.content }))

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
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
