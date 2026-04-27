import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const IMPORT_RE = /^\s*import\s+\{([^}]+)\}\s+from/;

export const unusedImportRule: RuleDefinition = {
  id: 'hygiene/unused-import',
  version: '1.0.0',
  category: 'hygiene',
  severity: 'warning',
  description: 'Detects imported identifiers not referenced in the file',
  principle: 'Unused imports add noise and slow build tools',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    const importEnd = lines.findIndex((l, i) => i > 0 && !l.trim().startsWith('import') && l.trim().length > 0 && !l.trim().startsWith('//'));
    const bodySource = lines.slice(importEnd).join('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = IMPORT_RE.exec(lines[i]!);
      if (!match) continue;

      const identifiers = match[1]!.split(',').map(s => s.trim().split(/\s+as\s+/).pop()!.trim()).filter(Boolean);

      for (const id of identifiers) {
        const usageRe = new RegExp(`\\b${id}\\b`);
        if (usageRe.test(bodySource)) continue;

        findings.push(createFinding({
          rule_id: 'hygiene/unused-import',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: `Import "${id}" is not used in this file.`,
          source_principle: 'Remove unused imports to reduce noise',
          category: 'hygiene',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'unused import', file: file.path },
            result: { line: i + 1, identifier: id },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
