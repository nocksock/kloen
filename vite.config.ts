import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    minifySyntax: true,
    minifyWhitespace: true,
  },
  build: {
    lib: {
      entry: ['./lib/kloen.ts', './lib/extras.ts'],
    },
  },
})
