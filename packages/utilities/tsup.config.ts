import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    array: './src/array.ts',
  },
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'build',
  format: ['cjs', 'esm'],
  external: [],
})
