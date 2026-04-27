import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

function extractAttrNames(attrs: string): string[] {
  const names: string[] = [];
  let i = 0;
  while (i < attrs.length) {
    while (i < attrs.length && /\s/.test(attrs[i]!)) i++;
    if (i >= attrs.length) break;

    let name = '';
    if ('[(*#'.includes(attrs[i]!)) {
      const start = i;
      i++;
      while (i < attrs.length && attrs[i] !== '=' && !/\s/.test(attrs[i]!)) i++;
      name = attrs.slice(start, i);
    } else if (/[a-zA-Z_]/.test(attrs[i]!)) {
      const start = i;
      while (i < attrs.length && /[\w.\-]/.test(attrs[i]!)) i++;
      name = attrs.slice(start, i);
    } else {
      i++;
      continue;
    }

    while (i < attrs.length && /\s/.test(attrs[i]!)) i++;
    if (i < attrs.length && attrs[i] === '=') {
      i++;
      while (i < attrs.length && /\s/.test(attrs[i]!)) i++;
      if (i < attrs.length && (attrs[i] === '"' || attrs[i] === "'")) {
        const quote = attrs[i]!;
        i++;
        while (i < attrs.length && attrs[i] !== quote) i++;
        if (i < attrs.length) i++;
      }
      names.push(name);
    } else {
      names.push(name);
    }
  }
  return names;
}

export const duplicateAttributeRule: RuleDefinition = {
  id: 'template/duplicate-attribute',
  version: '1.1.0',
  category: 'template',
  severity: 'error',
  description: 'Detects elements with duplicate attributes — second silently overwrites first',
  principle: 'Duplicate attributes cause silent bugs where last value wins',
  applicable_to: ['is_template', 'is_html'],

  async run(file, _config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const findings = [];

    for (const tagMatch of source.matchAll(TAG_RE)) {
      const attrs = tagMatch[2]!;
      const seen = new Map<string, number>();
      for (const name of extractAttrNames(attrs)) {
        const key = name.toLowerCase();
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }

      for (const [name, count] of seen) {
        if (count > 1) {
          const line = source.substring(0, tagMatch.index).split('\n').length;
          findings.push(createFinding({
            rule_id: 'template/duplicate-attribute',
            file: file.path,
            line,
            severity: 'error',
            message: `Element <${tagMatch[1]}> has duplicate attribute "${name}". Second value silently overwrites first.`,
            source_principle: 'Duplicate attributes cause silent overwrites',
            category: 'template',
            fix_complexity: 'S',
            evidence_trail: [{
              tool: 'regex',
              query: { pattern: 'duplicate-attr', file: file.path },
              result: { element: tagMatch[1], attribute: name, count },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      }
    }

    return findings;
  },
};
