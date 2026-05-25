import { NextRequest, NextResponse } from 'next/server'

// Maps Paystack's verified amount (smallest currency unit) to Gold credits.
// Add rows here when you introduce new currencies or pricing tiers.
const AMOUNT_TO_GOLD: { currency: string; minAmount: number; gold: number }[] = [
  { currency: 'USD', minAmount: 1000, gold: 500 }, // $10.00 → 500G
  { currency: 'USD', minAmount: 500,  gold: 250 }, // $5.00  → 250G
  { currency: 'USD', minAmount: 100,  gold: 50  }, // $1.00  → 50G
  { currency: 'NGN', minAmount: 20000_00, gold: 500 }, // ₦20,000 → 500G
  { currency: 'NGN', minAmount: 10000_00, gold: 250 }, // ₦10,000 → 250G
  { currency: 'NGN', minAmount:  2000_00, gold: 50  }, // ₦2,000  → 50G
]

function resolveGold(amount: number, currency: string): number {
  const tiers = AMOUNT_TO_GOLD.filter(t => t.currency === currency)
  for (const tier of tiers) {
    if (amount >= tier.minAmount) return tier.gold
  }
  return 0
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data?: {
    status: string
    amount: number
    currency: string
    reference: string
  }
}

export async function POST(req: NextRequest) {
  const { reference } = await req.json() as { reference?: string }
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
  }

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })
  }

  let paystackData: PaystackVerifyResponse
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' },
    )
    paystackData = await res.json()
  } catch {
    return NextResponse.json({ error: 'Could not reach payment server' }, { status: 502 })
  }

  if (!paystackData.status || paystackData.data?.status !== 'success') {
    return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })
  }

  const { amount, currency } = paystackData.data
  const gold = resolveGold(amount, currency)

  if (gold === 0) {
    return NextResponse.json({ error: 'Amount does not match any Gold tier' }, { status: 400 })
  }

  return NextResponse.json({ gold, amountPaid: amount, currency })
}
