import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    projects: [
      {
        test: {
          include: [
            'test/unit/**/*.{test,spec}.ts',
            'test/**/*.unit.{test,spec}.ts',
          ],
          name: 'unit',
          environment: 'node',
        },
      },
      {
        test: {
          include: [
            'test/browser/**/*.{test,spec}.ts',
            'test/**/*.browser.{test,spec}.ts',
          ],
          name: 'browser',
          browser: {
            headless: true,
            enabled: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
      {
        test: {
          include: [
            'test/react/**/*.{test,spec}.{ts,tsx}',
          ],
          name: 'react',
          environment: 'jsdom',
          setupFiles: ['test/setup.ts'],
        },
      },
    ],
  },
})
