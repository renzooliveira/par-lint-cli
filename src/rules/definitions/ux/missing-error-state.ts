import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const ASYNC_PIPE_RE = /\|\s*async\b/;
const ERROR_RE = /error|errorState|err-message|error-message|\*ngIf=".*error/i;

export const missingErrorStateRule: RuleDefinition = {
  id: 'ux/missing-error-state',
  version: '1.0.0',
  category: 'ux',
  severity: 'error',
  applicable_to: ['is_template'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);

    if (!ASYNC_PIPE_RE.test(source)) return [];
    if (ERROR_RE.test(source)) return [];

    return [createFinding({
      rule_id: 'ux/missing-error-state',
      file: file.path,
      line: 1,
      severity: 'error',
      message: 'Template uses async pipe but has no error state handling. Add error feedback for failed requests.',
      source_principle: 'Async data should handle error state for user feedback',
      category: 'ux',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex',
        query: { file: file.path },
        result: { hasAsyncPipe: true, hasErrorState: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
