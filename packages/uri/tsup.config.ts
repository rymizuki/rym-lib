import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill'
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
  external: [],
  esbuildPlugins: [
    nodeModulesPolyfillPlugin({
      modules: ['url'],
    }),
  ],
})
