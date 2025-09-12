import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
})


