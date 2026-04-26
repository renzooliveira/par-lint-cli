import { globby } from 'globby';
import path from 'node:path';

export interface ScanOptions {
  cwd: string;
  include?: string[];
  exclude?: string[];
}

const DEFAULT_INCLUDE = [
  '**/*.ts',
  '**/*.html',
  '**/*.scss',
  '**/*.css',
];

const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.par-lint/**',
  '**/*.spec.ts',
  '**/*.test.ts',
  '**/*.d.ts',
  '**/e2e/**',
  '**/test/**',
  '**/__tests__/**',
];

export async function scanFiles(options: ScanOptions): Promise<string[]> {
  const { cwd, include = DEFAULT_INCLUDE, exclude = DEFAULT_EXCLUDE } = options;

  const files = await globby(include, {
    cwd,
    ignore: exclude,
    gitignore: true,
    absolute: false,
  });

  return files.sort((a, b) => a.localeCompare(b));
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).slice(1);
}
