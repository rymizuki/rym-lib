/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {},
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    reporters: ['verbose'],
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/test-utils/**/*'],
      reporter: ['text', 'clover'],
    },
    env: {},
    setupFiles: [],
  },
})
