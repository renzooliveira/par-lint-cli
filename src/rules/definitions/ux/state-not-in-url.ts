import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const PAGE_FILE_RE = /\.(?:page|component)\.ts$/;
const URL_SYNC_RE = /(?:ActivatedRoute|queryParams|Router\.navigate|router\.navigate|queryParamsHandling|URLSearchParams)/;

const NAVIGABLE_STATE_PATTERNS = [
  /\b(currentTab|activeTab|selectedTab)\b/,
  /\b(filter\w*|filterStatus|filterBy|filterType)\b/,
  /\b(currentPage|pageIndex|pageNumber|pageSize)\b/,
  /\b(sort\w*|sortBy|sortOrder|sortDirection)\b/,
  /\b(search\w*|searchQuery|searchTerm)\b/,
  /\b(selected\w*Category|selectedType|selectedStatus)\b/,
  /\b(expanded\w*|collapsed\w*|openPanel)\b/,
  /\b(view\w*Mode|displayMode|layout\w*Mode)\b/,
];

const STATE_DECL_RE = /^\s*(?:readonly\s+)?(\w+)\s*(?::\s*\w[^=]*?)?\s*=\s*(?:signal\s*\(|'|"|new\s|[0-9]|\[)/;

export const stateNotInUrlRule: RuleDefinition = {
  id: 'ux/state-not-in-url',
  version: '1.0.0',
  category: 'ux',
  severity: 'info',
  description: 'Detects navigable UI state (tabs, filters, pagination) not synced with URL query params',
  principle: 'Navigable state should be URL-addressable for sharing and back/forward navigation',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!PAGE_FILE_RE.test(file.path)) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const source = await readSource(file.path, cwd);

    if (URL_SYNC_RE.test(source)) return [];

    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const declMatch = line.match(STATE_DECL_RE);
      if (!declMatch) continue;

      const varName = declMatch[1]!;
      const isNavigable = NAVIGABLE_STATE_PATTERNS.some(p => p.test(varName));
      if (!isNavigable) continue;

      findings.push(createFinding({
        rule_id: 'ux/state-not-in-url',
        file: file.path,
        line: i + 1,
        severity: 'info',
        message: `State '${varName}' looks navigable but is not synced with URL query params.`,
        source_principle: 'Navigable state should be URL-addressable',
        category: 'ux',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'regex.stateNotInUrl',
          query: { file: file.path },
          result: { variable: varName, line: i + 1 },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
