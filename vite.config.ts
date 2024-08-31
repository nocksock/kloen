import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    minifySyntax: true,
    minifyWhitespace: true
  },
  build: {
    lib: {
      entry: './lib/kloen.max.ts',
      name: 'kloen',
      fileName: 'kloen',
    },
  },
})
