import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const IMPORT_RE = /^import\s+.*from\s+['"](\.\.[^'"]+)['"]/;
const DEEP_RELATIVE_RE = /^\.\.\//;

export const enforcePathAliasRule: RuleDefinition = {
  id: 'imports/enforce-path-alias',
  version: '1.0.0',
  category: 'imports',
  severity: 'warning',
  description: 'Detects relative imports that should use path aliases from tsconfig',
  principle: 'Path aliases (@app/*, @shared/*) improve readability and refactoring safety',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const opts = config.rules['imports/enforce-path-alias'] as { min_depth?: number } | undefined;
    const minDepth = opts?.min_depth ?? 3;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(IMPORT_RE);
      if (!match) continue;

      const importPath = match[1]!;
      if (!DEEP_RELATIVE_RE.test(importPath)) continue;

      const depth = (importPath.match(/\.\.\//g) ?? []).length;
      if (depth < minDepth) continue;

      findings.push(createFinding({
        rule_id: 'imports/enforce-path-alias',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `Deep relative import (${depth} levels up): '${importPath}'. Use a path alias instead.`,
        source_principle: 'Path aliases improve readability and refactoring safety',
        category: 'imports',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex.enforcePathAlias',
          query: { file: file.path },
          result: { line: i + 1, depth, path: importPath },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
