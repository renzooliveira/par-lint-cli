import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';
import { execSync } from 'node:child_process';

const EXPORTED_TYPE_RE = /^export\s+(?:interface|type|abstract\s+class)\s+(\w+)/gm;

export const deadAbstractionRule: RuleDefinition = {
  id: 'arch/dead-abstraction',
  version: '1.0.0',
  category: 'arch',
  severity: 'info',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    const source = await readSource(file.path, cwd);

    const exportedTypes: Array<{ name: string; line: number }> = [];
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      EXPORTED_TYPE_RE.lastIndex = 0;
      const match = EXPORTED_TYPE_RE.exec(lines[i]!);
      if (match) {
        exportedTypes.push({ name: match[1]!, line: i + 1 });
      }
    }

    if (exportedTypes.length === 0) return [];

    const findings = [];
    for (const { name, line } of exportedTypes) {
      try {
        const raw = execSync(`git grep -l "\\b${name}\\b" -- "*.ts"`, { cwd });
        const output = typeof raw === 'string' ? raw : raw.toString('utf-8');
        const consumers = output.split('\n').filter((f) => f.trim().length > 0 && f.trim() !== file.path);

        if (consumers.length === 0) {
          findings.push(createFinding({
            rule_id: 'arch/dead-abstraction',
            file: file.path,
            line,
            severity: 'info',
            message: `Exported type '${name}' has no consumers outside this file. Consider removing or making it non-exported.`,
            source_principle: 'Abstractions exist to serve consumers',
            category: 'arch',
            fix_complexity: 'S',
            evidence_trail: [{
              tool: 'git-grep',
              query: { type: name, file: file.path },
              result: { consumers: 0 },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      } catch {
        findings.push(createFinding({
          rule_id: 'arch/dead-abstraction',
          file: file.path,
          line,
          severity: 'info',
          message: `Exported type '${name}' has no consumers outside this file. Consider removing or making it non-exported.`,
          source_principle: 'Abstractions exist to serve consumers',
          category: 'arch',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'git-grep',
            query: { type: name, file: file.path },
            result: { consumers: 0, error: true },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
