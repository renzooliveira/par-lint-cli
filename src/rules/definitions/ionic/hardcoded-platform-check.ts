import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PLATFORM_IS_RE = /\.is\(\s*['"](\w+)['"]\s*\)/g;

export const hardcodedPlatformCheckRule: RuleDefinition = {
  id: 'ionic/hardcoded-platform-check',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects hardcoded Platform.is() checks instead of abstraction',
  principle: 'Platform-specific logic should be abstracted for testability and portability',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const source = await readSource(file.path, cwd);

    if (!source.includes('platform') && !source.includes('Platform')) return [];

    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      PLATFORM_IS_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = PLATFORM_IS_RE.exec(line)) !== null) {
        findings.push(createFinding({
          rule_id: 'ionic/hardcoded-platform-check',
          file: file.path,
          line: i + 1,
          column: match.index + 1,
          severity: 'warning',
          message: `Hardcoded platform check: platform.is('${match[1]}'). Use a platform-agnostic service or abstraction.`,
          source_principle: 'Hardcoded platform checks couple code to specific platforms',
          category: 'ionic',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: '.is()', file: file.path },
            result: { line: i + 1, platform: match[1] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
