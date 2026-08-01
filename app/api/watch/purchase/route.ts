import { NextRequest, NextResponse } from 'next/server'
import { recordPurchase } from '@/lib/content-access'
import { getPurchasePrice, type PurchaseType } from '@/lib/content-pricing'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
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
      .select('id, title, content_type, parent_id')
      .eq('id', videoId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const result = await recordPurchase(
      user.id,
      video,
      purchaseType,
      user.role,
      user.subscription
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Purchase failed' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      purchaseType,
      amount: getPurchasePrice(purchaseType),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Purchase failed' }, { status: 500 })
  }
}
