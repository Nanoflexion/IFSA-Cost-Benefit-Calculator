import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/calculator-element.ts',
      name: 'NanoflexionCalculator',
      formats: ['iife'],
      fileName: () => 'nanoflexion-calculator.js',
    },
  },
  test: { environment: 'node' },
});
