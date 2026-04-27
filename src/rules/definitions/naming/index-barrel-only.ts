import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';
import path from 'node:path';

const RE_EXPORT_LINE = /^\s*(export\s+\*\s+from\s|export\s+\{[^}]*\}\s+from\s|export\s+type\s+\{[^}]*\}\s+from\s)/;
const EMPTY_OR_COMMENT = /^\s*($|\/\/|\/\*|\*)/;

export const indexBarrelOnlyRule: RuleDefinition = {
  id: 'naming/index-barrel-only',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects index.ts files containing logic instead of only re-exports',
  principle: 'index.ts is a barrel — it re-exports, never defines',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const basename = path.basename(file.path);
    if (basename !== 'index.ts') return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (EMPTY_OR_COMMENT.test(line)) continue;
      if (RE_EXPORT_LINE.test(line)) continue;

      findings.push(createFinding({
        rule_id: 'naming/index-barrel-only',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `index.ts should only contain re-exports. Found non-export statement.`,
        source_principle: 'Barrel files only re-export, never define',
        category: 'naming',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 're-export only', file: file.path },
          result: { line: i + 1, text: line.trim() },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
