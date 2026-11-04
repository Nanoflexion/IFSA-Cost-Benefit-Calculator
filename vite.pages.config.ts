import { defineConfig } from 'vite';

export default defineConfig({
  base: './',               // relative paths, so it works under /your-repo-name/
  build: { outDir: 'dist-pages' },
});