import { NextRequest, NextResponse } from 'next/server'

// ElevenLabs pre-made voices chosen for persona fit
const VOICE_IDS: Record<'lady' | 'wiseman', string> = {
  lady:    '21m00Tcm4TlvDq8ikWAM', // Rachel — calm, clear, sophisticated
  wiseman: 'pNInz6obpgDQGcFmaJgB', // Adam   — deep, measured, authoritative
}

export async function POST(req: NextRequest) {
  const { text, persona } = await req.json() as {
    text:    string
    persona: 'lady' | 'wiseman'
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not set' }, { status: 500 })
  }

  const voiceId = VOICE_IDS[persona] ?? VOICE_IDS.lady

  // Clamp to 3000 chars — stays well within ElevenLabs per-request limits
  const safeText = text.trim().slice(0, 3000)

  let elRes: Response
  try {
    elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key':   apiKey,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg',
        },
        body: JSON.stringify({
          text: safeText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability:        0.55,
            similarity_boost: 0.75,
            style:            0.0,
            use_speaker_boost: true,
          },
        }),
      },
    )
  } catch {
    return NextResponse.json({ error: 'ElevenLabs unreachable' }, { status: 502 })
  }

  if (!elRes.ok) {
    const msg = await elRes.text().catch(() => elRes.statusText)
    return NextResponse.json({ error: msg }, { status: elRes.status })
  }

  // Stream the audio/mpeg directly to the client
  return new Response(elRes.body, {
    headers: {
      'Content-Type':  'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  })
}
