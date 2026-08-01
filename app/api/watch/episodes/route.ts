import { NextRequest, NextResponse } from 'next/server'
import { getSeriesAccess } from '@/lib/content-access'
import { getAuthenticatedUser } from '@/lib/get-authenticated-user'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const seriesId = request.nextUrl.searchParams.get('seriesId')

    if (!seriesId) {
      return NextResponse.json({ error: 'seriesId is required' }, { status: 400 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const user = await getAuthenticatedUser(request)
    const seriesAccess = await getSeriesAccess(
      seriesId,
      user?.id,
      user?.role,
      user?.subscription || 'free'
    )

    if (!seriesAccess) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...seriesAccess,
      isLoggedIn: Boolean(user),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load episodes' }, { status: 500 })
  }
}
