/**
 * Parser minimal feed Atom (YouTube channel feed, Reddit search RSS) berbasis regex, tanpa dependency XML.
 * Hanya untuk feed dengan struktur tetap; nilai dikembalikan masih ter-escape kecuali dilewatkan ke `decodeHtmlEntities`.
 */

/** Entitas HTML/XML umum, termasuk referensi numerik desimal & heksadesimal. `&amp;` didekode terakhir agar tidak dobel. */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function atomEntries(xml: string): string[] {
  return xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || []
}

const escapeTag = (tag: string) => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Isi teks elemen pertama `<tag>` (nama dengan prefix namespace, mis. `yt:videoId`); `''` bila tidak ada. */
export function tagText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${escapeTag(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapeTag(tag)}>`, 'i'))
  return match?.[1]?.trim() ?? ''
}

/** Nilai atribut elemen pertama `<tag ... attr="...">`; `''` bila tidak ada. */
export function tagAttr(xml: string, tag: string, attr: string): string {
  const element = xml.match(new RegExp(`<${escapeTag(tag)}\\s[^>]*>`, 'i'))
  const match = element?.[0].match(new RegExp(`\\s${escapeTag(attr)}="([^"]*)"`, 'i'))
  return match?.[1] ?? ''
}
