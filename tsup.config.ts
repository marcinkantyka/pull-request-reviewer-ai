import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['simple-git'],
  // Note: Shebang removed for ESM compatibility
  // When using as executable, it will be added via package.json bin
});
