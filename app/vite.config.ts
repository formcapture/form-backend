/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    outDir: '../backend/public/app',
    emptyOutDir: true,
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    deps: {
    },
    reporters: [
      ['vitest-sonar-reporter', { outputFile: 'coverage/sonar-report.xml' }],
      'default'
    ],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.spec.{ts,tsx}', 'src/**/*.d.ts', 'src/i18n/i18nTest.ts'],
      reporter: ['lcov', 'json', 'text'],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 60
      }
    },
  },
});
