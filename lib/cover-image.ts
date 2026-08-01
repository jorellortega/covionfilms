import { supabase } from '@/lib/supabaseClient'

export function getCoverImageUrl(coverImagePath?: string | null): string | null {
  if (!coverImagePath) return null

  if (coverImagePath.startsWith('http://') || coverImagePath.startsWith('https://')) {
    return coverImagePath
  }

  if (coverImagePath.startsWith('/')) {
    return coverImagePath
  }

  for (const bucketName of ['covionfilms', 'videos']) {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(coverImagePath)
    if (data?.publicUrl) return data.publicUrl
  }

  return null
}
