import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const SAFE_PATTERNS = /\|\s*async|\|\s*currency|\|\s*date|\|\s*json|\|\s*number|\|\s*percent|\|\s*slice|\|\s*titlecase|\|\s*uppercase|\|\s*lowercase/i;

export const methodCallInTemplateRule: RuleDefinition = {
  id: 'template/method-call-in-template',
  version: '1.0.0',
  category: 'template',
  severity: 'warning',
  description: 'Detects method calls in templates that run on every change detection',
  principle: 'Method calls in templates cause performance issues; use pipes or computed signals',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);
    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const interpolations = line.match(/\{\{\s*([^}]+)\s*\}\}/g);
      if (!interpolations) continue;

      for (const interp of interpolations) {
        const content = interp.replace(/\{\{|\}\}/g, '').trim();
        if (/\w+\s*\(.*\)/.test(content) && !SAFE_PATTERNS.test(line) && !/\.length/.test(content)) {
          const fnName = content.match(/(\w+)\s*\(/)?.[1];
          if (fnName && /^[a-z]/.test(fnName) && fnName.length > 2 && /^(get|set|calc|compute|format|find|fetch|load|check|build|create|render|generate|transform|parse|convert|validate|process|handle|resolve|extract|determine|evaluate)/.test(fnName)) {
            findings.push(createFinding({
              rule_id: 'template/method-call-in-template',
              file: file.path,
              line: i + 1,
              severity: 'warning',
              message: `Method ${fnName}() called in template. Use a pipe or computed signal instead.`,
              source_principle: 'Methods in templates re-execute on every change detection cycle',
              category: 'template',
              fix_complexity: 'M',
              evidence_trail: [{
                tool: 'regex.methodCall',
                query: { file: file.path },
                result: { line: i + 1, method: fnName },
                timestamp: new Date().toISOString(),
                cache_hit: false,
              }],
            }));
          }
        }
      }
    }

    return findings;
  },
};
