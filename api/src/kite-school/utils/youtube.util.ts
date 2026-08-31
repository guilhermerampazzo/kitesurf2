/**
 * Extract youtubeId from various URL formats:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtube.com/watch?v=ID&...
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID
 * - plain ID (11 chars)
 */
export function extractYoutubeId(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()

  // plain id (11 chars, alphanumeric + - _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)

    // youtu.be/ID
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.slice(1).split('/')[0].split('?')[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
      if (id) return id // fallback even if not 11
    }

    // youtube.com
    if (url.hostname.includes('youtube.com')) {
      // /watch?v=ID
      const v = url.searchParams.get('v')
      if (v) return v

      // /embed/ID  or /shorts/ID  or /v/ID
      const parts = url.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1].split('?')[0]

      const shortsIdx = parts.indexOf('shorts')
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1].split('?')[0]

      const vIdx = parts.indexOf('v')
      if (vIdx !== -1 && parts[vIdx + 1]) return parts[vIdx + 1].split('?')[0]
    }
  } catch {
    // not a URL, try regex fallback
  }

  // regex fallback
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = trimmed.match(regex)
  if (match?.[1]) return match[1]

  // last resort: try to find v= param manually
  const vParam = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)
  if (vParam?.[1]) return vParam[1]

  return null
}

export function isValidVideoType(t: string): boolean {
  return t === 'upload' || t === 'youtube'
}
