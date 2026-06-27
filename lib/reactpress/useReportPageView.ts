'use client'

import { resolveClientApiBaseUrl } from '@/lib/reactpress/env'
import { useEffect, useRef } from 'react'

interface UseReportPageViewOptions {
  url?: string
  skipLocalhost?: boolean
  enabled?: boolean
}

/** Report page view via resolved public API base (runtime-injected in production). */
export function useReportPageView(options: UseReportPageViewOptions = {}) {
  const { url, skipLocalhost = true, enabled = true } = options
  const lastUrl = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined

    const target = url ?? window.location.href
    if (skipLocalhost && /localhost|127\.0\.0\.1/.test(target)) return undefined
    if (lastUrl.current === target) return undefined
    lastUrl.current = target

    const apiBase = resolveClientApiBaseUrl()
    fetch(`${apiBase}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: target }),
    }).catch((error) => {
      console.error('[reactpress] report page view failed', error)
    })

    return undefined
  }, [enabled, skipLocalhost, url])
}
