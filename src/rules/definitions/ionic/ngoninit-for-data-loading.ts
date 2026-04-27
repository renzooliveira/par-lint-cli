import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

export const ngoninitForDataLoadingRule: RuleDefinition = {
  id: 'ionic/ngoninit-for-data-loading',
  version: '1.0.0',
  category: 'ionic',
  severity: 'warning',
  description: 'Detects ngOnInit data loading in Ionic pages instead of ionViewWillEnter',
  principle: 'Ionic page lifecycle requires ionViewWillEnter for data that refreshes on navigation',
  applicable_to: ['is_component', 'is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts')) return [];

    const source = await readSource(file.path, cwd);
    if (!source.includes('ion-content') && !source.includes('ion-header') && !/.page\.ts$/.test(file.path)) return [];
    if (!source.includes('ngOnInit')) return [];

    const ngOnInitMatch = source.match(/ngOnInit\s*\(\s*\)\s*\{/);
    if (!ngOnInitMatch) return [];

    const startIdx = ngOnInitMatch.index! + ngOnInitMatch[0].length;
    let braceCount = 1;
    let endIdx = startIdx;
    while (braceCount > 0 && endIdx < source.length) {
      if (source[endIdx] === '{') braceCount++;
      if (source[endIdx] === '}') braceCount--;
      endIdx++;
    }
    const body = source.substring(startIdx, endIdx);

    const hasDataLoading = /\.(get|post|put|delete|fetch|load|subscribe|query)\s*\(/.test(body)
      || /fetch\s*\(/.test(body)
      || /this\.\w*(load|fetch|get)\w*\s*\(/.test(body);

    if (!hasDataLoading) return [];

    const line = source.substring(0, ngOnInitMatch.index!).split('\n').length;

    return [createFinding({
      rule_id: 'ionic/ngoninit-for-data-loading',
      file: file.path,
      line,
      severity: 'warning',
      message: 'Use ionViewWillEnter() instead of ngOnInit() for data loading in Ionic pages.',
      source_principle: 'ionViewWillEnter fires on every navigation, ngOnInit only once',
      category: 'ionic',
      fix_complexity: 'L',
      evidence_trail: [{
        tool: 'regex.ngOnInitDataLoading',
        query: { file: file.path },
        result: { line },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
