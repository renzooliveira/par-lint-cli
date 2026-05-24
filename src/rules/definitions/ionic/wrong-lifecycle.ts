import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const NGONINIT_RE = /\bngOnInit\s*\(\s*\)/;
const HTTP_CALL_RE = /\.(get|post|put|patch|delete|request)\s*[<(]|\.subscribe\s*\(|\.pipe\s*\(/;
const ION_CONTENT_RE = /<ion-content/;

export const wrongLifecycleRule: RuleDefinition = {
  id: 'ionic/wrong-lifecycle',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects ngOnInit for data loading in Ionic pages instead of ionViewWillEnter',
  principle: 'In Ionic, ngOnInit runs once; ionViewWillEnter re-runs on tab/back navigation',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (!file.path.includes('.page.') && !file.path.includes('/pages/')) return [];

    const source = await readSource(file.path, cwd);

    if (!ION_CONTENT_RE.test(source) && !file.path.includes('.page.')) return [];

    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    let inNgOnInit = false;
    let ngOnInitLine = 0;
    let braceDepth = 0;
    let hasHttpInInit = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (NGONINIT_RE.test(line)) {
        inNgOnInit = true;
        ngOnInitLine = i + 1;
        braceDepth = 0;
        hasHttpInInit = false;
      }

      if (inNgOnInit) {
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') {
            braceDepth--;
            if (braceDepth <= 0) {
              if (hasHttpInInit) {
                findings.push(createFinding({
                  rule_id: 'ionic/wrong-lifecycle',
                  file: file.path,
                  line: ngOnInitLine,
                  severity: 'warning',
                  message: `Data loading in ngOnInit() on Ionic page. Use ionViewWillEnter() instead — it re-runs on navigation.`,
                  source_principle: 'ionViewWillEnter re-runs on tab/back navigation, ngOnInit does not',
                  category: 'ionic',
                  fix_complexity: 'S',
                  evidence_trail: [{
                    tool: 'regex.wrongLifecycle',
                    query: { file: file.path },
                    result: { line: ngOnInitLine },
                    timestamp: new Date().toISOString(),
                    cache_hit: false,
                  }],
                }));
              }
              inNgOnInit = false;
            }
          }
        }

        if (HTTP_CALL_RE.test(line)) {
          hasHttpInInit = true;
        }
      }
    }

    return findings;
  },
};
