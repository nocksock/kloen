import { defineConfig } from 'vitest/config'

export default defineConfig({
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
            // headless: false,
            enabled: true,
            instances: [
              {
                browser: 'chromium',
                launch: {},
                connect: {},
                context: {},
              },
            ],
          },
        },
      },
    ],
  },
})
