import { ref, onMounted } from 'vue'
import {
  buildElectoralReport,
  buildMediaReport,
  formatDateTimeWib,
  slugify,
  type ElectoralReportInput,
  type MediaReportInput
} from '~/lib/report-pdf'

export type DeliveryMode = 'download' | 'share'

async function loadPdfLibs() {
  // Dimuat saat dibutuhkan agar tidak membebani bundle awal dashboard
  const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const mod: any = autoTableModule
  // Bentuk default export berbeda antara bundel ESM dan interop CJS
  const autoTable = typeof mod.default === 'function' ? mod.default : mod.default?.default ?? mod.autoTable
  return { jsPDF, autoTable }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function useReportExport() {
  const isExporting = ref(false)
  const exportMessage = ref<{ kind: 'success' | 'error'; text: string } | null>(null)
  // Web Share API Level 2 (berbagi file): Android Chrome, iOS/macOS Safari, Chrome desktop terbaru
  const canShareFiles = ref(false)

  onMounted(() => {
    try {
      const probe = new File(['%PDF'], 'probe.pdf', { type: 'application/pdf' })
      canShareFiles.value = typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] })
    } catch {
      canShareFiles.value = false
    }
  })

  async function deliver(blob: Blob, filename: string, title: string, mode: DeliveryMode) {
    const file = new File([blob], filename, { type: 'application/pdf' })
    if (mode === 'share' && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title, text: `${title}\nDibuat dengan IsuMedia Tracker • ${formatDateTimeWib(new Date())}` })
        exportMessage.value = { kind: 'success', text: 'Laporan siap dibagikan.' }
      } catch (err: any) {
        // Pengguna menutup lembar berbagi: bukan galat
        if (err?.name !== 'AbortError') throw err
      }
      return
    }
    downloadBlob(blob, filename)
    exportMessage.value = { kind: 'success', text: `${filename} diunduh.` }
  }

  async function run(build: () => Promise<{ blob: Blob; filename: string; title: string }>, mode: DeliveryMode) {
    if (isExporting.value) return
    isExporting.value = true
    exportMessage.value = null
    try {
      const { blob, filename, title } = await build()
      await deliver(blob, filename, title, mode)
    } catch (err: any) {
      console.error('[Report Export]:', err)
      exportMessage.value = { kind: 'error', text: `Gagal membuat laporan: ${err?.message || 'kesalahan tidak diketahui'}` }
    } finally {
      isExporting.value = false
    }
  }

  function exportMediaReport(input: MediaReportInput, mode: DeliveryMode) {
    return run(async () => {
      const { jsPDF, autoTable } = await loadPdfLibs()
      const doc = buildMediaReport(jsPDF, autoTable, input)
      const date = new Date().toISOString().slice(0, 10)
      return {
        blob: doc.output('blob'),
        filename: `laporan-isu-${slugify(input.topic.title)}-${date}.pdf`,
        title: `Laporan Isu: ${input.topic.title}`
      }
    }, mode)
  }

  function exportElectoralReport(input: ElectoralReportInput, mode: DeliveryMode) {
    return run(async () => {
      const { jsPDF, autoTable } = await loadPdfLibs()
      const doc = buildElectoralReport(jsPDF, autoTable, input)
      return {
        blob: doc.output('blob'),
        filename: `laporan-pemilu-${input.year}-${slugify(input.province.name)}.pdf`,
        title: `Laporan Pemilu ${input.year}: ${input.province.name}`
      }
    }, mode)
  }

  return { isExporting, exportMessage, canShareFiles, exportMediaReport, exportElectoralReport }
}
