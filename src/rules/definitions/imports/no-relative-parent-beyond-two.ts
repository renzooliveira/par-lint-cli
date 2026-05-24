import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const IMPORT_RE = /^\s*import\s+.*from\s+['"](\.\.\/(?:\.\.\/){2,}[^'"]+)['"]/;

const tsconfigCache = new Map<string, boolean>();
function hasPathAliases(cwd: string): boolean {
  if (tsconfigCache.has(cwd)) return tsconfigCache.get(cwd)!;
  const tsconfig = path.join(cwd, 'tsconfig.json');
  let result = false;
  if (existsSync(tsconfig)) {
    try {
      const raw = readFileSync(tsconfig, 'utf-8').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const parsed = JSON.parse(raw);
      const paths = parsed?.compilerOptions?.paths;
      result = paths != null && Object.keys(paths).length > 0;
    } catch { /* ignore parse errors */ }
  }
  tsconfigCache.set(cwd, result);
  return result;
}

export const noRelativeParentBeyondTwoRule: RuleDefinition = {
  id: 'imports/no-relative-parent-beyond-two',
  version: '1.1.0',
  category: 'imports',
  severity: 'warning',
  description: 'Detects relative imports with more than 2 parent traversals (../)',
  principle: 'Deep relative imports are fragile and hard to read; use path aliases',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (!hasPathAliases(cwd)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = IMPORT_RE.exec(line);
      if (!match) continue;

      const importPath = match[1]!;
      const parentCount = (importPath.match(/\.\.\//g) || []).length;

      findings.push(createFinding({
        rule_id: 'imports/no-relative-parent-beyond-two',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `Import with ${parentCount} parent traversals: "${importPath}". Use path alias instead.`,
        source_principle: 'Deep relative imports are fragile',
        category: 'imports',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'deep relative import', file: file.path },
          result: { line: i + 1, importPath, parentCount },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
