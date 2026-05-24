import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PROP_ACCESS_RE = /(\w+)\.(\w+)/g;
const SKIP_OBJECTS = new Set(['this', 'self', 'console', 'Math', 'JSON', 'Object', 'Array', 'Promise', 'Date', 'Number', 'String', 'Boolean', 'Error', 'Map', 'Set', 'RegExp', 'http', 'store', 'decider', 'router', 'route', 'fb', 'dialog', 'config', 'options', 'opts', 'rule', 'finding', 'event', 'request', 'response', 'req', 'res']);
const SKIP_FILE_RE = /\.(mapper|facade)\.|cli[\\/](commands|formatters)[\\/]/i;
const FUNC_START_RE = /(?:function\s+\w+|(?:async\s+)?(?:\w+\s*)?)\s*\(([^)]*)\)\s*[:{]/;
const ARROW_FUNC_RE = /(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*(?::\s*\w+)?\s*=>/;
const METHOD_RE = /^\s*(?:async\s+)?(?:public\s+|private\s+|protected\s+)?(\w+)\s*\(([^)]*)\)/;

function extractParamNames(paramStr: string): Set<string> {
  const names = new Set<string>();
  for (const part of paramStr.split(',')) {
    const trimmed = part.trim();
    const name = trimmed.split(/[\s:?=]/)[0];
    if (name) names.add(name);
  }
  return names;
}

export const featureEnvyRule: RuleDefinition = {
  id: 'domain/feature-envy',
  version: '1.1.0',
  category: 'domain',
  severity: 'warning',
  description: 'Method accesses too many properties of another object',
  principle: 'A method that uses more data from another class belongs in that class',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (SKIP_FILE_RE.test(file.path)) return [];

    const opts = config.rules['domain/feature-envy'] as { threshold?: number } | undefined;
    const threshold = opts?.threshold ?? 4;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const findings: ReturnType<typeof createFinding>[] = [];
    let currentParams = new Set<string>();
    let scopeAccess = new Map<string, { props: Set<string>; firstLine: number }>();
    let braceDepth = 0;
    let inFunction = false;

    const flushScope = () => {
      for (const [obj, data] of scopeAccess) {
        if (data.props.size > threshold) {
          findings.push(createFinding({
            rule_id: 'domain/feature-envy',
            file: file.path,
            line: data.firstLine,
            severity: 'warning',
            message: `Possible feature envy: accesses ${data.props.size} distinct properties of '${obj}' (threshold: ${threshold}). Consider moving logic to '${obj}'.`,
            source_principle: 'A method that uses more data from another class belongs in that class',
            category: 'domain',
            fix_complexity: 'M',
            suggested_fix: {
              kind: 'move_method',
              description: `Move logic to '${obj}' — this method accesses ${data.props.size} of its properties`,
            },
            evidence_trail: [{
              tool: 'regex',
              query: { file: file.path },
              result: { object: obj, distinctProps: data.props.size, threshold },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
      scopeAccess = new Map();
      currentParams = new Set();
      inFunction = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      if (line.trimStart().startsWith('import ')) continue;

      const methodMatch = line.match(METHOD_RE);
      const funcMatch = line.match(FUNC_START_RE);
      const arrowMatch = line.match(ARROW_FUNC_RE);

      if (methodMatch ?? funcMatch ?? arrowMatch) {
        if (inFunction) flushScope();
        inFunction = true;
        braceDepth = 0;

        const paramStr = methodMatch?.[2] ?? funcMatch?.[1] ?? '';
        currentParams = extractParamNames(paramStr);
        if (arrowMatch?.[1]) currentParams.add(arrowMatch[1]);
      }

      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') {
          braceDepth--;
          if (braceDepth <= 0 && inFunction) {
            flushScope();
          }
        }
      }

      if (!inFunction) continue;

      PROP_ACCESS_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = PROP_ACCESS_RE.exec(line)) !== null) {
        const obj = match[1]!;
        if (SKIP_OBJECTS.has(obj)) continue;
        if (currentParams.has(obj)) continue;
        if (/^[A-Z]/.test(obj) && obj === obj.toUpperCase()) continue;

        const prop = match[2]!;
        const entry = scopeAccess.get(obj) ?? { props: new Set<string>(), firstLine: i + 1 };
        entry.props.add(prop);
        scopeAccess.set(obj, entry);
      }
    }

    if (inFunction) flushScope();

    return findings;
  },
};
