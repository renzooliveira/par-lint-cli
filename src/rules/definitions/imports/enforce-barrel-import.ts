import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const IMPORT_RE = /^\s*import\s+.*from\s+['"](@[a-zA-Z]+\/[^'"]+)['"]/;
const DEEP_PATH_RE = /^@[a-zA-Z]+\/[a-zA-Z-]+\/[a-zA-Z-]+\/.+\.[a-zA-Z]+$/;

export const enforceBarrelImportRule: RuleDefinition = {
  id: 'imports/enforce-barrel-import',
  version: '1.0.0',
  category: 'imports',
  severity: 'error',
  description: 'Detects imports that bypass barrel files (direct internal file access)',
  principle: 'Barrel imports are the public API of a module; bypass breaks encapsulation',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = IMPORT_RE.exec(line);
      if (!match) continue;

      const importPath = match[1]!;
      if (!DEEP_PATH_RE.test(importPath)) continue;

      findings.push(createFinding({
        rule_id: 'imports/enforce-barrel-import',
        file: file.path,
        line: i + 1,
        severity: 'error',
        message: `Direct import "${importPath}" bypasses barrel. Import from the module's index instead.`,
        source_principle: 'Barrel imports are the public API boundary',
        category: 'imports',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'barrel bypass', file: file.path },
          result: { line: i + 1, importPath },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
