'use client'

import { useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useRecordPlay(videoId?: string) {
  const sessionIdRef = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}`
  )
  const hasRecordedStart = useRef(false)

  const recordPlay = useCallback(
    async (event: 'start' | 'progress' | 'complete', watchSeconds = 0) => {
      if (!videoId) return
      if (event === 'start' && hasRecordedStart.current) return

      const { data: { session } } = await supabase.auth.getSession()

      try {
        await fetch('/api/stream/record-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            videoId,
            sessionId: sessionIdRef.current,
            event,
            watchSeconds,
          }),
        })

        if (event === 'start') {
          hasRecordedStart.current = true
        }
      } catch (error) {
        console.error('Failed to record play event:', error)
      }
    },
    [videoId]
  )

  return { recordPlay }
}
