import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        'kloen': resolve(__dirname, 'src/kloen.ts'),
        'kloen/extras': resolve(__dirname, 'src/extras.ts')
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [],
      output: {
        preserveModules: true,
        entryFileNames: '[name].js'
      }
    }
  }
})
