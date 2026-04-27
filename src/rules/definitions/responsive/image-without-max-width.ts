import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const IMG_SELECTOR_RE = /^\s*([\w.#&\s>+~,-]*\bimg\b[\w.#&\s>+~,-]*)\s*\{/;
const MAX_WIDTH_RE = /max-width\s*:/;

export const imageWithoutMaxWidthRule: RuleDefinition = {
  id: 'responsive/image-without-max-width',
  version: '1.0.0',
  category: 'responsive',
  severity: 'warning',
  description: 'Detects img CSS rules without max-width: 100%',
  principle: 'Images without max-width can cause horizontal scroll on small screens',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!IMG_SELECTOR_RE.test(line)) continue;

      let blockContent = '';
      let depth = 0;
      for (let j = i; j < lines.length; j++) {
        blockContent += lines[j] + '\n';
        depth += (lines[j]!.match(/\{/g) || []).length;
        depth -= (lines[j]!.match(/\}/g) || []).length;
        if (depth <= 0 && j > i) break;
      }

      if (MAX_WIDTH_RE.test(blockContent)) continue;

      findings.push(createFinding({
        rule_id: 'responsive/image-without-max-width',
        file: file.path,
        line: i + 1,
        severity: 'warning',
        message: 'img rule without max-width: 100%. Image may overflow on small screens.',
        source_principle: 'Images need max-width for responsive layouts',
        category: 'responsive',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex',
          query: { pattern: 'img without max-width', file: file.path },
          result: { line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
