import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CLASS_RE = /^\s*(?:export\s+)?class\s+(\w+)/;
const ARRAY_PROP_RE = /^\s*(?:readonly\s+)?(\w+)\s*[?:]?\s*:?\s*\w*\[?\]?\s*=?\s*(?:\[\]|new\s+Array|Array<)/;
const TYPED_ARRAY_RE = /^\s*(?:readonly\s+)?(\w+)\s*:\s*\w+\[\]/;
export const arrayAsCollectionAnemicRule: RuleDefinition = {
  id: 'domain/array-as-collection-anemic',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  description: 'Detects array properties with repeated chain operations that should be a first-class collection',
  principle: 'Collections carrying domain logic deserve their own class (First-class Collections)',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    if (!CLASS_RE.test(source)) return [];

    const arrayProps: { name: string; line: number }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const m = line.match(ARRAY_PROP_RE) ?? line.match(TYPED_ARRAY_RE);
      if (m) {
        const name = m[1]!;
        if (name !== 'constructor' && name !== 'return') {
          arrayProps.push({ name, line: i + 1 });
        }
      }
    }

    if (arrayProps.length === 0) return [];

    const findings: ReturnType<typeof createFinding>[] = [];

    for (const prop of arrayProps) {
      const usageRe = new RegExp(`this\\.${prop.name}\\.(filter|map|reduce|find|some|every|forEach|sort|slice|flatMap)\\s*\\(`, 'g');
      const usages = source.match(usageRe);
      const chainCount = usages?.length ?? 0;

      if (chainCount >= 3) {
        findings.push(createFinding({
          rule_id: 'domain/array-as-collection-anemic',
          file: file.path,
          line: prop.line,
          severity: 'info',
          message: `Array property '${prop.name}' has ${chainCount} chain operations. Consider extracting a first-class collection.`,
          source_principle: 'Collections carrying domain logic deserve their own class',
          category: 'domain',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.arrayAsCollectionAnemic',
            query: { file: file.path },
            result: { property: prop.name, chainOperations: chainCount },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
