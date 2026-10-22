// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: false,
  devServer: {
    port: 3020
  },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  typescript: {
    tsConfig: {
      // Unit test di tests/ dijalankan langsung oleh `node --test` yang mewajibkan ekstensi .ts pada import
      compilerOptions: { allowImportingTsExtensions: true }
    }
  },
  css: [
    'leaflet/dist/leaflet.css',
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      title: 'IsuMedia Tracker & Electoral Intelligence',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Platform Intelijen Media Sosial Publik & Analisis Pemilu Indonesia 3 Dekade' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap' }
      ]
    }
  }
})
