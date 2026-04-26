import type { RuleDefinition } from '../../../engine/runner.js';
import { readScssSource } from '../../../adapters/stylelint.js';
import { createFinding } from '../../../engine/finding.js';

export const scssFileTooLongRule: RuleDefinition = {
  id: 'scss/file-too-long',
  version: '1.0.0',
  category: 'scss',
  severity: 'error',
  description: 'Detects SCSS files exceeding maximum line count',
  principle: 'Large style files indicate missing component decomposition',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const opts = config.rules['scss/file-too-long']?.options as {
      maxLines?: number;
    } | undefined;
    const maxLines = opts?.maxLines ?? 150;

    const source = await readScssSource(file.path, cwd);
    const lineCount = source.split('\n').length;

    if (lineCount > maxLines) {
      return [createFinding({
        rule_id: 'scss/file-too-long',
        file: file.path,
        line: 1,
        severity: 'error',
        message: `SCSS file too long: ${lineCount} lines exceeds max ${maxLines}. Split into partials or extract mixins.`,
        source_principle: 'Large SCSS files indicate unstructured styling — decompose into partials, mixins, and design tokens',
        category: 'scss',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'stylelint.lineCount',
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
