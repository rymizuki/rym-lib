import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'middleware/inflate': './src/middleware/inflate.ts',
    'middleware/deflate': './src/middleware/deflate.ts',
    'test-utils': './src/test-utils/index.ts',
    'test-utils/test-mock-logger': './src/test-utils/test-mock-logger.ts',
  },
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'build',
  format: ['cjs', 'esm'],
})
