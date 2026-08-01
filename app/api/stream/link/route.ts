import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUploadUser } from '@/lib/auth-server'
import {
  getStreamVideo,
  getStreamPlaybackUrls,
  isStreamFailed,
  isStreamReady,
} from '@/lib/cloudflare-stream'
import { getCloudflareStreamIframeUrl, parseCloudflareStreamId } from '@/lib/stream-url'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUploadUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const rawInput = typeof body.streamVideoId === 'string' ? body.streamVideoId.trim() : ''

    const uid = parseCloudflareStreamId(rawInput)
    if (!uid) {
      return NextResponse.json(
        { error: 'Invalid Cloudflare Stream Video ID. Paste the Video ID from your Cloudflare dashboard.' },
        { status: 400 }
      )
    }

    const video = await getStreamVideo(uid)
    const playback = getStreamPlaybackUrls(video)

    if (isStreamFailed(video)) {
      return NextResponse.json(
        {
          error:
            video.status.errorReasonText ||
            video.status.errorReasonCode ||
            'This video failed processing in Cloudflare Stream',
        },
        { status: 400 }
      )
    }

    const hlsUrl = playback.hls || `https://videodelivery.net/${uid}/manifest/video.m3u8`

    return NextResponse.json({
      uid: video.uid,
      ready: isStreamReady(video),
      status: video.status.state,
      manifestUrl: hlsUrl,
      iframeUrl: getCloudflareStreamIframeUrl(uid),
      thumbnail: playback.thumbnail,
      duration: video.duration ?? null,
      resolution:
        video.input?.width && video.input?.height
          ? `${video.input.width}x${video.input.height}`
          : null,
      cloudflareName: video.meta?.name ?? null,
    })
  } catch (error) {
    console.error('Cloudflare link error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to link Cloudflare Stream video' },
      { status: 500 }
    )
  }
}
