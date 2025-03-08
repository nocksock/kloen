import { defineConfig } from 'vite'
import { resolve } from 'path'
import pkg from "./package.json"

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: {
        'kloen': resolve(__dirname, 'src/index.ts'),
        'kloen/extras': resolve(__dirname, 'src/extras.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: Object.keys(pkg.peerDependencies || {}),
      output: {
        preserveModules: false,
        entryFileNames: '[name].js'
      }
    }
  }
})
