import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FIELD_DECL_RE = /^\s*(?:private\s+|protected\s+|public\s+|readonly\s+)*(\w+)\s*[?!]?\s*[:=]/;
const THIS_ACCESS_RE = /this\.(\w+)/g;
const METHOD_START_RE = /^\s*(?:async\s+)?(?:public\s+|private\s+|protected\s+)?(\w+)\s*\([^)]*\)\s*[:{]/;
const CONSTRUCTOR_RE = /^\s*constructor\s*\(/;
const SKIP_FIELDS = new Set(['subscription', 'destroy$', 'unsubscribe', 'destroyRef']);
const INJECT_RE = /\binject\s*\(/;

export const temporaryFieldRule: RuleDefinition = {
  id: 'domain/temporary-field',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  description: 'Detects class fields used only within a single method',
  principle: 'A field used in only one method should be a local variable',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    let inClass = false;
    let classLine = 0;
    const fieldLines = new Map<string, number>();
    const fieldUsage = new Map<string, Set<string>>();
    let currentMethod = '';
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (/^\s*(?:export\s+)?class\s+/.test(line)) {
        inClass = true;
        classLine = i + 1;
        braceDepth = 0;
      }

      if (!inClass) continue;

      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }

      if (braceDepth <= 0) {
        inClass = false;
        continue;
      }

      if (CONSTRUCTOR_RE.test(line)) {
        currentMethod = 'constructor';
      } else {
        const methodMatch = line.match(METHOD_START_RE);
        if (methodMatch) {
          currentMethod = methodMatch[1]!;
        }
      }

      if (!currentMethod && braceDepth === 1) {
        const fieldMatch = line.match(FIELD_DECL_RE);
        if (fieldMatch && !SKIP_FIELDS.has(fieldMatch[1]!) && !INJECT_RE.test(line)) {
          fieldLines.set(fieldMatch[1]!, i + 1);
        }
      }

      if (currentMethod) {
        THIS_ACCESS_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = THIS_ACCESS_RE.exec(line)) !== null) {
          const field = match[1]!;
          if (!fieldUsage.has(field)) fieldUsage.set(field, new Set());
          fieldUsage.get(field)!.add(currentMethod);
        }
      }
    }

    const findings: ReturnType<typeof createFinding>[] = [];

    for (const [field, line] of fieldLines) {
      const methods = fieldUsage.get(field);
      if (!methods || methods.size !== 1) continue;
      const onlyMethod = [...methods][0]!;
      if (onlyMethod === 'constructor') continue;

      findings.push(createFinding({
        rule_id: 'domain/temporary-field',
        file: file.path,
        line,
        severity: 'info',
        message: `Field '${field}' is only used in method '${onlyMethod}'. Consider making it a local variable.`,
        source_principle: 'A field used in only one method should be a local variable',
        category: 'domain',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex.temporaryField',
          query: { file: file.path },
          result: { field, usedInMethod: onlyMethod },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
