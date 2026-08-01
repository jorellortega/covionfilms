import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUploadUser } from '@/lib/auth-server'
import { createDirectUpload } from '@/lib/cloudflare-stream'

function getMaxDurationSeconds(role: string, subscription: string) {
  if (role === 'admin') {
    return 43_200
  }

  switch (subscription) {
    case 'premium':
    case 'family':
      return 21_600
    case 'standard':
      return 10_800
    default:
      return 3_600
  }
}

function getAllowedOrigins(request: NextRequest) {
  const origins = new Set<string>(['localhost:3000'])

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      origins.add(new URL(origin).host)
    } catch {
      // ignore invalid origin
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).host)
    } catch {
      // ignore invalid app url
    }
  }

  return Array.from(origins)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUploadUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const title = typeof body.title === 'string' ? body.title.trim() : ''

    const result = await createDirectUpload({
      maxDurationSeconds: getMaxDurationSeconds(user.role, user.subscription),
      allowedOrigins: getAllowedOrigins(request),
      meta: {
        name: title || 'Untitled upload',
        user_id: user.id,
      },
    })

    return NextResponse.json({
      uploadURL: result.uploadURL,
      uid: result.uid,
    })
  } catch (error) {
    console.error('Cloudflare direct upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create upload URL' },
      { status: 500 }
    )
  }
}
