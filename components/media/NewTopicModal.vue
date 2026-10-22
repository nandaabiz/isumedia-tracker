<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, X, Tag, Sparkles } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'
import type { MonitoredTopic } from '~/types/issue'
import type { NewTopicInput } from '~/composables/useIssueTracker'
import { parseBooleanQuery } from '~/lib/issue-analysis'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', topic: NewTopicInput): void
}>()

const title = ref('')
const category = ref<MonitoredTopic['category']>('Ekonomi')
const rawKeywords = ref('')
const query = ref('')
const rawEntities = ref('')

const queryError = computed(() => {
  if (!query.value.trim()) return null
  try {
    parseBooleanQuery(query.value)
    return null
  } catch (err: any) {
    return err.message as string
  }
})

function splitList(raw: string): string[] {
  return raw.split(',').map(k => k.trim()).filter(k => k.length > 0)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

const titleInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  titleInput.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function handleSubmit() {
  if (!title.value.trim() || queryError.value) return

  const keywords = splitList(rawKeywords.value)
  if (keywords.length === 0) {
    keywords.push(title.value.trim())
  }

  emit('created', {
    title: title.value.trim(),
    category: category.value,
    keywords,
    query: query.value.trim() || undefined,
    entityFilter: splitList(rawEntities.value)
  })

  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div 
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-topic-title"
        class="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-xl border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-800 shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-5 border-b border-parchment-200 dark:border-monastic-700 bg-parchment-50/50 dark:bg-monastic-900/50">
        <div class="flex items-center gap-2" title="Formulir inisiasi topik pemantauan baru yang akan disimpan permanen ke database PocketBase (koleksi monitored_topics).">
          <div class="p-1.5 rounded-md bg-claret-100 dark:bg-claret-950 text-claret-700 dark:text-brass-300">
            <Sparkles class="w-4 h-4" />
          </div>
          <h3 id="new-topic-title" class="font-serif font-bold text-base text-parchment-900 dark:text-parchment-100">
            Tambah Topik / Isu Kustom Baru
          </h3>
        </div>
        <button
          @click="emit('close')"
          class="w-10 h-10 flex items-center justify-center rounded-md text-parchment-500 hover:bg-parchment-200 dark:hover:bg-monastic-700"
          aria-label="Tutup dialog (Esc)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <form @submit.prevent="handleSubmit" class="p-5 space-y-4 overflow-y-auto">
        <div>
          <label for="topic-title" 
            class="block text-xs font-semibold text-parchment-700 dark:text-parchment-300 mb-1"
            title="Nama atau narasi utama isu yang ingin Anda lacak dinamikanya di media massa dan percakapan publik."
          >
            Judul Isu / Topik Pantauan
          </label>
          <input
            ref="titleInput"
            id="topic-title"
            v-model="title"
            type="text"
            required
            placeholder="Contoh: Polemik Subsidi Kendaraan Listrik & Efektivitas APBN"
            class="w-full px-3.5 py-2 text-sm rounded-md border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 focus:ring-claret-700 dark:focus:ring-brass-400"
            title="Ketik judul isu kebijakan publik atau peristiwa nasional yang ingin dipantau. Wajib diisi."
          />
        </div>

        <div>
          <label for="topic-category" 
            class="block text-xs font-semibold text-parchment-700 dark:text-parchment-300 mb-1"
            title="Klasifikasi sektor isu publik untuk memfilter dashboard analitik dan agregasi sentimen kementerian terkait."
          >
            Kategori Isu
          </label>
          <select
            id="topic-category"
            v-model="category"
            class="w-full px-3 py-2 text-sm rounded-md border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 focus:ring-claret-700"
            title="Pilih bidang kebijakan strategis yang menaungi isu ini."
          >
            <option value="Ekonomi" title="Isu seputar perpajakan, moneter, APBN, inflasi, perdagangan">Ekonomi & Keuangan</option>
            <option value="Politik" title="Isu seputar pemilu, pilkada, regulasi partai, parlemen, kabinet">Politik & Pemerintahan</option>
            <option value="Sosial & Hukum" title="Isu seputar peradilan, MK, MA, KPK, kepolisian, HAM">Sosial, Hukum & HAM</option>
            <option value="Kesejahteraan" title="Isu jaminan sosial, pendidikan, kesehatan, MBG, ketenagakerjaan">Kesejahteraan & Pendidikan</option>
            <option value="Lingkungan" title="Isu transisi energi, polusi, kehutanan, pertambangan">Lingkungan & Energi</option>
          </select>
        </div>

        <div>
          <label for="topic-keywords" 
            class="block text-xs font-semibold text-parchment-700 dark:text-parchment-300 mb-1"
            title="Daftar frasa kunci spesifik, nama tokoh, istilah teknis, atau tagar yang akan dijadikan parameter pencarian crawler."
          >
            Kata Kunci & Tagar Pemantauan (Pisahkan dengan koma)
          </label>
          <textarea
            id="topic-keywords"
            v-model="rawKeywords"
            rows="3"
            placeholder="Contoh: subsidi ev, motor listrik, #SubsidiTepat, anggaran kementrian"
            class="w-full px-3.5 py-2 text-sm rounded-md border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 focus:ring-claret-700 dark:focus:ring-brass-400 font-mono text-xs"
            title="Pisahkan setiap kata kunci atau frasa dengan tanda koma (,). Crawler akan mencocokkan kata kunci ini dengan teks berita masuk."
          />
          <p class="text-[11px] text-parchment-500 mt-1" title="Penjelasan cara kerja filter teks scraper latar belakang.">
            Sistem akan mencari kemunculan kata kunci ini pada portal berita dan kanal media publik aktif.
          </p>
        </div>

        <div>
          <label for="topic-query" class="block text-xs font-semibold text-parchment-700 dark:text-parchment-300 mb-1">
            Kueri Boolean Lanjutan (opsional)
          </label>
          <input
            id="topic-query"
            v-model="query"
            type="text"
            placeholder='Contoh: "subsidi ev" AND (motor OR mobil) NOT hoaks'
            :aria-invalid="!!queryError"
            aria-describedby="topic-query-help"
            class="w-full px-3.5 py-2 rounded-md border bg-white dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 font-mono text-xs"
            :class="queryError ? 'border-rose-500 focus:ring-rose-500' : 'border-parchment-300 dark:border-monastic-700 focus:ring-claret-700 dark:focus:ring-brass-400'"
          />
          <p v-if="queryError" id="topic-query-help" class="text-[11px] text-rose-600 mt-1">{{ queryError }}</p>
          <p v-else id="topic-query-help" class="text-[11px] text-parchment-500 mt-1">
            Mendukung AND, OR, NOT (atau -kata), "frasa", dan tanda kurung. Jika diisi, kueri ini menggantikan kata kunci saat perayapan.
          </p>
        </div>

        <div>
          <label for="topic-entities" class="block text-xs font-semibold text-parchment-700 dark:text-parchment-300 mb-1">
            Filter Entitas Tokoh/Organisasi (opsional, pisahkan dengan koma)
          </label>
          <input
            id="topic-entities"
            v-model="rawEntities"
            type="text"
            placeholder="Contoh: Kemenkeu, Sri Mulyani"
            class="w-full px-3.5 py-2 text-sm rounded-md border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 focus:ring-claret-700 dark:focus:ring-brass-400"
          />
          <p class="text-[11px] text-parchment-500 mt-1">Hanya publikasi yang menyebut seluruh entitas ini yang dianalisis.</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-parchment-200 dark:border-monastic-700">
          <Button 
            variant="secondary" 
            size="sm" 
            type="button" 
            @click="emit('close')"
            title="Batalkan pembuatan isu baru dan tutup modal"
          >
            Batal
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            type="submit"
            :disabled="!!queryError"
            title="Simpan topik ini ke database PocketBase dan langsung aktifkan pelacakan di dashboard"
          >
            Inisiasi Pemantauan
          </Button>
        </div>
      </form>
    </div>
  </div>
  </Teleport>
</template>
