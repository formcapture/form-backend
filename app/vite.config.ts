/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
      exclude: ['src/main.tsx'],
      reporter: ['lcov', 'json', 'text']
    },
  },
});
