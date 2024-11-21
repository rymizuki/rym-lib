import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'connector/prisma': './src/connectors/prisma.ts',
  },
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'build',
  format: ['cjs', 'esm'],
})
