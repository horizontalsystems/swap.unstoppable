import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  test: {
    // Unit tests only: the pure routing/adapter logic, no network and no DOM. Everything that
    // talks to a venue is verified against mainnet instead — see STELLAR_MAINNET_VALIDATION.md.
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
