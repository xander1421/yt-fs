import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/*.spec.ts'], // Exclude Playwright tests
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}); 