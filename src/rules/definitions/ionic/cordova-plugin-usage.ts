import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const cordovaPluginUsageRule: RuleDefinition = {
  id: 'ionic/cordova-plugin-usage',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects Cordova/ionic-native plugin imports instead of Capacitor',
  principle: 'Capacitor plugins are the modern replacement for Cordova ionic-native',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/@ionic-native\//.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'ionic/cordova-plugin-usage',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Cordova @ionic-native plugin detected. Migrate to @capacitor/* equivalent.',
          source_principle: 'Capacitor plugins are actively maintained and better integrated',
          category: 'ionic',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.cordovaPlugin',
            query: { file: file.path },
            result: { line: i + 1, match: lines[i]!.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
