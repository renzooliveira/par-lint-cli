import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const EFFECT_RE = /effect\s*\(/;
const NEEDS_CLEANUP_RE = /addEventListener|setTimeout|setInterval/;
const ON_CLEANUP_RE = /onCleanup/;

export const effectWithoutCleanupRule: RuleDefinition = {
  id: 'signals/effect-without-cleanup',
  version: '1.0.0',
  category: 'signals',
  severity: 'warning',
  description: 'Detects effect() with resource acquisition but no onCleanup',
  principle: 'Effects that acquire resources must clean up via onCleanup to avoid leaks',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('effect(')) return [];

    const lines = source.split('\n');
    const findings = [];

    let inEffect = false;
    let braceDepth = 0;
    let effectBraceDepth = 0;
    let effectStartLine = 0;
    let effectContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (!inEffect && EFFECT_RE.test(line)) {
        inEffect = true;
        effectBraceDepth = braceDepth;
        effectStartLine = i + 1;
        effectContent = '';
      }

      if (inEffect) effectContent += line + '\n';

      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') {
          braceDepth--;
          if (inEffect && braceDepth === effectBraceDepth) {
            if (NEEDS_CLEANUP_RE.test(effectContent) && !ON_CLEANUP_RE.test(effectContent)) {
              findings.push(createFinding({
                rule_id: 'signals/effect-without-cleanup',
                file: file.path,
                line: effectStartLine,
                severity: 'warning',
                message: 'effect() acquires resources without onCleanup. Add onCleanup to prevent memory leaks.',
                source_principle: 'Effects with resources need cleanup',
                category: 'signals',
                fix_complexity: 'M',
                evidence_trail: [{
                  tool: 'regex',
                  query: { pattern: 'effect without cleanup', file: file.path },
                  result: { line: effectStartLine },
                  timestamp: new Date().toISOString(),
                  cache_hit: false,
                }],
              }));
            }
            inEffect = false;
          }
        }
      }
    }

    return findings;
  },
};
