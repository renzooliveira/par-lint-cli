import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FIELD_RE = /^\s+(?:private\s+|protected\s+|public\s+)?(\w+)\s*[?!]?\s*[:=]/;
const READONLY_RE = /\breadonly\b/;
const THIS_ASSIGN_RE = /this\.(\w+)\s*=/;
const CONSTRUCTOR_RE = /^\s*constructor\s*\(/;

export const preferReadonlyPropertyRule: RuleDefinition = {
  id: 'functional/prefer-readonly-property',
  version: '1.0.0',
  category: 'fp',
  severity: 'info',
  description: 'Detects class properties that are never reassigned outside constructor',
  principle: 'Properties that never change should be readonly to prevent accidental mutation',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const fields = new Map<string, number>();
    const reassigned = new Set<string>();
    let inConstructor = false;
    let inDecorator = false;
    let parenDepth = 0;
    let braceDepth = 0;
    let inClass = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (/@\w+\s*\(/.test(line)) {
        inDecorator = true;
        parenDepth = 0;
      }

      if (inDecorator) {
        for (const ch of line) {
          if (ch === '(') parenDepth++;
          if (ch === ')') {
            parenDepth--;
            if (parenDepth <= 0) inDecorator = false;
          }
        }
        continue;
      }

      if (/^\s*(?:export\s+)?class\s+/.test(line)) inClass = true;
      if (!inClass) continue;

      const fieldMatch = line.match(FIELD_RE);
      if (fieldMatch && !READONLY_RE.test(line) && !line.includes('signal(') && !line.includes('computed(') && !line.includes('inject(')) {
        fields.set(fieldMatch[1]!, i + 1);
      }

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

      const assignMatches = line.matchAll(/this\.(\w+)\s*=/g);
      for (const m of assignMatches) {
        reassigned.add(m[1]!);
      }
    }

    const findings: ReturnType<typeof createFinding>[] = [];

    for (const [field, line] of fields) {
      if (reassigned.has(field)) continue;

      findings.push(createFinding({
        rule_id: 'functional/prefer-readonly-property',
        file: file.path,
        line,
        severity: 'info',
        message: `Property '${field}' is never reassigned outside constructor. Add 'readonly'.`,
        source_principle: 'Properties that never change should be readonly',
        category: 'fp',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex.readonlyProperty',
          query: { file: file.path },
          result: { field },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
