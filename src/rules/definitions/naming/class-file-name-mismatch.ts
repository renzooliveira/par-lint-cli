import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';
import path from 'node:path';

const EXEMPT_BASENAMES = new Set([
  'index.ts', 'main.ts', 'polyfills.ts',
  'environment.ts', 'environment.prod.ts', 'environment.development.ts',
]);

function kebabToPascal(kebab: string): string {
  return kebab
    .split('-')
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');
}

function expectedClassName(basename: string): string {
  const withoutTs = basename.replace(/\.ts$/, '');
  const parts = withoutTs.split('.');
  return parts.map(kebabToPascal).join('');
}

const CLASS_RE = /(?:export\s+)?(?:abstract\s+)?class\s+([A-Z]\w*)/g;

export const classFileNameMismatchRule: RuleDefinition = {
  id: 'naming/class-file-name-mismatch',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects when class name does not match filename (e.g. user-search.page.ts → UserSearchPage)',
  principle: 'Class and file names must be bidirectionally consistent for navigability',
  applicable_to: ['is_typescript'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.ts')) return [];
    if (file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (file.path.endsWith('.d.ts')) return [];

    const basename = path.basename(file.path);
    if (EXEMPT_BASENAMES.has(basename)) return [];

    const dotParts = basename.replace(/\.ts$/, '').split('.');
    if (dotParts.length < 2) return [];

    const expected = expectedClassName(basename);

    let source: string;
    try {
      source = await readSource(file.path, cwd);
    } catch {
      return [];
    }

    const classNames: { name: string; line: number }[] = [];
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      CLASS_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = CLASS_RE.exec(lines[i]!)) !== null) {
        classNames.push({ name: match[1]!, line: i + 1 });
      }
    }

    if (classNames.length === 0) return [];

    const hasMatch = classNames.some((c) => c.name === expected);
    if (hasMatch) return [];

    const primary = classNames[0]!;
    return [createFinding({
      rule_id: 'naming/class-file-name-mismatch',
      file: file.path,
      line: primary.line,
      severity: 'warning',
      message: `Class "${primary.name}" does not match filename. Expected "${expected}".`,
      source_principle: 'File and class names must correspond bidirectionally',
      category: 'naming',
      fix_complexity: 'M',
      evidence_trail: [{
        tool: 'regex.className',
        query: { file: file.path },
        result: { expected, actual: primary.name },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
