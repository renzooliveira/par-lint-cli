import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PROP_ACCESS_RE = /(\w+)\.(\w+)/g;
const SKIP_OBJECTS = new Set(['this', 'self', 'console', 'Math', 'JSON', 'Object', 'Array', 'Promise', 'Date', 'Number', 'String', 'Boolean', 'Error', 'Map', 'Set', 'RegExp']);

export const featureEnvyRule: RuleDefinition = {
  id: 'domain/feature-envy',
  version: '1.0.0',
  category: 'domain',
  severity: 'warning',
  description: 'Method accesses too many properties of another object',
  principle: 'A method that uses more data from another class belongs in that class',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    const opts = config.rules['domain/feature-envy'] as { threshold?: number } | undefined;
    const threshold = opts?.threshold ?? 3;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const accessCounts = new Map<string, { count: number; props: Set<string>; firstLine: number }>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      if (line.trimStart().startsWith('import ')) continue;

      PROP_ACCESS_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = PROP_ACCESS_RE.exec(line)) !== null) {
        const obj = match[1]!;
        if (SKIP_OBJECTS.has(obj)) continue;
        if (/^[A-Z]/.test(obj) && obj === obj.toUpperCase()) continue;

        const prop = match[2]!;
        const entry = accessCounts.get(obj) ?? { count: 0, props: new Set<string>(), firstLine: i + 1 };
        entry.props.add(prop);
        entry.count++;
        accessCounts.set(obj, entry);
      }
    }

    const findings = [];
    for (const [obj, data] of accessCounts) {
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

    return findings;
  },
};
