import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    minifySyntax: true,
    minifyWhitespace: true,
  },
  build: {
    lib: {
      entry: ['./lib/kloen.ts', './lib/kloen/extras.ts'],
    },
    rollupOptions: {
      input: {
        kloen: 'lib/kloen.ts',
        'kloen/extras': 'lib/kloen/extras.ts',
      },
    },
  },
})
