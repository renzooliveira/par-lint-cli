import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const FUNC_SIGNATURE_RE = /(?:(?:async\s+)?(?:public\s+|private\s+|protected\s+|static\s+)*)?(\w+)\s*\(([^)]{10,})\)/;
const PARAM_RE = /(\w+)\s*[?:]?\s*:/g;

function extractParamNames(paramStr: string): string[] {
  const names: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(PARAM_RE.source, 'g');
  while ((m = re.exec(paramStr)) !== null) {
    names.push(m[1]!);
  }
  return names;
}

function findClumps(functions: { name: string; params: string[] }[], minParams: number, minFunctions: number): { params: string[]; functions: string[] }[] {
  const paramSets = functions.map(f => new Set(f.params));
  const clumps: { params: string[]; functions: string[] }[] = [];

  for (let i = 0; i < functions.length; i++) {
    for (let j = i + 1; j < functions.length; j++) {
      const shared = functions[i]!.params.filter(p => paramSets[j]!.has(p));
      if (shared.length < minParams) continue;

      const key = shared.sort().join(',');
      const existing = clumps.find(c => c.params.sort().join(',') === key);
      if (existing) {
        if (!existing.functions.includes(functions[i]!.name)) existing.functions.push(functions[i]!.name);
        if (!existing.functions.includes(functions[j]!.name)) existing.functions.push(functions[j]!.name);
      } else {
        clumps.push({ params: shared, functions: [functions[i]!.name, functions[j]!.name] });
      }
    }
  }

  return clumps.filter(c => c.functions.length >= minFunctions);
}

export const dataClumpRule: RuleDefinition = {
  id: 'domain/data-clump',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  description: 'Detects parameter groups that appear together in 3+ functions, indicating a missing type',
  principle: 'Parameters that always travel together should be a dedicated type',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const opts = config.rules['domain/data-clump'] as { min_occurrences?: number; min_params?: number } | undefined;
    const minOccurrences = opts?.min_occurrences ?? 3;
    const minParams = opts?.min_params ?? 3;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const functions: { name: string; params: string[]; line: number }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(FUNC_SIGNATURE_RE);
      if (!match) continue;
      const name = match[1]!;
      if (name === 'constructor' || name === 'if' || name === 'for' || name === 'while' || name === 'switch') continue;
      const params = extractParamNames(match[2]!);
      if (params.length >= minParams) {
        functions.push({ name, params, line: i + 1 });
      }
    }

    const clumps = findClumps(functions, minParams, minOccurrences);
    const findings: ReturnType<typeof createFinding>[] = [];

    for (const clump of clumps) {
      const first = functions.find(f => f.name === clump.functions[0]);
      findings.push(createFinding({
        rule_id: 'domain/data-clump',
        file: file.path,
        line: first?.line ?? 1,
        severity: 'info',
        message: `Parameters (${clump.params.join(', ')}) appear together in ${clump.functions.length} functions: ${clump.functions.join(', ')}. Extract a dedicated type.`,
        source_principle: 'Parameters that always travel together should be a dedicated type',
        category: 'domain',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.dataClump',
          query: { file: file.path },
          result: { params: clump.params, functions: clump.functions },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
