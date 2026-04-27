import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const forWithoutEmptyRule: RuleDefinition = {
  id: 'template/for-without-empty',
  version: '1.0.0',
  category: 'template',
  severity: 'info',
  description: 'Detects @for without @empty fallback',
  principle: 'Empty state feedback prevents blank screens and improves UX',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('@for')) return [];

    const findings = [];
    const forBlocks = source.match(/@for\s*\([^)]+\)\s*\{/g);
    if (!forBlocks) return [];

    const stripped = source.replace(/\{\{[^}]*\}\}/g, '');
    const lines = stripped.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/@for\s*\(/.test(lines[i]!)) {
        let braceDepth = 0;
        let foundEmpty = false;
        let started = false;
        outer: for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]!) {
            if (ch === '{') { braceDepth++; started = true; }
            if (ch === '}') braceDepth--;
            if (started && braceDepth === 0) {
              if (/@empty/.test(lines[j]!) || (j + 1 < lines.length && /@empty/.test(lines[j + 1]!))) {
                foundEmpty = true;
              }
              break outer;
            }
          }
        }
        if (!foundEmpty) {
          findings.push(createFinding({
            rule_id: 'template/for-without-empty',
            file: file.path,
            line: i + 1,
            severity: 'info',
            message: '@for without @empty fallback. Add @empty to handle empty collections.',
            source_principle: 'Always provide empty state feedback for lists',
            category: 'template',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'regex.forWithoutEmpty',
              query: { file: file.path },
              result: { line: i + 1 },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
