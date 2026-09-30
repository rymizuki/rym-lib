/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    include: ['integration/**/*.spec.ts'],
    reporters: ['verbose'],
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
