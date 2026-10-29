<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AtSign, AlertCircle, Check, Copy } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

// Kode otorisasi ada di URL: jangan bocor lewat header Referer dan jangan diindeks
useHead({
  title: 'Callback Threads • IsuMedia Tracker',
  meta: [
    { name: 'referrer', content: 'no-referrer' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const route = useRoute()
const queryValue = (key: string) => (typeof route.query[key] === 'string' ? (route.query[key] as string) : '')

const code = queryValue('code')
const errorReason = queryValue('error_description') || queryValue('error_reason') || queryValue('error')

// redirect_uri saat tukar token wajib sama persis dengan yang dipakai di URL otorisasi
const redirectUri = ref('')
onMounted(() => {
  redirectUri.value = `${window.location.origin}${route.path}`
})

const exchangeCommand = computed(() =>
  [
    'curl -X POST https://graph.threads.com/oauth/access_token',
    '-F client_id=<THREADS_APP_ID>',
    '-F client_secret=<THREADS_APP_SECRET>',
    '-F grant_type=authorization_code',
    `-F redirect_uri=${redirectUri.value}`,
    `-F code=${code}`
  ].join(' \\\n  ')
)

const copied = ref<'code' | 'command' | null>(null)
const copyError = ref('')

async function copy(text: string, target: 'code' | 'command') {
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(text)
    copied.value = target
    setTimeout(() => { if (copied.value === target) copied.value = null }, 2000)
  } catch {
    copyError.value = 'Clipboard tidak dapat diakses. Salin manual dari kotak teks.'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-parchment-100 dark:bg-monastic-900 transition-colors">
    <div class="w-full max-w-xl">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-claret-700 text-white shadow-sacramental ring-2 ring-brass-400/60 mb-3">
          <AtSign class="w-7 h-7 text-brass-300" aria-hidden="true" />
        </div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-parchment-900 dark:text-parchment-50 tracking-tight">
          Callback <span class="text-claret-700 dark:text-brass-400">Threads</span>
        </h1>
        <p class="text-xs text-parchment-600 dark:text-parchment-400 mt-1 max-w-sm mx-auto">
          Kode otorisasi Threads API untuk membuat THREADS_ACCESS_TOKEN
        </p>
      </div>

      <div class="bg-white dark:bg-monastic-800 rounded-2xl border border-parchment-300 dark:border-monastic-700 p-6 sm:p-8 shadow-parchment-lg space-y-6">
        <!-- Otorisasi ditolak / gagal -->
        <div
          v-if="errorReason"
          role="alert"
          class="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Otorisasi Threads gagal: {{ errorReason }}. Ulangi dari URL otorisasi.</span>
        </div>

        <!-- Kode tersedia -->
        <template v-else-if="code">
          <div>
            <label for="threads-code" class="block text-xs font-semibold text-parchment-700 dark:text-parchment-300 mb-1.5">
              Kode otorisasi
            </label>
            <div class="flex items-stretch gap-2">
              <input
                id="threads-code"
                :value="code"
                readonly
                spellcheck="false"
                class="w-full min-w-0 px-3 py-2 text-xs font-mono rounded-lg border border-parchment-300 dark:border-monastic-700 bg-parchment-50 dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 focus:ring-claret-700 dark:focus:ring-brass-400"
                @focus="($event.target as HTMLInputElement).select()"
              />
              <button
                type="button"
                class="shrink-0 flex items-center gap-1.5 h-10 px-3 rounded-lg border border-parchment-300 dark:border-monastic-700 text-xs font-medium text-parchment-800 dark:text-parchment-200 hover:bg-parchment-100 dark:hover:bg-monastic-700"
                @click="copy(code, 'code')"
              >
                <Check v-if="copied === 'code'" class="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <Copy v-else class="w-3.5 h-3.5" aria-hidden="true" />
                <span>{{ copied === 'code' ? 'Tersalin' : 'Salin' }}</span>
              </button>
            </div>
            <p class="text-[11px] text-parchment-500 mt-1.5">
              Berlaku 1 jam dan hanya dapat ditukar sekali. Jangan bagikan kode ini.
            </p>
          </div>

          <div class="pt-4 border-t border-parchment-200 dark:border-monastic-700">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-xs font-semibold text-parchment-700 dark:text-parchment-300">
                Tukar menjadi token jangka pendek
              </span>
              <button
                type="button"
                class="flex items-center gap-1.5 h-9 px-2 -mr-2 text-xs text-claret-700 dark:text-brass-400 hover:underline"
                @click="copy(exchangeCommand, 'command')"
              >
                <Check v-if="copied === 'command'" class="w-3 h-3" aria-hidden="true" />
                <Copy v-else class="w-3 h-3" aria-hidden="true" />
                <span>{{ copied === 'command' ? 'Tersalin' : 'Salin perintah' }}</span>
              </button>
            </div>
            <pre class="p-3 rounded-lg bg-parchment-50 dark:bg-monastic-900 border border-parchment-200 dark:border-monastic-700 text-[11px] leading-relaxed font-mono text-parchment-800 dark:text-parchment-200 overflow-x-auto whitespace-pre">{{ exchangeCommand }}</pre>
            <p class="text-[11px] text-parchment-500 mt-1.5">
              Ganti <code class="font-mono">&lt;THREADS_APP_ID&gt;</code> dan <code class="font-mono">&lt;THREADS_APP_SECRET&gt;</code>, jalankan di terminal,
              lalu tukar hasilnya menjadi token jangka panjang (<code class="font-mono">th_exchange_token</code>) sesuai README.
            </p>
          </div>

          <p v-if="copyError" role="status" class="text-[11px] text-rose-700 dark:text-rose-400">{{ copyError }}</p>
        </template>

        <!-- Dibuka langsung tanpa parameter -->
        <div v-else class="text-xs text-parchment-600 dark:text-parchment-400 space-y-2">
          <p>Belum ada kode otorisasi. Halaman ini adalah Redirect Callback URL untuk app Threads:</p>
          <p class="font-mono text-[11px] p-2 rounded bg-parchment-50 dark:bg-monastic-900 border border-parchment-200 dark:border-monastic-700 break-all">
            {{ redirectUri }}
          </p>
          <p>Buka URL otorisasi Threads dengan <code class="font-mono">redirect_uri</code> di atas; setelah izin diberikan, kode tampil di sini.</p>
        </div>
      </div>

      <p class="text-center text-xs text-parchment-500 mt-6">
        <NuxtLink to="/" class="text-claret-700 dark:text-brass-400 hover:underline">Kembali ke IsuMedia Tracker</NuxtLink>
      </p>
    </div>
  </div>
</template>
