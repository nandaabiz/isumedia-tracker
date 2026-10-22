<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Lock, 
  User, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight, 
  Activity, 
  AlertCircle,
  KeyRound
} from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import Button from '~/components/ui/Button.vue'

definePageMeta({
  layout: false
})

const { login, fetchCaptcha } = useAuth()
const router = useRouter()

const identifier = ref('')
const password = ref('')
const captchaInput = ref('')
const captchaSvg = ref('')
const captchaId = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const lockedUntil = ref(0)
const now = ref(Date.now())
const lockRemainingMs = computed(() => Math.max(0, lockedUntil.value - now.value))
const isLocked = computed(() => lockRemainingMs.value > 0)
let clockTimer: ReturnType<typeof setInterval> | null = null

async function refreshCaptcha() {
  captchaInput.value = ''
  try {
    const challenge = await fetchCaptcha()
    captchaSvg.value = challenge.svg
    captchaId.value = challenge.id
  } catch {
    errorMessage.value = 'Captcha gagal dimuat. Periksa koneksi ke server.'
  }
}

// Hanya mengisi identitas akun demo; kata sandi tercantum di README, tidak disimpan di bundle client
function quickFill(role: 'admin' | 'analyst') {
  identifier.value = role === 'admin' ? 'admin@isumedia.id' : 'analyst@isumedia.id'
  password.value = ''
}

async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const res = await login(identifier.value, password.value, captchaId.value, captchaInput.value)
    if (res.success) {
      router.push('/')
      return
    }
    errorMessage.value = res.error || 'Login gagal'
    if (res.retryAfterSec) lockedUntil.value = Date.now() + res.retryAfterSec * 1000
    await refreshCaptcha()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
  clockTimer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-parchment-100 dark:bg-monastic-900 transition-colors">
    <div class="w-full max-w-md">
      <!-- Sacred Cathedral Seal & Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-claret-700 text-white shadow-sacramental ring-2 ring-brass-400/60 mb-3">
          <Activity class="w-7 h-7 text-brass-300" />
        </div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-parchment-900 dark:text-parchment-50 tracking-tight">
          IsuMedia <span class="text-claret-700 dark:text-brass-400">Tracker</span>
        </h1>
        <p class="text-xs text-parchment-600 dark:text-parchment-400 mt-1 max-w-xs mx-auto">
          Gerbang Intelijen Media Sosial Publik & Analitik Elektoral Indonesia 3 Periode
        </p>
      </div>

      <!-- Login Card Container -->
      <div class="bg-white dark:bg-monastic-800 rounded-2xl border border-parchment-300 dark:border-monastic-700 p-6 sm:p-8 shadow-parchment-lg space-y-6">
        <div>
          <h2 class="font-serif font-bold text-lg text-parchment-900 dark:text-parchment-100">
            Otentikasi Pengguna
          </h2>
          <p class="text-xs text-parchment-500 mt-0.5">
            Masukkan akun kredensial terdaftar dan kode verifikasi keamanan captcha
          </p>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs animate-in fade-in duration-150"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Username / Email -->
          <div>
            <label for="login-identifier" class="block text-xs font-semibold text-parchment-700 dark:text-parchment-300 mb-1.5">
              Email atau nama pengguna
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-parchment-400">
                <User class="w-4 h-4" />
              </div>
              <input
                id="login-identifier"
                v-model="identifier"
                type="text"
                autocomplete="username"
                autocapitalize="none"
                required
                placeholder="nama@isumedia.id atau username"
                class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 focus:ring-claret-700 dark:focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="login-password" class="block text-xs font-semibold text-parchment-700 dark:text-parchment-300 mb-1.5">
              Kata sandi
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-parchment-400">
                <Lock class="w-4 h-4" />
              </div>
              <input
                id="login-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                placeholder="••••••••••••"
                class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 focus:ring-claret-700 dark:focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Captcha Verification Challenge -->
          <div class="pt-2 border-t border-parchment-200 dark:border-monastic-700">
            <div class="flex items-center justify-between mb-1.5">
              <label for="login-captcha" class="text-xs font-semibold text-parchment-700 dark:text-parchment-300 flex items-center gap-1.5">
                <ShieldCheck class="w-3.5 h-3.5 text-claret-700 dark:text-brass-400" aria-hidden="true" />
                <span>Kode verifikasi</span>
              </label>
              <button
                type="button"
                @click="refreshCaptcha"
                class="h-9 px-2 -mr-2 text-xs text-claret-700 dark:text-brass-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw class="w-3 h-3" />
                <span>Ganti kode</span>
              </button>
            </div>

            <!-- SVG Visual Box + Input -->
            <div class="flex items-center gap-3">
              <div
                v-html="captchaSvg"
                class="shrink-0 min-w-[160px] min-h-[54px] rounded bg-parchment-100 dark:bg-monastic-900"
                role="img"
                aria-label="Gambar kode verifikasi. Gunakan tombol Ganti kode bila sulit dibaca."
              />

              <input
                id="login-captcha"
                v-model="captchaInput"
                type="text"
                required
                maxlength="6"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                placeholder="Kode"
                class="w-full px-3 py-2 text-sm font-mono uppercase tracking-widest text-center rounded-lg border border-parchment-300 dark:border-monastic-700 bg-white dark:bg-monastic-900 text-parchment-900 dark:text-parchment-100 focus:outline-none focus:ring-2 focus:ring-claret-700 dark:focus:ring-brass-400"
              />
            </div>
            <p class="text-[10px] text-parchment-500 mt-1">
              Captcha lokal tanpa layanan pelacak pihak ketiga. Login dikunci 5 menit setelah 5 kali gagal.
            </p>
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            variant="primary"
            class="w-full py-2.5 mt-2"
            :disabled="isLoading || isLocked"
          >
            <span v-if="isLocked">Terkunci • {{ Math.ceil(lockRemainingMs / 1000) }} detik</span>
            <span v-else-if="isLoading">Memverifikasi Kredensial...</span>
            <span v-else class="flex items-center gap-2">
              <span>Masuk ke Ruang Analitik</span>
              <ArrowRight class="w-4 h-4" />
            </span>
          </Button>
        </form>

        <!-- Quick Fill Demo Accounts -->
        <div class="pt-4 border-t border-parchment-200 dark:border-monastic-700 space-y-2 text-center">
          <span class="block text-[11px] font-semibold text-parchment-500 uppercase tracking-wider">
            Isi akun demo
          </span>
          <div class="flex items-center justify-center gap-2">
            <button
              type="button"
              @click="quickFill('admin')"
              class="h-10 px-3.5 text-xs rounded-md border border-parchment-300 dark:border-monastic-700 bg-parchment-50 dark:bg-monastic-900 text-parchment-700 dark:text-parchment-300 hover:bg-parchment-200 transition-colors"
            >
              Role Admin
            </button>
            <button
              type="button"
              @click="quickFill('analyst')"
              class="h-10 px-3.5 text-xs rounded-md border border-parchment-300 dark:border-monastic-700 bg-parchment-50 dark:bg-monastic-900 text-parchment-700 dark:text-parchment-300 hover:bg-parchment-200 transition-colors"
            >
              Role Analyst
            </button>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-parchment-500 mt-6">
        IsuMedia Tracker &copy; 2026 &bull; Kepatuhan UU PDP No. 27/2022
      </p>
    </div>
  </div>
</template>
