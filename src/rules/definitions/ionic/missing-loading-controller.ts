import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const HTTP_CALL_RE = /this\.\w+\.(get|post|put|patch|delete)\s*[<(]/;
const LOADING_RE = /loadingController|LoadingController|loading\.present|showLoading|isLoading/i;

export const missingLoadingControllerRule: RuleDefinition = {
  id: 'ionic/missing-loading-controller',
  version: '1.0.0',
  category: 'ionic',
  severity: 'info',
  description: 'Detects HTTP calls without loading indicator in Ionic pages',
  principle: 'HTTP calls need visual loading feedback — users should know something is happening',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (!file.path.includes('.page.') && !file.path.includes('/pages/')) return [];

    const source = await readSource(file.path, cwd);

    if (LOADING_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (HTTP_CALL_RE.test(line)) {
        findings.push(createFinding({
          rule_id: 'ionic/missing-loading-controller',
          file: file.path,
          line: i + 1,
          severity: 'info',
          message: `HTTP call without loading indicator. Use LoadingController or an isLoading flag for user feedback.`,
          source_principle: 'HTTP calls need visual loading feedback',
          category: 'ionic',
          fix_complexity: 'S',
          evidence_trail: [{
            tool: 'regex.missingLoading',
            query: { file: file.path },
            result: { line: i + 1 },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
        break;
      }
    }

    return findings;
  },
};
