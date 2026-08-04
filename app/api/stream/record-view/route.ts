import { NextRequest, NextResponse } from 'next/server'
import { recordPlayEvent } from '@/lib/streaming-analytics'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const videoId = typeof body.videoId === 'string' ? body.videoId.trim() : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined
    const event = body.event as 'start' | 'progress' | 'complete'
    const watchSeconds = typeof body.watchSeconds === 'number' ? body.watchSeconds : 0

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    if (!['start', 'progress', 'complete'].includes(event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const user = await getAuthenticatedUser(request)

    const result = await recordPlayEvent({
      videoId,
      userId: user?.id,
      sessionId,
      event,
      watchSeconds,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to record play' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record play'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
