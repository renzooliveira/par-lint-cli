import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const IMPORT_RE = /^import\s+.*from\s+['"]([^'"]+)['"]/;

function extractFeatureSlice(filePath: string, featureDirs: string[]): string | null {
  for (const dir of featureDirs) {
    const idx = filePath.indexOf(`/${dir}/`);
    if (idx !== -1) {
      const after = filePath.slice(idx + dir.length + 2);
      const slice = after.split('/')[0];
      return slice ? `${dir}/${slice}` : null;
    }
  }
  return null;
}

function resolveImportSlice(importPath: string, filePath: string, featureDirs: string[]): string | null {
  if (importPath.startsWith('.')) {
    const dir = filePath.split('/').slice(0, -1).join('/');
    const parts = importPath.split('/');
    const resolved = [...dir.split('/')];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') resolved.pop();
      else resolved.push(part);
    }
    return extractFeatureSlice(resolved.join('/'), featureDirs);
  }
  return extractFeatureSlice(importPath, featureDirs);
}

export const noCrossSliceImportRule: RuleDefinition = {
  id: 'arch/no-cross-slice-import',
  version: '1.0.0',
  category: 'arch',
  severity: 'error',
  description: 'Detects imports between feature slices at the same level',
  principle: 'Feature slices must be isolated — communicate through shared modules only',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const opts = config.rules['arch/no-cross-slice-import'] as { feature_dirs?: string[] } | undefined;
    const featureDirs = opts?.feature_dirs ?? ['features', 'pages', 'modules'];

    const mySlice = extractFeatureSlice(file.path, featureDirs);
    if (!mySlice) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(IMPORT_RE);
      if (!match) continue;

      const importPath = match[1]!;
      const importSlice = resolveImportSlice(importPath, file.path, featureDirs);
      if (!importSlice) continue;
      if (importSlice === mySlice) continue;

      const myDir = mySlice.split('/')[0];
      const importDir = importSlice.split('/')[0];
      if (myDir !== importDir) continue;

      findings.push(createFinding({
        rule_id: 'arch/no-cross-slice-import',
        file: file.path,
        line: i + 1,
        severity: 'error',
        message: `Cross-slice import: '${mySlice}' imports from '${importSlice}'. Feature slices must be isolated.`,
        source_principle: 'Feature slices at the same level must not import from each other',
        category: 'arch',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.crossSlice',
          query: { file: file.path },
          result: { from: mySlice, to: importSlice, import: importPath },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
