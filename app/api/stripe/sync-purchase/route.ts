import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { isStripeConfigured } from '@/lib/stripe'
import { syncContentPurchaseSession } from '@/lib/stripe-purchases'

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 })
    }

    const body = await request.json()
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''

    if (!sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid checkout session id' }, { status: 400 })
    }

    const result = await syncContentPurchaseSession(sessionId, user.id)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync purchase'
    console.error('sync-purchase error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
