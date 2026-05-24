import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PROP_ASSIGN_RE = /(\w+)\.(\w+)\s*=\s*[^=]/;
const CONSTRUCTOR_RE = /^\s*constructor\s*\(/;
const BUILDER_RE = /builder|factory|mapper|init/i;
const THIS_RE = /^this$/;
const SIGNAL_UPDATE_RE = /\.(set|update|mutate)\s*\(/;

export const noObjectMutationRule: RuleDefinition = {
  id: 'functional/no-object-mutation',
  version: '1.0.0',
  category: 'fp',
  severity: 'info',
  description: 'Detects direct property assignment on existing objects',
  principle: 'Prefer immutable updates (spread, Object.assign) over direct mutation',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (BUILDER_RE.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    let inConstructor = false;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      if (CONSTRUCTOR_RE.test(line)) {
        inConstructor = true;
        braceDepth = 0;
      }

      if (inConstructor) {
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') {
            braceDepth--;
            if (braceDepth <= 0) inConstructor = false;
          }
        }
        continue;
      }

      if (SIGNAL_UPDATE_RE.test(line)) continue;

      const match = line.match(PROP_ASSIGN_RE);
      if (!match) continue;

      const obj = match[1]!;
      if (THIS_RE.test(obj)) continue;
      if (/^[A-Z]/.test(obj)) continue;
      if (['window', 'document', 'process', 'module', 'exports', 'console', 'self'].includes(obj)) continue;

      findings.push(createFinding({
        rule_id: 'functional/no-object-mutation',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `Direct property mutation on '${obj}.${match[2]}'. Prefer immutable update patterns.`,
        source_principle: 'Prefer immutable updates over direct mutation',
        category: 'fp',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex.objectMutation',
          query: { file: file.path },
          result: { line: i + 1, object: obj, property: match[2] },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
