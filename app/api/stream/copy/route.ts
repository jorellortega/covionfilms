import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUploadUser } from '@/lib/auth-server'
import { copyVideoFromUrl } from '@/lib/cloudflare-stream'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUploadUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const title = typeof body.title === 'string' ? body.title.trim() : ''

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const result = await copyVideoFromUrl(url, {
      name: title || 'External video',
      user_id: user.id,
    })

    return NextResponse.json({
      uid: result.uid,
      readyToStream: result.readyToStream,
      status: result.status,
      playback: result.playback,
      thumbnail: result.thumbnail,
      duration: result.duration,
      input: result.input,
    })
  } catch (error) {
    console.error('Cloudflare copy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import video URL' },
      { status: 500 }
    )
  }
}
