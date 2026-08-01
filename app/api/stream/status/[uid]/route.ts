import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUploadUser } from '@/lib/auth-server'
import { getStreamVideo, getStreamPlaybackUrls, isStreamFailed, isStreamReady } from '@/lib/cloudflare-stream'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const user = await getAuthenticatedUploadUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uid } = await params
    if (!uid) {
      return NextResponse.json({ error: 'Stream UID is required' }, { status: 400 })
    }

    const video = await getStreamVideo(uid)
    const playback = getStreamPlaybackUrls(video)

    return NextResponse.json({
      uid: video.uid,
      ready: isStreamReady(video),
      failed: isStreamFailed(video),
      status: video.status,
      playback,
      thumbnail: playback.thumbnail,
      duration: video.duration ?? null,
      resolution:
        video.input?.width && video.input?.height
          ? `${video.input.width}x${video.input.height}`
          : null,
      error: isStreamFailed(video)
        ? video.status.errorReasonText || video.status.errorReasonCode || 'Processing failed'
        : null,
    })
  } catch (error) {
    console.error('Cloudflare status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stream status' },
      { status: 500 }
    )
  }
}
