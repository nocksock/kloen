import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: {
        kloen: resolve(__dirname, 'src/index.ts'),
        'kloen/extras': resolve(__dirname, 'src/extras.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: {
        preserveModules: false,
        entryFileNames: '[name].js',
      },
    },
  },
  test: {
    exclude: [...configDefaults.exclude, './test/browser/*'],
  },
})
