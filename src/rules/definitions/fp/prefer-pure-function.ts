import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const STANDALONE_FUNC_RE = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/;
const ARROW_CONST_RE = /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*(?::\s*\w[^=]*?)?\s*=>/;
const CLASS_RE = /^\s*(?:export\s+)?(?:abstract\s+)?class\s+/;
const SKIP_FILE_RE = /\.(service|component|directive|guard|interceptor|resolver|pipe|module|controller|page)\./;

const SIDE_EFFECT_PATTERNS = [
  /\bthis\./,
  /\b(document|window)\.\w+\s*=/,
  /\b(document|window)\.\w+\(/,
  /\bconsole\.\w+\(/,
  /\blocalStorage\./,
  /\bsessionStorage\./,
  /\bfetch\s*\(/,
  /\bnew\s+XMLHttpRequest/,
  /\bglobalState\./,
];

const OUTER_SCOPE_MUTATION_RE = /^\s*(\w+)\s*(?:\+\+|--|[+\-*/|&^%]?=)\s*/;

function isTopLevelDeclaration(line: string): boolean {
  const trimmed = line.trimStart();
  return trimmed.startsWith('let ') || trimmed.startsWith('var ');
}

export const preferPureFunctionRule: RuleDefinition = {
  id: 'functional/prefer-pure-function',
  version: '1.0.0',
  category: 'fp',
  severity: 'info',
  description: 'Detects standalone functions with side effects that could be pure',
  principle: 'Pure functions are easier to test, compose, and reason about',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (SKIP_FILE_RE.test(file.path)) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    const outerVars = new Set<string>();
    for (const line of lines) {
      if (isTopLevelDeclaration(line)) {
        const match = line.match(/(?:let|var)\s+(\w+)/);
        if (match) outerVars.add(match[1]!);
      }
    }

    let inClass = false;
    let classDepth = 0;
    let inFunc = false;
    let funcName = '';
    let funcLine = 0;
    let funcDepth = 0;
    let funcHasSideEffect = false;
    let sideEffectKind = '';

    const flush = () => {
      if (funcName && funcHasSideEffect) {
        const reason = sideEffectKind === 'this' ? 'accesses this.*' :
          sideEffectKind === 'outer' ? 'mutates outer scope variable' :
          'has side effects';
        findings.push(createFinding({
          rule_id: 'functional/prefer-pure-function',
          file: file.path,
          line: funcLine,
          severity: 'info',
          message: `Function '${funcName}' ${reason}. Consider making it pure.`,
          source_principle: 'Pure functions are easier to test, compose, and reason about',
          category: 'fp',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.preferPureFunction',
            query: { file: file.path },
            result: { function: funcName, line: funcLine, sideEffect: sideEffectKind },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
      inFunc = false;
      funcName = '';
      funcHasSideEffect = false;
      sideEffectKind = '';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

      if (!inClass && !inFunc && CLASS_RE.test(line)) {
        inClass = true;
        classDepth = 0;
      }

      if (inClass) {
        for (const ch of line) {
          if (ch === '{') classDepth++;
          if (ch === '}') {
            classDepth--;
            if (classDepth <= 0) inClass = false;
          }
        }
        continue;
      }

      if (!inFunc) {
        const funcMatch = line.match(STANDALONE_FUNC_RE);
        const arrowMatch = !funcMatch ? line.match(ARROW_CONST_RE) : null;
        const match = funcMatch || arrowMatch;

        if (match) {
          funcName = match[1]!;
          funcLine = i + 1;
          funcDepth = 0;
          inFunc = true;
          funcHasSideEffect = false;
          sideEffectKind = '';
        }
      }

      if (inFunc) {
        for (const ch of line) {
          if (ch === '{') funcDepth++;
          if (ch === '}') {
            funcDepth--;
            if (funcDepth <= 0) {
              flush();
              break;
            }
          }
        }

        if (inFunc && !funcHasSideEffect) {
          for (const pat of SIDE_EFFECT_PATTERNS) {
            if (pat.test(line)) {
              funcHasSideEffect = true;
              sideEffectKind = /\bthis\./.test(line) ? 'this' : 'side-effect';
              break;
            }
          }

          if (!funcHasSideEffect) {
            const mutMatch = line.match(OUTER_SCOPE_MUTATION_RE);
            if (mutMatch && outerVars.has(mutMatch[1]!)) {
              funcHasSideEffect = true;
              sideEffectKind = 'outer';
            }
          }
        }
      }
    }
    flush();

    return findings;
  },
};
