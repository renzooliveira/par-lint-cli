import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const ionicmoduleInStandaloneRule: RuleDefinition = {
  id: 'ionic/ionicmodule-in-standalone',
  version: '1.0.0',
  category: 'ionic',
  severity: 'error',
  description: 'Detects IonicModule import in standalone components',
  principle: 'Standalone components should import individual Ionic components for tree-shaking',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('standalone') || !source.includes('IonicModule')) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/IonicModule/.test(lines[i]!) && /imports/.test(source)) {
        findings.push(createFinding({
          rule_id: 'ionic/ionicmodule-in-standalone',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: 'Import individual Ionic components (IonButton, IonContent, etc.) instead of IonicModule in standalone components.',
          source_principle: 'Individual imports enable tree-shaking and reduce bundle size',
          category: 'ionic',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.ionicModule',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
        break;
      }
    }

    return findings;
  },
};
