import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'node20',
  outDir: 'dist',
  noExternal: [],
  external: ['@ast-grep/napi'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
