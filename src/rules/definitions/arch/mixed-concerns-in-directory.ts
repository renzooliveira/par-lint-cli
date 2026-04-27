import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const TYPE_SUFFIX_RE = /\.(component|service|entity|model|api|guard|interceptor|resolver|pipe|directive|module|store|facade|mapper|dto|interface|enum|page|controller)\./i;

export const mixedConcernsInDirectoryRule: RuleDefinition = {
  id: 'arch/mixed-concerns-in-directory',
  version: '1.0.0',
  category: 'arch',
  severity: 'info',
  description: 'Detects directories mixing too many artifact types',
  principle: 'Directories should have cohesive contents — many different artifact types indicate poor organization',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];

    const opts = config.rules['arch/mixed-concerns-in-directory'] as { max_types?: number } | undefined;
    const maxTypes = opts?.max_types ?? 3;

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');

    const dir = file.path.split('/').slice(0, -1).join('/');
    const dirName = dir.split('/').pop() ?? '';

    if (['shared', 'core', 'common', 'utils', 'helpers'].includes(dirName)) return [];

    const importedPaths: string[] = [];
    for (const line of lines) {
      const match = line.match(/^import\s+.*from\s+['"]\.\/([^'"]+)['"]/);
      if (match) importedPaths.push(match[1]!);
    }

    const myMatch = file.path.match(TYPE_SUFFIX_RE);
    const typesInDir = new Set<string>();
    if (myMatch) typesInDir.add(myMatch[1]!.toLowerCase());

    for (const p of importedPaths) {
      const m = p.match(TYPE_SUFFIX_RE) ?? p.match(/\.(\w+)$/);
      if (m) {
        const suffix = m[1]!.toLowerCase();
        if (['component', 'service', 'entity', 'model', 'api', 'guard', 'interceptor', 'resolver', 'pipe', 'directive', 'module', 'store', 'facade', 'mapper', 'dto', 'interface', 'enum', 'page', 'controller'].includes(suffix)) {
          typesInDir.add(suffix);
        }
      }
    }

    if (typesInDir.size <= maxTypes) return [];

    return [createFinding({
      rule_id: 'arch/mixed-concerns-in-directory',
      file: file.path,
      line: 1,
      severity: 'info',
      message: `Directory '${dirName}' has ${typesInDir.size} different artifact types (${[...typesInDir].join(', ')}). Consider reorganizing.`,
      source_principle: 'Directories should have cohesive contents',
      category: 'arch',
      fix_complexity: 'L',
      evidence_trail: [{
        tool: 'regex.mixedConcerns',
        query: { file: file.path },
        result: { directory: dirName, types: [...typesInDir] },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
