import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'middleware/inflate': './src/middleware/inflate.ts',
    'middleware/deflate': './src/middleware/deflate.ts',
  },
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'build',
  format: ['cjs', 'esm'],
})
