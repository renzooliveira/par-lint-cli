import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const CLASS_SELECTOR_RE = /^\s*\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*[{,]/;

export const duplicateCssClassRule: RuleDefinition = {
  id: 'duplication/duplicate-css-class',
  version: '1.0.0',
  category: 'duplication',
  severity: 'warning',
  description: 'Detects same CSS class name defined in multiple SCSS files',
  principle: 'Duplicate CSS classes across files cause specificity wars and confusion',
  applicable_to: ['is_scss', 'is_style'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.scss')) return [];

    const absPath = path.resolve(cwd, file.path);
    const source = await readFile(absPath, 'utf-8');

    const myClasses = extractClasses(source);
    if (myClasses.size === 0) return [];

    const dir = path.dirname(absPath);
    const siblings = await findScssFiles(dir);
    const otherFiles = siblings.filter((f) => f !== absPath);

    const findings = [];

    for (const otherFile of otherFiles) {
      const otherSource = await readFile(otherFile, 'utf-8');
      const otherClasses = extractClasses(otherSource);

      for (const [className, line] of myClasses) {
        if (!otherClasses.has(className)) continue;

        findings.push(createFinding({
          rule_id: 'duplication/duplicate-css-class',
          file: file.path,
          line,
          severity: 'warning',
          message: `CSS class ".${className}" also defined in ${path.basename(otherFile)}`,
          source_principle: 'Duplicate CSS classes cause specificity conflicts',
          category: 'duplication',
          fix_complexity: 'M',
          evidence_trail: [{
            tool: 'filesystem',
            query: { className, file: file.path },
            result: { duplicateIn: path.basename(otherFile) },
            timestamp: new Date().toISOString(),
            cache_hit: false,
          }],
        }));
      }
    }

    return findings;
  },
};

function extractClasses(source: string): Map<string, number> {
  const classes = new Map<string, number>();
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
    const match = CLASS_SELECTOR_RE.exec(line);
    if (match) {
      const name = match[1]!;
      if (!classes.has(name)) classes.set(name, i + 1);
    }
  }
  return classes;
}

async function findScssFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries.filter((e) => e.endsWith('.scss')).map((e) => path.join(dir, e));
}
