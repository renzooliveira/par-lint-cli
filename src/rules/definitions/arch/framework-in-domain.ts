import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const frameworkInDomainRule: RuleDefinition = {
  id: 'arch/framework-in-domain',
  version: '1.0.0',
  category: 'arch',
  severity: 'error',
  description: 'Detects framework imports in domain layer files',
  principle: 'Domain entities should be framework-agnostic for portability and testability',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    const source = await readSource(file.path, cwd);
    const isDomainPath = /domain\/|entities\/|models\//.test(file.path);
    const isDomainClass = /class\s+\w*(Entity|ValueObject|Aggregate|DomainEvent)\b/.test(source);
    if (!isDomainPath && !isDomainClass) return [];
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/import\s.*from\s+['"]@angular\//.test(lines[i]!) || /import\s.*from\s+['"]@ionic\//.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'arch/framework-in-domain',
          file: file.path,
          line: i + 1,
          severity: 'error',
          message: 'Framework import in domain layer. Domain entities should be framework-agnostic.',
          source_principle: 'Clean architecture: domain layer has no external dependencies',
          category: 'arch',
          fix_complexity: 'XL',
          evidence_trail: [{
            tool: 'regex.frameworkImport',
            query: { file: file.path },
            result: { line: i + 1, match: lines[i]!.trim() },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
