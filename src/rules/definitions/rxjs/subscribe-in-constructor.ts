import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CONSTRUCTOR_RE = /constructor\s*\(/;
const SUBSCRIBE_RE = /\.subscribe\s*\(/;

export const subscribeInConstructorRule: RuleDefinition = {
  id: 'rxjs/subscribe-in-constructor',
  version: '1.0.0',
  category: 'rxjs',
  severity: 'warning',
  description: 'Detects .subscribe() calls in constructor',
  principle: 'Constructor is for DI; subscribe in lifecycle hooks like ngOnInit',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings = [];

    let inConstructor = false;
    let braceDepth = 0;
    let constructorBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (!inConstructor && CONSTRUCTOR_RE.test(line)) {
        inConstructor = true;
        constructorBraceDepth = braceDepth;
      }

      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') {
          braceDepth--;
          if (inConstructor && braceDepth === constructorBraceDepth) {
            inConstructor = false;
          }
        }
      }

      if (inConstructor && SUBSCRIBE_RE.test(line)) {
        findings.push(createFinding({
          rule_id: 'rxjs/subscribe-in-constructor',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: '.subscribe() in constructor. Move to ngOnInit or other lifecycle hook.',
          source_principle: 'Constructor should only handle DI',
          category: 'rxjs',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex',
            query: { pattern: 'subscribe in constructor', file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
