import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const ASYNC_PIPE_RE = /\|\s*async\b/;
const LOADING_RE = /loading|isLoading|spinner|ion-spinner|skeleton|shimmer/i;

export const missingLoadingStateRule: RuleDefinition = {
  id: 'ux/missing-loading-state',
  version: '1.0.0',
  category: 'ux',
  severity: 'warning',
  description: 'Detects async operations in templates without loading indicator',
  principle: 'Async operations must show visual progress feedback to the user',
  applicable_to: ['is_template'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readSource(file.path, cwd);

    if (!ASYNC_PIPE_RE.test(source)) return [];
    if (LOADING_RE.test(source)) return [];

    return [createFinding({
      rule_id: 'ux/missing-loading-state',
      file: file.path,
      line: 1,
      severity: 'warning',
      message: 'Template uses async pipe but has no loading state indicator. Add a loading spinner or skeleton.',
      source_principle: 'Async data should show loading state to prevent blank screen',
      category: 'ux',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex',
        query: { file: file.path },
        result: { hasAsyncPipe: true, hasLoadingState: false },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
