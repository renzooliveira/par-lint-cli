import type { RuleDefinition } from '../../../engine/runner.js';
import { extractImports, parseImports } from '../../../adapters/dependency-cruiser.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';
import path from 'node:path';

export const circularDependencyRule: RuleDefinition = {
  id: 'arch/circular-dependency',
  version: '1.0.0',
  category: 'arch',
  severity: 'error',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const imports = await extractImports(file.path, cwd);

    const findings = [];

    for (const imp of imports) {
      const resolvedTarget = path.normalize(path.join(path.dirname(file.path), imp.to));
      let targetPath = resolvedTarget;
      if (!targetPath.endsWith('.ts')) targetPath += '.ts';

      let targetSource: string;
      try {
        targetSource = await readSource(targetPath, cwd);
      } catch {
        continue;
      }

      const targetImports = parseImports(targetSource, targetPath);
      const currentBase = file.path.replace(/\.ts$/, '');

      const backreference = targetImports.find((ti) => {
        const resolvedBack = path.normalize(path.join(path.dirname(targetPath), ti.to));
        const backBase = resolvedBack.replace(/\.ts$/, '');
        return backBase === currentBase || resolvedBack === file.path;
      });

      if (backreference) {
        findings.push(createFinding({
          rule_id: 'arch/circular-dependency',
          file: file.path,
          line: imp.line,
          severity: 'error',
          message: `Circular dependency: ${file.path} ↔ ${targetPath}`,
          source_principle: 'Circular dependencies cause unpredictable initialization and runtime errors',
          category: 'arch',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'dependency-cruiser.extractImports',
            query: { file: file.path, target: targetPath },
            result: { importLine: imp.line, backref: backreference.line },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
