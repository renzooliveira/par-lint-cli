import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FUNC_PARAMS_RE = /(?:function\s+(\w+)|(?:async\s+)?(\w+))\s*\(([^)]{10,})\)/g;
const METHOD_PARAMS_RE = /^\s*(?:async\s+)?(?:public\s+|private\s+|protected\s+)?(\w+)\s*\(([^)]{10,})\)/;

function extractParamNames(paramStr: string): string[] {
  return paramStr
    .split(',')
    .map(p => p.trim().split(/[\s:?=]/)[0]!)
    .filter(n => n.length > 0);
}

export const dataClumpsRule: RuleDefinition = {
  id: 'domain/data-clumps',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  description: 'Detects same group of 3+ parameters appearing in multiple functions',
  principle: 'Recurring parameter groups indicate a missing type/interface',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const opts = config.rules['domain/data-clumps'] as { min_params?: number; min_occurrences?: number } | undefined;
    const minParams = opts?.min_params ?? 3;
    const minOccurrences = opts?.min_occurrences ?? 2;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const funcSignatures: { name: string; params: string[]; line: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const methodMatch = line.match(METHOD_PARAMS_RE);
      if (methodMatch) {
        funcSignatures.push({
          name: methodMatch[1]!,
          params: extractParamNames(methodMatch[2]!),
          line: i + 1,
        });
        continue;
      }

      FUNC_PARAMS_RE.lastIndex = 0;
      let funcMatch: RegExpExecArray | null;
      while ((funcMatch = FUNC_PARAMS_RE.exec(line)) !== null) {
        const name = funcMatch[1] ?? funcMatch[2] ?? 'anonymous';
        funcSignatures.push({
          name,
          params: extractParamNames(funcMatch[3]!),
          line: i + 1,
        });
      }
    }

    const clumpMap = new Map<string, { funcs: string[]; lines: number[] }>();

    for (const sig of funcSignatures) {
      if (sig.params.length < minParams) continue;

      const sorted = [...sig.params].sort();
      for (let size = minParams; size <= sorted.length; size++) {
        for (let start = 0; start <= sorted.length - size; start++) {
          const combo = sorted.slice(start, start + size).join(',');
          const entry = clumpMap.get(combo) ?? { funcs: [], lines: [] };
          entry.funcs.push(sig.name);
          entry.lines.push(sig.line);
          clumpMap.set(combo, entry);
        }
      }
    }

    const findings: ReturnType<typeof createFinding>[] = [];
    const reported = new Set<string>();

    for (const [combo, data] of clumpMap) {
      if (data.funcs.length < minOccurrences) continue;
      const key = combo;
      if (reported.has(key)) continue;
      reported.add(key);

      findings.push(createFinding({
        rule_id: 'domain/data-clumps',
        file: file.path,
        line: data.lines[0]!,
        severity: 'info',
        message: `Parameters (${combo.replace(/,/g, ', ')}) appear together in ${data.funcs.length} functions (${data.funcs.join(', ')}). Consider creating a type.`,
        source_principle: 'Recurring parameter groups indicate a missing type',
        category: 'domain',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.dataClumps',
          query: { file: file.path },
          result: { params: combo, functions: data.funcs },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
