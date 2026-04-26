import { globby } from 'globby';
import path from 'node:path';
import { execSync } from 'node:child_process';

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

export function getChangedFiles(cwd: string, baseRef = 'HEAD~1'): string[] {
  try {
    const raw = execSync(`git diff --name-only ${baseRef}`, { cwd });
    const output = typeof raw === 'string' ? raw : raw.toString('utf-8');
    const allFiles = output.split('\n').filter((f) => f.length > 0);

    const includeExts = new Set(['ts', 'html', 'scss', 'css']);
    const excludePatterns = DEFAULT_EXCLUDE.map((p) => globToRegex(p));

    return allFiles
      .filter((f) => includeExts.has(path.extname(f).slice(1)))
      .filter((f) => !excludePatterns.some((re) => re.test(f)));
  } catch {
    return [];
  }
}

function globToRegex(glob: string): RegExp {
  let pattern = glob
    .replace(/\*\*\//g, '§DSTAR_SLASH§')
    .replace(/\*\*/g, '§DSTAR§')
    .replace(/\*/g, '§STAR§')
    .replace(/\?/g, '§QMARK§')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/§DSTAR_SLASH§/g, '(?:.*/)?')
    .replace(/§DSTAR§/g, '.*')
    .replace(/§STAR§/g, '[^/]*')
    .replace(/§QMARK§/g, '[^/]');
  return new RegExp(`^${pattern}$`);
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).slice(1);
}
