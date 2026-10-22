/**
 * Konfigurasi PM2 untuk production (dipakai deploy.sh).
 * Nuxt sengaja satu instance: penguncian login & captcha disimpan di memori proses.
 */
module.exports = {
  apps: [
    {
      name: 'isumedia-pocketbase',
      script: './scripts/bin/pocketbase',
      args: 'serve --http=127.0.0.1:8290 --dir=./scripts/bin/pb_data --migrationsDir=./pb_migrations',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10
    },
    {
      name: 'isumedia-web',
      script: '.output/server/index.mjs',
      // Nitro production tidak membaca .env sendiri; Node >= 20.6 memuatnya lewat --env-file
      node_args: '--env-file=.env',
      env: { NODE_ENV: 'production' },
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M'
    }
  ]
}
