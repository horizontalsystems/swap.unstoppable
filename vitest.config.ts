import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  test: {
    // Unit tests only: pure logic, no network and no DOM.
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
