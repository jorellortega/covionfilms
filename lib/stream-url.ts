export function isCloudflareStreamUrl(url: string) {
  return url.includes('cloudflarestream.com') || url.includes('videodelivery.net')
}

/** Parse a Cloudflare Stream video ID from raw ID, HLS URL, or embed URL */
export function parseCloudflareStreamId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (/^[a-f0-9]{32}$/i.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  const patterns = [
    /cloudflarestream\.com\/([a-f0-9]{32})/i,
    /videodelivery\.net\/([a-f0-9]{32})/i,
    /watch\.cloudflarestream\.com\/([a-f0-9]{32})/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) {
      return match[1].toLowerCase()
    }
  }

  return null
}

export function getCloudflareStreamIframeUrl(uid: string) {
  return `https://iframe.videodelivery.net/${uid}`
}

export function getCloudflareStreamHlsUrl(hlsUrl: string, uid: string) {
  if (hlsUrl.includes('cloudflarestream.com') || hlsUrl.includes('videodelivery.net')) {
    return hlsUrl
  }
  return `https://videodelivery.net/${uid}/manifest/video.m3u8`
}

export function isYouTubeUrl(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

export function isDropboxUrl(url: string) {
  return url.includes('dropbox.com')
}

export function toYouTubeEmbedUrl(url: string) {
  if (url.includes('youtube.com/embed/')) {
    return url
  }

  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(youtubeRegex)

  if (match?.[1]) {
    return `https://www.youtube.com/embed/${match[1]}`
  }

  return url
}

export function toDropboxDirectUrl(url: string) {
  if (url.includes('?dl=0')) {
    return url.replace('?dl=0', '?dl=1')
  }

  if (url.includes('&dl=0')) {
    return url.replace('&dl=0', '&dl=1')
  }

  if (url.includes('dl=1')) {
    return url
  }

  return url + (url.includes('?') ? '&' : '?') + 'dl=1'
}
