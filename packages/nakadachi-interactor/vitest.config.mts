/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {},
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    reporters: ['verbose'],
    env: {},
  },
})
