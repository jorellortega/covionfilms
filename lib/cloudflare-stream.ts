const CF_API_BASE = 'https://api.cloudflare.com/client/v4'

export type CloudflareStreamVideo = {
  uid: string
  readyToStream: boolean
  status: {
    state: 'pendingupload' | 'downloading' | 'queued' | 'inprogress' | 'ready' | 'error'
    pctComplete?: string
    errorReasonCode?: string
    errorReasonText?: string
  }
  playback?: {
    hls?: string
    dash?: string
  }
  thumbnail?: string
  duration?: number
  input?: {
    width?: number
    height?: number
  }
  meta?: Record<string, string>
}

type CloudflareApiResponse<T> = {
  success: boolean
  errors: Array<{ message: string }>
  result: T
}

function getCloudflareConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN

  if (!accountId || !apiToken) {
    throw new Error(
      'Cloudflare Stream is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN.'
    )
  }

  return { accountId, apiToken }
}

async function cloudflareRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { accountId, apiToken } = getCloudflareConfig()

  const response = await fetch(`${CF_API_BASE}/accounts/${accountId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = (await response.json()) as CloudflareApiResponse<T>

  if (!response.ok || !data.success) {
    const message = data.errors?.[0]?.message || `Cloudflare API error (${response.status})`
    throw new Error(message)
  }

  return data.result
}

export async function createDirectUpload(options: {
  maxDurationSeconds?: number
  meta?: Record<string, string>
  allowedOrigins?: string[]
}) {
  return cloudflareRequest<{ uploadURL: string; uid: string }>('/stream/direct_upload', {
    method: 'POST',
    body: JSON.stringify({
      maxDurationSeconds: options.maxDurationSeconds ?? 21_600,
      requireSignedURLs: false,
      allowedOrigins: options.allowedOrigins,
      meta: options.meta ?? {},
    }),
  })
}

export async function copyVideoFromUrl(url: string, meta?: Record<string, string>) {
  return cloudflareRequest<CloudflareStreamVideo>('/stream/copy', {
    method: 'POST',
    body: JSON.stringify({
      url,
      meta: meta ?? {},
    }),
  })
}

export async function getStreamVideo(uid: string) {
  return cloudflareRequest<CloudflareStreamVideo>(`/stream/${uid}`)
}

export function getStreamPlaybackUrls(video: CloudflareStreamVideo) {
  return {
    hls: video.playback?.hls ?? null,
    dash: video.playback?.dash ?? null,
    thumbnail: video.thumbnail ?? null,
  }
}

export function isStreamReady(video: CloudflareStreamVideo) {
  return video.readyToStream && video.status.state === 'ready'
}

export function isStreamFailed(video: CloudflareStreamVideo) {
  return video.status.state === 'error'
}
