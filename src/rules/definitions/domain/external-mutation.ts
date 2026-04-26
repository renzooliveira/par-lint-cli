import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const MUTATION_RE = /(\w+)\.(\w+)\s*=\s*[^=]/g;
const SKIP_PATTERNS = /^(this|self|result|response|config|options|event|error|err|e)\b/;

export const externalMutationRule: RuleDefinition = {
  id: 'domain/external-mutation',
  version: '1.0.0',
  category: 'domain',
  severity: 'error',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    const opts = config.rules['domain/external-mutation']?.options as {
      maxMutations?: number;
      ignoreObjects?: string[];
    } | undefined;
    const maxMutations = opts?.maxMutations ?? 2;
    const ignoreObjects = new Set(opts?.ignoreObjects ?? []);

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const mutations: Array<{ line: number; text: string; obj: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      MUTATION_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = MUTATION_RE.exec(line)) !== null) {
        const obj = match[1]!;
        if (SKIP_PATTERNS.test(obj)) continue;
        if (ignoreObjects.has(obj)) continue;
        mutations.push({ line: i + 1, text: match[0].trim(), obj });
      }
    }

    const byObject = new Map<string, typeof mutations>();
    for (const m of mutations) {
      const list = byObject.get(m.obj) ?? [];
      list.push(m);
      byObject.set(m.obj, list);
    }

    const findings = [];
    for (const [obj, muts] of byObject) {
      if (muts.length > maxMutations) {
        findings.push(createFinding({
          rule_id: 'domain/external-mutation',
          file: file.path,
          line: muts[0]!.line,
          severity: 'error',
          message: `Object '${obj}' mutated ${muts.length} times externally (max ${maxMutations}). Use a method that expresses intent.`,
          source_principle: 'Tell-Don\'t-Ask: state changes via intent-expressing methods',
          category: 'domain',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex',
            query: { file: file.path },
            result: { object: obj, mutationCount: muts.length, maxMutations },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
