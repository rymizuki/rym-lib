import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'build',
  format: ['cjs', 'esm'],
  external: ['react', 'react-dom', 'react-router', 'qs'],
})
