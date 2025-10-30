import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run tests in sequence to avoid race conditions with shared fixture directories
    fileParallelism: false
  }
})
