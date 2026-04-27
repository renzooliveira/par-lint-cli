import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const STYLE_URL_RE = /styleUrls?\s*:\s*\[?\s*['"]([^'"]+)['"]/g;
const TEMPLATE_URL_RE = /templateUrl\s*:\s*['"]([^'"]+)['"]/;

export const filesNotColocatedRule: RuleDefinition = {
  id: 'component/files-not-colocated',
  version: '1.0.0',
  category: 'component',
  severity: 'error',
  description: 'Detects component files (.ts, .html, .scss) in different directories',
  principle: 'Colocated files reduce navigation overhead and coupling confusion',
  applicable_to: ['is_component'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.component.ts')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const findings = [];

    const templateMatch = TEMPLATE_URL_RE.exec(source);
    if (templateMatch) {
      const ref = templateMatch[1]!;
      if (ref.includes('/') && !ref.startsWith('./')) {
        findings.push(createFinding({
          rule_id: 'component/files-not-colocated',
          file: file.path,
          line: source.substring(0, templateMatch.index).split('\n').length,
          severity: 'error',
          message: `templateUrl "${ref}" references a file outside component directory`,
          source_principle: 'Colocated files reduce navigation overhead',
          category: 'component',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'templateUrl', file: file.path },
            result: { ref },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    for (const match of source.matchAll(STYLE_URL_RE)) {
      const ref = match[1]!;
      if (ref.includes('/') && !ref.startsWith('./')) {
        findings.push(createFinding({
          rule_id: 'component/files-not-colocated',
          file: file.path,
          line: source.substring(0, match.index).split('\n').length,
          severity: 'error',
          message: `styleUrl "${ref}" references a file outside component directory`,
          source_principle: 'Colocated files reduce navigation overhead',
          category: 'component',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'styleUrl', file: file.path },
            result: { ref },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
