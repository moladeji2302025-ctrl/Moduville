import type { RoutineBlock, RoutineTemplate } from './types'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function timeToMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minsToTime(mins: number): string {
  const clamped = Math.min(Math.max(0, mins), 23 * 60 - 1)
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'tmpl-ceo',
    title: 'The 5 AM CEO Stack',
    subtitle: 'Built for business growth and deep work',
    goalCategory: 'business',
    elixirType: 'iron',
    creatorUsername: 'dev_chen',
    creatorNote: 'The non-negotiable part is protecting the first 90-minute block. Once I stopped checking notifications until 8 AM, my output tripled.',
    consultantScore: 9.3,
    consultantReview: 'Elite architecture — strong cognitive sequencing with proper recovery built in.',
    installCount: 2847,
    avgCompletionRate: 0.79,
    blocks: [
      { id: 't-ceo-1', name: 'Cold Shower + Gear Up', type: 'routine', elixirType: null, goalCategory: null, duration: 15, time: '05:00', days: ['mon','tue','wed','thu','fri'], description: 'Cold exposure to spike cortisol and lock in alertness.', verificationTier: 1 },
      { id: 't-ceo-2', name: 'Daily Intention Journal', type: 'goal', elixirType: 'iron', goalCategory: 'business', duration: 20, time: '05:20', days: ['mon','tue','wed','thu','fri'], description: 'Three wins from yesterday, one constraint to remove today, one non-negotiable.', verificationTier: 1 },
      { id: 't-ceo-3', name: 'Deep Work Block 1', type: 'goal', elixirType: 'iron', goalCategory: 'business', duration: 90, time: '05:45', days: ['mon','tue','wed','thu','fri'], description: 'Highest-leverage work only. No notifications, no meetings.', verificationTier: 2 },
      { id: 't-ceo-4', name: 'Breakfast', type: 'meal', elixirType: null, goalCategory: null, duration: 25, time: '07:30', days: ['mon','tue','wed','thu','fri'], description: 'Protein-first meal. Prepare the night before if possible.', verificationTier: 1 },
      { id: 't-ceo-5', name: 'Communications Window', type: 'routine', elixirType: null, goalCategory: null, duration: 40, time: '08:00', days: ['mon','tue','wed','thu','fri'], description: 'Emails, Slack, DMs — batched and processed in one shot.', verificationTier: 1 },
      { id: 't-ceo-6', name: 'Deep Work Block 2', type: 'goal', elixirType: 'iron', goalCategory: 'business', duration: 100, time: '09:00', days: ['mon','tue','wed','thu'], description: 'Build, ship, create. Second session for complex problem-solving.', verificationTier: 2 },
      { id: 't-ceo-7', name: 'Recovery Walk', type: 'rest', elixirType: null, goalCategory: null, duration: 20, time: '11:00', days: ['mon','tue','wed','thu','fri'], description: 'No podcast, no phone. Just movement and mental reset.', verificationTier: 1 },
    ],
  },
  {
    id: 'tmpl-marathon',
    title: 'Marathon Ready Protocol',
    subtitle: 'Built for endurance and race-day fitness',
    goalCategory: 'fitness',
    elixirType: 'fire',
    creatorUsername: 'james_fit',
    creatorNote: 'The evening walk gets overlooked but it\'s where the aerobic base actually builds. Don\'t skip it on easy days.',
    consultantScore: 9.1,
    consultantReview: 'Smart training load distribution — periodisation baked in at the schedule level.',
    installCount: 1432,
    avgCompletionRate: 0.83,
    blocks: [
      { id: 't-mara-1', name: 'Morning Run', type: 'goal', elixirType: 'fire', goalCategory: 'fitness', duration: 55, time: '06:00', days: ['mon','wed','fri','sat'], description: 'Fasted aerobic run. Conversational pace except for 2 tempo intervals on Wednesday.', verificationTier: 2 },
      { id: 't-mara-2', name: 'Post-Run Stretch', type: 'routine', elixirType: null, goalCategory: null, duration: 15, time: '07:00', days: ['mon','wed','fri','sat'], description: 'Hip flexors, calves, IT band. Non-negotiable recovery work.', verificationTier: 1 },
      { id: 't-mara-3', name: 'Breakfast + Fuelling Log', type: 'meal', elixirType: null, goalCategory: null, duration: 30, time: '07:20', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'High-carb recovery meal. Log what you ate in your training notes.', verificationTier: 1 },
      { id: 't-mara-4', name: 'Strength & Mobility', type: 'goal', elixirType: 'fire', goalCategory: 'fitness', duration: 40, time: '09:00', days: ['tue','thu'], description: 'Single-leg squats, glute bridges, calf raises. Injury prevention over strength gains.', verificationTier: 2 },
      { id: 't-mara-5', name: 'Evening Recovery Walk', type: 'goal', elixirType: 'fire', goalCategory: 'fitness', duration: 25, time: '19:00', days: ['mon','tue','wed','thu','fri'], description: 'Active recovery. Keeps the aerobic base building on rest-from-running days.', verificationTier: 1 },
      { id: 't-mara-6', name: 'Long Run', type: 'goal', elixirType: 'fire', goalCategory: 'fitness', duration: 90, time: '07:00', days: ['sun'], description: 'Weekly long run. Increase by 10% max each week. Bring nutrition.', verificationTier: 2 },
    ],
  },
  {
    id: 'tmpl-creator',
    title: 'Creator\'s Daily Stack',
    subtitle: 'Built for consistent content output',
    goalCategory: 'creative',
    elixirType: 'storm',
    creatorUsername: 'sofia_creates',
    creatorNote: 'Separate the creating from the editing. Never edit on the same day you create — your brain can\'t do both well.',
    consultantScore: 8.7,
    consultantReview: 'Excellent creative/admin separation. The engagement window prevents the doom-scroll trap.',
    installCount: 3211,
    avgCompletionRate: 0.71,
    blocks: [
      { id: 't-cre-1', name: 'Idea Capture Session', type: 'goal', elixirType: 'storm', goalCategory: 'creative', duration: 25, time: '08:00', days: ['mon','tue','wed','thu','fri'], description: 'Dump every idea in your notes. No filter. The filter comes later.', verificationTier: 1 },
      { id: 't-cre-2', name: 'Creation Block', type: 'goal', elixirType: 'storm', goalCategory: 'creative', duration: 90, time: '08:30', days: ['mon','tue','wed'], description: 'Film, write, record — whatever your medium is. Raw creation only.', verificationTier: 2 },
      { id: 't-cre-3', name: 'Coffee Break', type: 'rest', elixirType: null, goalCategory: null, duration: 20, time: '10:05', days: ['mon','tue','wed','thu','fri'], description: 'Step away from the screen entirely. Look at something far away.', verificationTier: 1 },
      { id: 't-cre-4', name: 'Editing Block', type: 'goal', elixirType: 'storm', goalCategory: 'creative', duration: 70, time: '10:30', days: ['thu','fri'], description: 'Edit yesterday\'s raw content only. Keep Monday–Wednesday creation sacred.', verificationTier: 2 },
      { id: 't-cre-5', name: 'Batch Posting + Engagement', type: 'routine', elixirType: null, goalCategory: null, duration: 30, time: '14:00', days: ['mon','tue','wed','thu','fri'], description: 'Post, respond, engage. Capped at 30 mins — not a minute more.', verificationTier: 1 },
      { id: 't-cre-6', name: 'Weekly Planning Session', type: 'goal', elixirType: 'storm', goalCategory: 'creative', duration: 45, time: '10:00', days: ['sun'], description: 'Content calendar for the week. Ideas, formats, topics, and hooks.', verificationTier: 1 },
    ],
  },
  {
    id: 'tmpl-spirit',
    title: 'Inner Work Protocol',
    subtitle: 'Built for spiritual depth and daily grounding',
    goalCategory: 'spiritual',
    elixirType: 'celestial',
    creatorUsername: 'leo_meditates',
    creatorNote: 'The midday pause saved me from afternoon burnout for months. 10 minutes of silence beats any energy drink.',
    consultantScore: 9.0,
    consultantReview: 'Rare to see spiritual practice structured this deliberately. Anchoring at three points in the day is clinically supported.',
    installCount: 987,
    avgCompletionRate: 0.76,
    blocks: [
      { id: 't-sp-1', name: 'Morning Prayer / Meditation', type: 'goal', elixirType: 'celestial', goalCategory: 'spiritual', duration: 30, time: '06:00', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'Stillness before the world gets loud. Gratitude, intention, or silent centering.', verificationTier: 1 },
      { id: 't-sp-2', name: 'Scripture / Sacred Reading', type: 'goal', elixirType: 'celestial', goalCategory: 'spiritual', duration: 20, time: '06:35', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'One passage. Read slowly. Let it sit.', verificationTier: 1 },
      { id: 't-sp-3', name: 'Midday Pause', type: 'routine', elixirType: null, goalCategory: null, duration: 10, time: '12:30', days: ['mon','tue','wed','thu','fri'], description: 'Set a timer. Breathe. Let go of the morning. Prepare for the afternoon.', verificationTier: 1 },
      { id: 't-sp-4', name: 'Evening Gratitude Journal', type: 'goal', elixirType: 'celestial', goalCategory: 'spiritual', duration: 15, time: '21:00', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'Three things that were good today. One thing you\'re releasing. One hope for tomorrow.', verificationTier: 1 },
      { id: 't-sp-5', name: 'Deep Sabbath Session', type: 'goal', elixirType: 'celestial', goalCategory: 'spiritual', duration: 60, time: '10:00', days: ['sun'], description: 'Extended contemplation, community, or service. Protected time — no work.', verificationTier: 2 },
    ],
  },
  {
    id: 'tmpl-scholar',
    title: 'Scholar\'s Rhythm',
    subtitle: 'Built for accelerated skill acquisition',
    goalCategory: 'learning',
    elixirType: 'wisdom',
    creatorUsername: 'priya_reads',
    creatorNote: 'The review session at the end is where the learning actually locks in. Skip it and you\'ll re-learn the same thing in a week.',
    consultantScore: 8.5,
    consultantReview: 'Pomodoro-adjacent but smarter — active recall baked into the session structure.',
    installCount: 1788,
    avgCompletionRate: 0.68,
    blocks: [
      { id: 't-sch-1', name: 'Study Session 1', type: 'goal', elixirType: 'wisdom', goalCategory: 'learning', duration: 90, time: '09:00', days: ['mon','tue','wed','thu','fri'], description: 'Primary learning block. New material, active reading, note-taking.', verificationTier: 2 },
      { id: 't-sch-2', name: 'Pomodoro Break', type: 'rest', elixirType: null, goalCategory: null, duration: 15, time: '10:35', days: ['mon','tue','wed','thu','fri'], description: 'Walk around. No phone. Brain consolidates during rest, not during reading.', verificationTier: 1 },
      { id: 't-sch-3', name: 'Study Session 2', type: 'goal', elixirType: 'wisdom', goalCategory: 'learning', duration: 80, time: '10:55', days: ['mon','tue','wed','thu','fri'], description: 'Second block. Apply or practice what you learned in session 1.', verificationTier: 2 },
      { id: 't-sch-4', name: 'Lunch', type: 'meal', elixirType: null, goalCategory: null, duration: 45, time: '12:20', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'Away from screens. Real food.', verificationTier: 1 },
      { id: 't-sch-5', name: 'Active Recall Review', type: 'goal', elixirType: 'wisdom', goalCategory: 'learning', duration: 30, time: '14:00', days: ['mon','tue','wed','thu','fri'], description: 'Flashcards, self-quizzing, or teaching the concept aloud. The forgetting curve is real.', verificationTier: 1 },
      { id: 't-sch-6', name: 'Weekend Deep Dive', type: 'goal', elixirType: 'wisdom', goalCategory: 'learning', duration: 120, time: '10:00', days: ['sat'], description: 'Project-based learning. Build something with what you studied all week.', verificationTier: 2 },
    ],
  },
  {
    id: 'tmpl-wellness',
    title: 'Wellness Foundation',
    subtitle: 'Built for sustainable energy and body health',
    goalCategory: 'health',
    elixirType: 'bloom',
    creatorUsername: 'amara_wellness',
    creatorNote: 'Start with just the morning yoga and evening walk. Everything else falls into place once those two are locked.',
    consultantScore: 8.2,
    consultantReview: 'Intelligently gentle — designed for compliance, not performance. High long-term adherence expected.',
    installCount: 2104,
    avgCompletionRate: 0.82,
    blocks: [
      { id: 't-wel-1', name: 'Morning Yoga / Stretch', type: 'goal', elixirType: 'bloom', goalCategory: 'health', duration: 30, time: '07:00', days: ['mon','tue','wed','thu','fri','sat','sun'], description: '20 minutes movement, 10 minutes breathing. YouTube routine or your own flow.', verificationTier: 1 },
      { id: 't-wel-2', name: 'Nourishing Breakfast', type: 'meal', elixirType: null, goalCategory: null, duration: 25, time: '07:35', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'Protein + slow carbs. Prep it the night before to remove friction.', verificationTier: 1 },
      { id: 't-wel-3', name: 'Midday Movement', type: 'goal', elixirType: 'bloom', goalCategory: 'health', duration: 15, time: '13:00', days: ['mon','tue','wed','thu','fri'], description: 'A short walk or 10-minute body-weight circuit. Breaks the sitting cycle.', verificationTier: 1 },
      { id: 't-wel-4', name: 'Nourishing Lunch', type: 'meal', elixirType: null, goalCategory: null, duration: 35, time: '13:20', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'No desk eating. Sit down, chew slowly, no screen.', verificationTier: 1 },
      { id: 't-wel-5', name: 'Evening Walk', type: 'goal', elixirType: 'bloom', goalCategory: 'health', duration: 25, time: '18:30', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'Sunlight + movement. Regulates circadian rhythm and lowers evening cortisol.', verificationTier: 1 },
      { id: 't-wel-6', name: 'Wind-Down Ritual', type: 'rest', elixirType: null, goalCategory: null, duration: 20, time: '21:30', days: ['mon','tue','wed','thu','fri','sat','sun'], description: 'No screens. Dim lights. Herbal tea + a few pages of a book.', verificationTier: 1 },
    ],
  },
  {
    id: 'tmpl-relship',
    title: 'Connection Architecture',
    subtitle: 'Built for meaningful relationships without burnout',
    goalCategory: 'relationships',
    elixirType: 'bloom',
    creatorUsername: 'nina_writes',
    creatorNote: 'Most people let relationships happen by accident. Scheduling them felt weird at first — now it\'s the thing I\'m most proud of.',
    consultantScore: 7.9,
    consultantReview: 'Underrated template category. Intentional relationship investment compounds quietly but powerfully.',
    installCount: 634,
    avgCompletionRate: 0.74,
    blocks: [
      { id: 't-rel-1', name: 'Morning Connection Message', type: 'goal', elixirType: 'bloom', goalCategory: 'relationships', duration: 10, time: '08:00', days: ['mon','wed','fri'], description: 'Send one meaningful text or voice note to someone you care about. Not a meme — something real.', verificationTier: 1 },
      { id: 't-rel-2', name: 'Weekly Catch-Up Call', type: 'goal', elixirType: 'bloom', goalCategory: 'relationships', duration: 40, time: '19:00', days: ['tue'], description: 'One scheduled call per week. Put it in both calendars. Show up.', verificationTier: 2 },
      { id: 't-rel-3', name: 'Family Dinner', type: 'meal', elixirType: null, goalCategory: null, duration: 50, time: '18:30', days: ['mon','wed','fri','sun'], description: 'Phones in a drawer. Screens off. Full presence.', verificationTier: 1 },
      { id: 't-rel-4', name: 'Date / Quality Time', type: 'goal', elixirType: 'bloom', goalCategory: 'relationships', duration: 90, time: '17:00', days: ['sat'], description: 'Protected time for your most important relationship. No exceptions.', verificationTier: 2 },
      { id: 't-rel-5', name: 'Outreach Planning', type: 'routine', elixirType: null, goalCategory: null, duration: 15, time: '09:00', days: ['sun'], description: 'Who do I want to connect with this week? Two names. One intention for each.', verificationTier: 1 },
    ],
  },
]

// ── Install helper ────────────────────────────────────────────────────────────

function findFreeTime(existingBlocks: RoutineBlock[], candidate: RoutineBlock): string {
  const overlapping = existingBlocks.filter(b =>
    b.days.some(d => candidate.days.includes(d))
  )

  let startMins = timeToMins(candidate.time)
  let moved = true

  while (moved) {
    moved = false
    for (const b of overlapping) {
      const bStart = timeToMins(b.time)
      const bEnd   = bStart + b.duration
      const cEnd   = startMins + candidate.duration
      if (startMins < bEnd && cEnd > bStart) {
        startMins = bEnd + 5
        moved = true
        break
      }
    }
  }

  // Clamp so block ends by 23:00
  startMins = Math.min(startMins, 23 * 60 - candidate.duration)
  return minsToTime(startMins)
}

export function adaptTemplateToRoutine(
  templateBlocks: RoutineBlock[],
  existingBlocks: RoutineBlock[],
): RoutineBlock[] {
  const result: RoutineBlock[] = []
  const combined = [...existingBlocks]

  for (const tmpl of templateBlocks) {
    const adaptedTime = findFreeTime(combined, tmpl)
    const newBlock: RoutineBlock = {
      ...tmpl,
      id:   uid(),
      time: adaptedTime,
    }
    result.push(newBlock)
    combined.push(newBlock)  // account for this block in subsequent checks
  }

  return result
}
