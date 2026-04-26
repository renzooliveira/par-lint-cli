import type { RuleDefinition } from '../../../engine/runner.js';
import { findPattern, readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const DEFAULT_IGNORE_CALLERS = [
  'store', 'query', 'params', 'formData', 'searchParams', 'headers', 'urlParams',
  'map', 'set', 'counts', 'cache', 'registry', 'dict', 'lookup',
];

const SIGNAL_DECL_RE = /(?:const|let|readonly|private|protected|public)\s+(\w+)\s*=\s*(?:signal|computed|contentChild|contentChildren|viewChild|viewChildren|model)\s*[<(]/g;
const SIGNAL_NAME_RE = /signal|Signal/i;

const DEFAULT_IGNORE_FILE_PATTERNS = [
  /\.decider\./i,
  /\.store\./i,
  /\.facade\./i,
  /\.state\./i,
  /\.reducer\./i,
];

export const externalSignalMutationRule: RuleDefinition = {
  id: 'state/external-signal-mutation',
  version: '1.1.0',
  category: 'state',
  severity: 'error',
  description: 'Detects signal.set()/update() calls outside the declaring class',
  principle: 'Signal is encapsulated by the class that declares it',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    const opts = config.rules['state/external-signal-mutation']?.options as {
      ignoreCallers?: string[];
      ignoreFilePatterns?: string[];
    } | undefined;

    const ignoreCallers = new Set(opts?.ignoreCallers ?? DEFAULT_IGNORE_CALLERS);
    const ignoreFilePatterns = opts?.ignoreFilePatterns
      ? opts.ignoreFilePatterns.map((p) => new RegExp(p, 'i'))
      : DEFAULT_IGNORE_FILE_PATTERNS;

    if (ignoreFilePatterns.some((re) => re.test(file.path))) return [];

    const source = await readSource(file.path, cwd);
    const signalNames = extractSignalNames(source);

    const patterns = [
      '$SIG.set($$$ARGS)',
      '$SIG.update($$$ARGS)',
    ];

    const findings = [];

    for (const pattern of patterns) {
      const matches = await findPattern(file.path, pattern, cwd);

      for (const match of matches) {
        const text = match.text;
        if (text.startsWith('this.')) continue;

        const caller = text.split('.')[0]!.trim();
        if (ignoreCallers.has(caller)) continue;
        if (!isLikelySignal(caller, signalNames)) continue;

        findings.push(createFinding({
          rule_id: 'state/external-signal-mutation',
          file: file.path,
          line: match.line,
          column: match.column,
          end_line: match.endLine,
          end_column: match.endColumn,
          severity: 'error',
          message: `Signal mutation from outside owner: ${text.trim()}. Signals should be encapsulated by declaring class.`,
          source_principle: 'Signal is encapsulated by declaring class',
          category: 'state',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'T7.find_pattern',
            query: { pattern, file: file.path },
            result: { line: match.line, text, is_external: true },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};

function extractSignalNames(source: string): Set<string> {
  const names = new Set<string>();
  SIGNAL_DECL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SIGNAL_DECL_RE.exec(source)) !== null) {
    names.add(m[1]!);
  }
  return names;
}

function isLikelySignal(caller: string, signalNames: Set<string>): boolean {
  if (signalNames.has(caller)) return true;
  if (SIGNAL_NAME_RE.test(caller)) return true;
  return false;
}
