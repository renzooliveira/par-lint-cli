import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TECHNICAL_NAMES = /\b(DataManager|ProcessorService|HelperUtil|HandlerService|ManagerService|BaseService|GenericService|AbstractProcessor|DataProcessor|InfoService|UtilService|CommonHelper)\b/;

export const technicalNamingRule: RuleDefinition = {
  id: 'domain/technical-naming',
  version: '1.0.0',
  category: 'domain',
  severity: 'info',
  description: 'Detects generic/technical class names instead of domain language',
  principle: 'Use ubiquitous language from the domain, not technical implementation terms',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/(?:class|interface)\s+(\w+)/);
      if (!match) continue;

      if (TECHNICAL_NAMES.test(match[1]!)) {
        findings.push(createFinding({
          rule_id: 'domain/technical-naming',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `"${match[1]}" is a generic technical name. Use domain-specific terminology.`,
          source_principle: 'Ubiquitous language bridges code and business concepts',
          category: 'domain',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'regex.technicalName',
            query: { file: file.path },
            result: { line: i + 1, name: match[1] },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
