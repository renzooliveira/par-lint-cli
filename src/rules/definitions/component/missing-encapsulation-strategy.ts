import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const COMPONENT_BLOCK_RE = /@Component\s*\(\s*\{([^}]*)\}\s*\)/gs;
const ENCAPSULATION_RE = /encapsulation\s*:/;

export const missingEncapsulationStrategyRule: RuleDefinition = {
  id: 'component/missing-encapsulation-strategy',
  version: '1.0.0',
  category: 'component',
  severity: 'info',
  description: 'Detects @Component without explicit encapsulation property',
  principle: 'Explicit encapsulation forces a conscious decision about style scoping',
  applicable_to: ['is_component'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.component.ts')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const findings = [];

    for (const match of source.matchAll(COMPONENT_BLOCK_RE)) {
      const body = match[1]!;
      if (!ENCAPSULATION_RE.test(body)) {
        const line = source.substring(0, match.index).split('\n').length;
        findings.push(createFinding({
          rule_id: 'component/missing-encapsulation-strategy',
          file: file.path,
          line,
          severity: 'info',
          message: '@Component missing explicit encapsulation property. Add encapsulation: ViewEncapsulation.* to make scoping intentional.',
          source_principle: 'Explicit encapsulation forces conscious style scoping decision',
          category: 'component',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'encapsulation', file: file.path },
            result: { found: false },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
