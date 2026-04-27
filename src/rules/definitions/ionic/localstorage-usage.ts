import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const localstorageUsageRule: RuleDefinition = {
  id: 'ionic/localstorage-usage',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects localStorage usage in Ionic/Capacitor projects',
  principle: 'localStorage is unreliable on mobile; use Capacitor Preferences API',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/\blocalStorage\.\w+/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'ionic/localstorage-usage',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'localStorage is unreliable on mobile. Use @capacitor/preferences instead.',
          source_principle: 'Mobile WebViews can clear localStorage unexpectedly',
          category: 'ionic',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.localStorage',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
