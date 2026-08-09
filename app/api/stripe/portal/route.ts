import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { getSiteUrl, getStripe, isStripeConfigured } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: sub } = await supabaseServer
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Subscribe to a plan first.' },
        { status: 404 }
      )
    }

    const stripe = getStripe()

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${getSiteUrl(request)}/manage-subscription`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Portal session failed'
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
