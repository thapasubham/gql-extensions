import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  plugins: [svelte()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        devtools: src('devtools.html'),
        panel: src('panel.html'),
      },
    },
  },
});
