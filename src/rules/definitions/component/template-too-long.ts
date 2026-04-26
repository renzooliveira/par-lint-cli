import type { RuleDefinition } from '../../../engine/runner.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createFinding } from '../../../engine/finding.js';

export const templateTooLongRule: RuleDefinition = {
  id: 'component/template-too-long',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const opts = config.rules['component/template-too-long']?.options as {
      maxLines?: number;
      maxLinesPage?: number;
      maxLinesComponent?: number;
    } | undefined;

    const isPage = file.tags.includes('is_page') || file.path.includes('.page.');
    const defaultMax = isPage ? 150 : 80;
    const maxLines = (isPage ? opts?.maxLinesPage : opts?.maxLinesComponent) ?? opts?.maxLines ?? defaultMax;

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const lineCount = source.split('\n').length;

    if (lineCount > maxLines) {
      return [createFinding({
        rule_id: 'component/template-too-long',
        file: file.path,
        line: 1,
        severity: 'warning',
        message: `Template too long: ${lineCount} lines exceeds max ${maxLines}. Extract sub-components.`,
        source_principle: 'Large templates are hard to maintain and test',
        category: 'component',
        fix_complexity: 'L',
        evidence_trail: [{
          tool: 'lineCount',
          query: { file: file.path },
          result: { lineCount, maxLines },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      })];
    }

    return [];
  },
};
