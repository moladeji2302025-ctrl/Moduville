import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  ROUTINE_GENERATION_SYSTEM_PROMPT,
  buildRoutineGenerationMessages,
} from '@/lib/claude'
import type { UserGoal } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { goals }: { goals: UserGoal[] } = await req.json()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: ROUTINE_GENERATION_SYSTEM_PROMPT,
      messages: buildRoutineGenerationMessages(goals),
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    // Strip any accidental markdown fences
    const jsonStr = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const routine = JSON.parse(jsonStr)

    return NextResponse.json({ routine })
  } catch (error) {
    console.error('Routine generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate routine. Check your ANTHROPIC_API_KEY.' },
      { status: 500 }
    )
  }
}
