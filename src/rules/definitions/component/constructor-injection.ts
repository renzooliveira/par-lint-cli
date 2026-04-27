import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const constructorInjectionRule: RuleDefinition = {
  id: 'component/constructor-injection',
  version: '1.0.0',
  category: 'component',
  severity: 'warning',
  description: 'Detects constructor-based DI instead of inject() function',
  principle: 'inject() is tree-shakeable and works in any injection context',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!/@Component\s*\(/.test(source) && !/@Injectable/.test(source)) return [];

    const constructorMatch = source.match(/constructor\s*\(([\s\S]*?)\)\s*\{/);
    if (!constructorMatch) return [];

    const params = constructorMatch[1]!;
    const hasInjectedParams = /(private|protected|public|readonly)\s+\w+\s*:/.test(params);
    if (!hasInjectedParams) return [];

    const line = source.substring(0, constructorMatch.index!).split('\n').length;

    return [createFinding({
      rule_id: 'component/constructor-injection',
      file: file.path,
      line,
      severity: 'warning',
      message: 'Use inject() function instead of constructor parameter injection.',
      source_principle: 'inject() is tree-shakeable and works in any injection context',
      category: 'component',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex.constructorInjection',
        query: { file: file.path },
        result: { line, params: params.trim() },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
