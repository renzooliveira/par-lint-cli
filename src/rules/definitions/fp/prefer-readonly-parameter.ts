import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FUNC_PARAM_RE = /(?:function\s+\w+|(?:async\s+)?\w+)\s*\(([^)]+)\)/;
const OBJECT_TYPE_PARAM_RE = /(\w+)\s*:\s*(?!string|number|boolean|null|undefined|void|any|unknown|never)(\w+)/g;
const READONLY_RE = /Readonly\s*</;

export const preferReadonlyParameterRule: RuleDefinition = {
  id: 'functional/prefer-readonly-parameter',
  version: '1.0.0',
  category: 'fp',
  severity: 'info',
  description: 'Detects object-type parameters without Readonly<T> wrapper',
  principle: 'Object parameters should be Readonly<T> to prevent accidental mutation of inputs',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (file.path.includes('.model.') || file.path.includes('.interface.') || file.path.includes('.dto.')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    const skipTypes = new Set(['string', 'number', 'boolean', 'null', 'undefined', 'void', 'any', 'unknown', 'never', 'Date', 'RegExp', 'Promise', 'Observable', 'Signal', 'WritableSignal', 'EventEmitter', 'Subject', 'BehaviorSubject']);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      if (line.trimStart().startsWith('constructor')) continue;

      const funcMatch = line.match(FUNC_PARAM_RE);
      if (!funcMatch) continue;

      const params = funcMatch[1]!;
      if (READONLY_RE.test(params)) continue;

      OBJECT_TYPE_PARAM_RE.lastIndex = 0;
      let paramMatch: RegExpExecArray | null;
      while ((paramMatch = OBJECT_TYPE_PARAM_RE.exec(params)) !== null) {
        const paramName = paramMatch[1]!;
        const typeName = paramMatch[2]!;
        if (skipTypes.has(typeName)) continue;
        if (typeName.endsWith('[]')) continue;

        findings.push(createFinding({
          rule_id: 'functional/prefer-readonly-parameter',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `Parameter '${paramName}: ${typeName}' could be 'Readonly<${typeName}>' to prevent mutation.`,
          source_principle: 'Object parameters should be Readonly<T>',
          category: 'fp',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex.readonlyParameter',
            query: { file: file.path },
            result: { param: paramName, type: typeName },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
