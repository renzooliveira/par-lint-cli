import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const INJECTABLE_RE = /@Injectable/;
const PUBLIC_SIGNAL_RE = /^\s*(?:public\s+)(\w+)\s*=\s*signal\s*\(/;

export const missingAsReadonlyRule: RuleDefinition = {
  id: 'signals/missing-asreadonly',
  version: '1.0.0',
  category: 'signals',
  severity: 'warning',
  description: 'Detects writable signals exposed publicly in @Injectable without .asReadonly()',
  principle: 'Public writable signals break encapsulation; expose asReadonly()',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!INJECTABLE_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = PUBLIC_SIGNAL_RE.exec(line);
      if (!match) continue;

      if (line.includes('private') || line.includes('protected') || line.startsWith('  _') || line.includes(' _')) continue;

      findings.push(createFinding({
        rule_id: 'signals/missing-asreadonly',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: `Public writable signal "${match[1]}" in @Injectable. Expose via .asReadonly() instead.`,
        source_principle: 'Writable signals should not be publicly exposed',
        category: 'signals',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'public writable signal', file: file.path },
          result: { line: i + 1, name: match[1] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
