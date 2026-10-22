/**
 * Serialisasi CSV (RFC 4180) dengan perlindungan formula injection: sel yang diawali
 * `=`, `+`, `-`, `@`, tab, atau CR diberi awalan apostrof agar tidak dieksekusi spreadsheet.
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const cell = (value: string | number | null | undefined) => {
    let text = value === null || value === undefined ? '' : String(value)
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [headers, ...rows].map(r => r.map(cell).join(',')).join('\r\n')
}
