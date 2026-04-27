import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const subjectNeverCompletedRule: RuleDefinition = {
  id: 'rxjs/subject-never-completed',
  version: '1.0.0',
  category: 'rxjs',
  severity: 'warning',
  description: 'Detects Subject/BehaviorSubject without .complete() call',
  principle: 'Uncompleted Subjects cause memory leaks in long-lived services',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!/@Injectable/.test(source)) return [];

    const subjectMatches = source.match(/new\s+(Subject|BehaviorSubject|ReplaySubject|AsyncSubject)\s*[<(]/g);
    if (!subjectMatches) return [];

    if (/\.complete\s*\(/.test(source) || /takeUntilDestroyed/.test(source)) return [];

    const findings = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (/new\s+(Subject|BehaviorSubject|ReplaySubject|AsyncSubject)\s*[<(]/.test(lines[i]!)) {
        findings.push(createFinding({
          rule_id: 'rxjs/subject-never-completed',
          file: file.path,
          line: i + 1,
          severity: 'warning',
          message: 'Subject created without .complete() in ngOnDestroy. This causes memory leaks.',
          source_principle: 'Always complete Subjects in service/component lifecycle',
          category: 'rxjs',
          fix_complexity: 'L',
          evidence_trail: [{
            tool: 'regex.subjectNoComplete',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};
