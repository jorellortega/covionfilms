import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { formatUsd } from '@/lib/content-pricing'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const typeFilter = request.nextUrl.searchParams.get('type')
    const search = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || ''

    const { data: purchases, error } = await supabaseServer
      .from('content_purchases')
      .select(
        'id, user_id, video_id, purchase_type, amount, created_at, stripe_checkout_session_id, stripe_payment_intent_id'
      )
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = purchases || []
    const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))]
    const videoIds = [...new Set(rows.map((row) => row.video_id).filter(Boolean))]

    const [{ data: users }, { data: videos }] = await Promise.all([
      userIds.length
        ? supabaseServer.from('users').select('id, email, name, role').in('id', userIds)
        : Promise.resolve({ data: [] as { id: string; email?: string; name?: string; role?: string }[] }),
      videoIds.length
        ? supabaseServer
            .from('video_assets')
            .select('id, title, content_type, parent_id, episode_number')
            .in('id', videoIds)
        : Promise.resolve({
            data: [] as {
              id: string
              title?: string
              content_type?: string
              parent_id?: string | null
              episode_number?: number | null
            }[],
          }),
    ])

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

    const userMap = new Map((users || []).map((user) => [user.id, user]))
    const videoMap = new Map((videos || []).map((video) => [video.id, video]))
    const parentMap = new Map((parents || []).map((parent) => [parent.id, parent]))

    let items = rows.map((row) => {
      const user = userMap.get(row.user_id)
      const video = videoMap.get(row.video_id)
      const parent = video?.parent_id ? parentMap.get(video.parent_id) : null

      return {
        id: row.id,
        userId: row.user_id,
        userEmail: user?.email || null,
        userName: user?.name || null,
        userRole: user?.role || null,
        videoId: row.video_id,
        videoTitle: video?.title || 'Unknown title',
        parentTitle: parent?.title || null,
        episodeNumber: video?.episode_number ?? null,
        purchaseType: row.purchase_type as 'movie' | 'episode',
        amount: Number(row.amount) || 0,
        amountLabel: formatUsd(Number(row.amount) || 0),
        createdAt: row.created_at,
        stripeCheckoutSessionId: row.stripe_checkout_session_id || null,
        stripePaymentIntentId: row.stripe_payment_intent_id || null,
      }
    })

    if (typeFilter === 'movie' || typeFilter === 'episode') {
      items = items.filter((item) => item.purchaseType === typeFilter)
    }

    if (search) {
      items = items.filter((item) => {
        const haystack = [
          item.userEmail,
          item.userName,
          item.videoTitle,
          item.parentTitle,
          item.videoId,
          item.userId,
          item.stripeCheckoutSessionId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(search)
      })
    }

    const movieCount = items.filter((item) => item.purchaseType === 'movie').length
    const episodeCount = items.filter((item) => item.purchaseType === 'episode').length
    const revenue = items.reduce((sum, item) => sum + item.amount, 0)

    return NextResponse.json({
      purchases: items,
      summary: {
        total: items.length,
        movies: movieCount,
        episodes: episodeCount,
        revenue,
        revenueLabel: formatUsd(revenue),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load purchases'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const purchaseId = typeof body.purchaseId === 'string' ? body.purchaseId.trim() : ''

    if (!purchaseId) {
      return NextResponse.json({ error: 'purchaseId is required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('content_purchases')
      .delete()
      .eq('id', purchaseId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete purchase'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
