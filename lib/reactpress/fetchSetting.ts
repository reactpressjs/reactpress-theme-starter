/** Same-origin visitor setting fetch — avoids toolkit axios onError console noise. */
import { resolveClientApiBaseUrl } from '@/lib/reactpress/env'

export async function fetchVisitorSetting(): Promise<Record<string, unknown> | null> {
  const apiBase = resolveClientApiBaseUrl()
  const url = `${apiBase}/setting/get`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!response.ok) return null

    const payload = (await response.json()) as { success?: boolean; data?: Record<string, unknown> }
    return payload?.success ? (payload.data ?? null) : null
  } catch {
    return null
  }
}
