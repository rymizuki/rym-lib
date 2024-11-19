import esbuildPluginAlias from 'esbuild-plugin-alias'
import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    theme: './theme.ts',
  },
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'build',
  format: ['esm', 'cjs'],
  external: ['react', 'react-dom', '@remix-run/react'],
  esbuildPlugins: [
    esbuildPluginAlias({
      '~/*': path.resolve(__dirname, 'src'),
      '@styled-system/css': path.resolve(
        __dirname,
        'styled-system/css/index.mjs',
      ),
    }),
  ],
})
