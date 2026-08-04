import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getStreamingAnalytics } from '@/lib/streaming-analytics'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const analytics = await getStreamingAnalytics()
    if (!analytics) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    return NextResponse.json(analytics)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load analytics'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
