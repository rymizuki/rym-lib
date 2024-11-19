import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'build',
  format: ['cjs', 'esm'],
})
