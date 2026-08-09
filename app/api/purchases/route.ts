import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { formatUsd } from '@/lib/content-pricing'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: purchases, error } = await supabaseServer
      .from('content_purchases')
      .select(
        'id, video_id, purchase_type, amount, created_at, stripe_checkout_session_id, stripe_payment_intent_id'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = purchases || []
    const videoIds = [...new Set(rows.map((row) => row.video_id).filter(Boolean))]

    const { data: videos } = videoIds.length
      ? await supabaseServer
          .from('video_assets')
          .select('id, title, content_type, parent_id, episode_number, cover_image_path')
          .in('id', videoIds)
      : { data: [] as {
          id: string
          title?: string
          content_type?: string
          parent_id?: string | null
          episode_number?: number | null
          cover_image_path?: string | null
        }[] }

    const parentIds = [
      ...new Set(
        (videos || [])
          .map((video) => video.parent_id)
          .filter((id): id is string => Boolean(id))
      ),
    ]

    const { data: parents } = parentIds.length
      ? await supabaseServer.from('video_assets').select('id, title').in('id', parentIds)
      : { data: [] as { id: string; title?: string }[] }

    const videoMap = new Map((videos || []).map((video) => [video.id, video]))
    const parentMap = new Map((parents || []).map((parent) => [parent.id, parent]))

    const receipts = rows.map((row) => {
      const video = videoMap.get(row.video_id)
      const parent = video?.parent_id ? parentMap.get(video.parent_id) : null
      const amount = Number(row.amount) || 0

      return {
        id: row.id,
        videoId: row.video_id,
        videoTitle: video?.title || 'Untitled',
        parentTitle: parent?.title || null,
        episodeNumber: video?.episode_number ?? null,
        coverImagePath: video?.cover_image_path || null,
        purchaseType: row.purchase_type as 'movie' | 'episode',
        amount,
        amountLabel: formatUsd(amount),
        createdAt: row.created_at,
        stripeCheckoutSessionId: row.stripe_checkout_session_id || null,
        stripePaymentIntentId: row.stripe_payment_intent_id || null,
        receiptNumber: `RCP-${row.id.slice(0, 8).toUpperCase()}`,
      }
    })

    const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.amount, 0)

    return NextResponse.json({
      receipts,
      summary: {
        count: receipts.length,
        movies: receipts.filter((r) => r.purchaseType === 'movie').length,
        episodes: receipts.filter((r) => r.purchaseType === 'episode').length,
        totalSpent,
        totalSpentLabel: formatUsd(totalSpent),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load purchases'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
