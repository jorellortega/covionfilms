import { NextRequest, NextResponse } from 'next/server'
import { checkVideoAccess } from '@/lib/content-access'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const videoId = request.nextUrl.searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: video, error } = await supabaseServer
      .from('video_assets')
      .select('id, title, description, content_type, parent_id, status, is_free')
      .eq('id', videoId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const user = await getAuthenticatedUser(request)
    const access = await checkVideoAccess(
      video,
      user?.id,
      user?.role,
      user?.subscription || 'free'
    )

    return NextResponse.json({
      ...access,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        content_type: video.content_type,
        parent_id: video.parent_id,
      },
      isLoggedIn: Boolean(user),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check access' }, { status: 500 })
  }
}
