import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TOPROMISE_RE = /\.toPromise\s*\(\s*\)/;

export const topromiseDeprecatedRule: RuleDefinition = {
  id: 'rxjs/topromise-deprecated',
  version: '1.0.0',
  category: 'rxjs',
  severity: 'warning',
  description: 'Detects deprecated .toPromise() usage',
  principle: '.toPromise() is deprecated in RxJS 7; use firstValueFrom/lastValueFrom',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      if (!TOPROMISE_RE.test(lines[i]!)) continue;

      findings.push(createFinding({
        rule_id: 'rxjs/topromise-deprecated',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: '.toPromise() is deprecated. Use firstValueFrom() or lastValueFrom().',
        source_principle: 'Use modern RxJS interop functions',
        category: 'rxjs',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: '.toPromise()', file: file.path },
          result: { line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
