import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUploadUser } from '@/lib/auth-server'
import { supabaseServer } from '@/lib/supabaseServer'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUploadUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server storage is not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const videoId = formData.get('videoId')

    if (!(file instanceof File) || typeof videoId !== 'string' || !videoId.trim()) {
      return NextResponse.json({ error: 'Missing cover image or video ID' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Cover must be a JPEG, PNG, WebP, or GIF image' },
        { status: 400 }
      )
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const coverPath = `covers/${videoId.trim()}_cover.${extension}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseServer.storage
      .from('covionfilms')
      .upload(coverPath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Cover upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { data: urlData } = supabaseServer.storage.from('covionfilms').getPublicUrl(coverPath)

    return NextResponse.json({
      coverImagePath: urlData.publicUrl,
      path: coverPath,
    })
  } catch (error) {
    console.error('Cover upload route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload cover image' },
      { status: 500 }
    )
  }
}
