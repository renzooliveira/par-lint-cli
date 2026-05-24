import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';

const CLASS_DECL_RE = /^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/;

function fileNameToClassName(fileName: string): string {
  const suffixMatch = fileName.match(/\.([a-z][a-z-]*)\.(ts|js)$/);
  const suffix = suffixMatch?.[1] ?? '';
  const base = suffix ? fileName.replace(`.${suffix}.${suffixMatch![2]}`, '') : fileName.replace(/\.(ts|js)$/, '');
  const pascal = base.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  const pascalSuffix = suffix ? suffix.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') : '';
  return pascal + pascalSuffix;
}

export const fileClassMismatchRule: RuleDefinition = {
  id: 'naming/file-class-mismatch',
  version: '1.1.0',
  category: 'naming',
  severity: 'error',
  description: 'Detects mismatch between file name and exported class name',
  principle: 'File name and class name must be bidirectionally convertible for discoverability',
  applicable_to: ['is_typescript'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.ts') || file.path.endsWith('.spec.ts') || file.path.endsWith('.test.ts')) return [];
    if (file.path.endsWith('index.ts')) return [];

    const fileName = file.path.split('/').pop()!;
    const expectedClass = fileNameToClassName(fileName);
    if (!expectedClass) return [];

    const source = await readSource(file.path, cwd);
    const lines = source.split('\n');
    const findings: ReturnType<typeof createFinding>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = line.match(CLASS_DECL_RE);
      if (!match) continue;

      const actualClass = match[1]!;
      if (actualClass === expectedClass) continue;

      if (actualClass.toLowerCase() === expectedClass.toLowerCase()) continue;
      if (actualClass.endsWith(expectedClass)) continue;

      findings.push(createFinding({
        rule_id: 'naming/file-class-mismatch',
        file: file.path,
        line: i + 1,
        severity: 'error',
        message: `Class '${actualClass}' does not match file name '${fileName}'. Expected '${expectedClass}'.`,
        source_principle: 'File name and class name must be bidirectionally convertible',
        category: 'naming',
        fix_complexity: 'S',
        evidence_trail: [{
          tool: 'regex.fileClassMismatch',
          query: { file: file.path },
          result: { actual: actualClass, expected: expectedClass, fileName },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
