import { defineConfig } from 'vite';
import { resolve } from 'path';
import { globSync } from 'glob';

const htmlFiles = globSync('**/*.html', { ignore: ['dist/**','node_modules/**','public/**'] });
const input = Object.fromEntries(
  htmlFiles.map(f => [f.replace(/\.html$/, ''), resolve(__dirname, f)])
);

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: { input },
    sourcemap: false,
    cssMinify: true
  }
});