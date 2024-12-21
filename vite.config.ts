import { defineConfig } from 'vite'
import { resolve } from 'path'
import pkg from "./package.json"

export default defineConfig({
  build: {
    lib: {
      entry: {
        'kloen': resolve(__dirname, 'src/kloen.ts'),
        'kloen/extras': resolve(__dirname, 'src/extras.ts'),
        'kloen/react': resolve(__dirname, 'src/react/index.ts')
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
