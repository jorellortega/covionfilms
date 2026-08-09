import { NextRequest, NextResponse } from 'next/server'
import { checkVideoAccess } from '@/lib/content-access'
import {
  getPurchasePrice,
  isEpisodeContent,
  type PurchaseType,
} from '@/lib/content-pricing'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { getSiteUrl, getStripe, getOrCreateStripeCustomer, isStripeConfigured } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.' },
        { status: 503 }
      )
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please log in to purchase' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const videoId = typeof body.videoId === 'string' ? body.videoId.trim() : ''
    const purchaseType = body.purchaseType as PurchaseType

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    if (purchaseType !== 'movie' && purchaseType !== 'episode') {
      return NextResponse.json({ error: 'purchaseType must be movie or episode' }, { status: 400 })
    }

    const { data: video, error } = await supabaseServer
      .from('video_assets')
      .select('id, title, content_type, parent_id, is_free')
      .eq('id', videoId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const isEpisode = isEpisodeContent(video.content_type, video.parent_id)
    const movieVideoId = isEpisode && video.parent_id ? video.parent_id : video.id

    if (purchaseType === 'episode' && !isEpisode) {
      return NextResponse.json(
        { error: 'This title is not sold as a single episode' },
        { status: 400 }
      )
    }

    const access = await checkVideoAccess(
      video,
      user.id,
      user.role,
      user.subscription
    )

    if (access.hasAccess) {
      return NextResponse.json({
        success: true,
        alreadyOwned: true,
        message: 'You already have access to this title',
      })
    }

    const targetVideoId = purchaseType === 'movie' ? movieVideoId : video.id
    const amount = getPurchasePrice(purchaseType)
    const unitAmount = Math.round(amount * 100)

    let productName =
      purchaseType === 'movie'
        ? `Full title: ${video.title}`
        : `Episode: ${video.title}`

    if (purchaseType === 'movie' && isEpisode && video.parent_id) {
      const { data: parent } = await supabaseServer
        .from('video_assets')
        .select('title')
        .eq('id', video.parent_id)
        .maybeSingle()
      if (parent?.title) {
        productName = `Full series: ${parent.title}`
      }
    }

    const stripe = getStripe()
    const siteUrl = getSiteUrl(request)

    const customerId = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email,
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: productName,
              description:
                purchaseType === 'movie'
                  ? 'One-time purchase — full movie/series unlock'
                  : 'One-time purchase — single episode unlock',
              metadata: {
                purchaseType,
                targetVideoId,
                watchVideoId: videoId,
              },
            },
          },
        },
      ],
      metadata: {
        type: 'content_purchase',
        userId: user.id,
        purchaseType,
        targetVideoId,
        watchVideoId: videoId,
      },
      success_url: `${siteUrl}/watch/${videoId}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/watch/${videoId}?purchase=canceled`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      amount,
      purchaseType,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Purchase failed'
    console.error('Content purchase checkout error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
