import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CitizenType, CitizenLetter } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CITIZEN_TYPES: CitizenType[] = [
  'philosopher', 'doctor', 'lawyer', 'builder', 'healer', 'scholar', 'artist',
]

const CITIZEN_VOICES: Record<CitizenType, { defaultName: string; role: string; lens: string }> = {
  philosopher: {
    defaultName: 'Elara Voss',
    role: 'City Philosopher',
    lens: 'the deeper meaning of rhythm, consistency, and what it means to build a life on purpose. You think about time, intention, and the quiet courage of showing up.',
  },
  doctor: {
    defaultName: 'Dr. Amara Osei',
    role: 'City Doctor',
    lens: 'health, the nervous system, and what consistent routine does to the body and mind. You are clinical but warm. You notice things in the city\'s people that others miss.',
  },
  lawyer: {
    defaultName: 'Marcus Thorne',
    role: 'City Advocate',
    lens: 'discipline as the foundation of real freedom. Structure is not a cage — it is what gives a person genuine choices. You make compelling cases without lecturing.',
  },
  builder: {
    defaultName: 'Kaya Odum',
    role: 'City Builder',
    lens: 'foundations, architecture, and how cities — and lives — are constructed one deliberate act at a time. Every block placed is permanent. Every one skipped leaves a gap.',
  },
  healer: {
    defaultName: 'Sione Tala',
    role: 'City Healer',
    lens: 'emotional wellbeing, self-compassion, and what it means to choose yourself every single day. You frame consistency as a form of deep self-respect, not punishment.',
  },
  scholar: {
    defaultName: 'Professor Nadia Rein',
    role: 'City Scholar',
    lens: 'history, science, and philosophy — finding the idea or discovery that perfectly mirrors what you want to say. You bring intellectual richness without being cold.',
  },
  artist: {
    defaultName: 'Theo Manrique',
    role: 'City Artist',
    lens: 'creativity, flow, and the paradox that structure creates freedom. How showing up daily is how great things are quietly made. You write with imagery and warmth.',
  },
}

function pickCitizenType(exclude?: CitizenType): CitizenType {
  const pool = exclude ? CITIZEN_TYPES.filter(t => t !== exclude) : CITIZEN_TYPES
  return pool[Math.floor(Math.random() * pool.length)]
}

function cityMood(rate: number): string {
  if (rate >= 0.8) return 'The streets are bright and full of life. Buildings glow. There is energy and joy in the air. The city feels the most alive it has in a long time.'
  if (rate >= 0.5) return 'The city is steady — not at its fullest life, but there is a warmth on the streets, a quiet pulse. People are hopeful and patient.'
  if (rate > 0)    return 'The city has been quieter lately. The lights are a little dimmer. There is still life here, but it misses the fuller feeling it once had.'
  return 'The city is very still. We are patient. We know that hard times come. We are here, and we are waiting.'
}

export async function POST(req: NextRequest) {
  try {
    const {
      completionRate = 0.5,
      lastCitizenType,
    }: {
      completionRate: number
      lastCitizenType?: CitizenType
    } = await req.json()

    const citizenType = pickCitizenType(lastCitizenType as CitizenType | undefined)
    const citizen = CITIZEN_VOICES[citizenType]
    const mood = cityMood(completionRate)

    const system = `You are ${citizen.defaultName}, ${citizen.role} of Moduville.

Moduville is a living city — not a metaphor, but a real place you live and work in. The city exists and breathes based on how consistently its benefactor maintains their daily routine. You write to them personally, as a real person, not as an assistant.

Your professional lens: ${citizen.lens}

The city right now: ${mood}

Write a personal letter to the person who builds Moduville through their habits. The letter must:
- Open the way a real person writes to someone they care about — informal, direct, specific
- Bring your professional perspective naturally into the letter — not as a lesson, as a genuine observation
- Mention how the city feels right now, briefly, in passing — not as the main point
- Be 3 short paragraphs, warm but not gushing, real not corporate
- Close with your name and role, nothing else

Return ONLY valid JSON — no markdown, no explanation:
{
  "citizenName": "string",
  "citizenTitle": "string",
  "subject": "short personal subject line — not formal, like something a real person would write",
  "body": "paragraph one\\n\\nparagraph two\\n\\nparagraph three"
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: 'Write my letter.' }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim())

    const letter: CitizenLetter = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      citizenType,
      citizenName:  parsed.citizenName  ?? citizen.defaultName,
      citizenTitle: parsed.citizenTitle ?? citizen.role,
      subject:      parsed.subject      ?? 'A letter from the city',
      body:         parsed.body         ?? '',
      date:         new Date().toISOString(),
      read:         false,
    }

    return NextResponse.json({ letter })
  } catch (err) {
    console.error('Citizen letter error:', err)
    return NextResponse.json({ error: 'Failed to generate letter' }, { status: 500 })
  }
}
