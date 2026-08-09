import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { supabaseServer } from '@/lib/supabaseServer'

const ADMIN_ROLES = new Set(['admin', 'management'])

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please log in' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const videoId = typeof body.videoId === 'string' ? body.videoId.trim() : ''
    const updates = body.updates && typeof body.updates === 'object' ? body.updates : null

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'updates are required' }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabaseServer
      .from('video_assets')
      .select('id, user_id')
      .eq('id', videoId)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const isOwner = existing.user_id === user.id
    const isAdmin = ADMIN_ROLES.has(user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not allowed to edit this video' }, { status: 403 })
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseServer
      .from('video_assets')
      .update(payload)
      .eq('id', videoId)
      .select('*')
      .maybeSingle()

    if (error) {
      const message = error.message || 'Update failed'
      if (message.includes('trailer_cloudflare_stream_uid')) {
        return NextResponse.json(
          {
            error:
              'Trailer column missing. Run migrations/018_trailer_stream_uid.sql in Supabase, then try again.',
          },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Update did not save. Check that the video exists and try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, video: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed'
    console.error('media update error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
