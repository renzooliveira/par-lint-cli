import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const NESTING_MARKERS_RE = /(@if\s*\(|@for\s*\(|@switch\s*\(|\*ngIf\s*=|\*ngFor\s*=|\*ngSwitch\s*=)/gi;

export const deeplyNestedConditionalsRule: RuleDefinition = {
  id: 'template/deeply-nested-conditionals',
  version: '1.0.0',
  category: 'template',
  severity: 'warning',
  description: 'Detects 3+ levels of nested @if/@for/*ngIf/*ngFor in templates',
  principle: 'Deeply nested control flow makes templates hard to read and causes DOM recreation',
  applicable_to: ['is_template', 'is_html'],

  async run(file, config, cwd) {
    if (!file.path.endsWith('.html')) return [];

    const opts = config.rules['template/deeply-nested-conditionals']?.options as {
      maxDepth?: number;
    } | undefined;
    const maxDepth = opts?.maxDepth ?? 3;

    const source = await readFile(path.resolve(cwd, file.path), 'utf-8');
    const lines = source.split('\n');
    const findings = [];
    let depth = 0;
    let maxFound = 0;
    let maxLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      if (NESTING_MARKERS_RE.test(line)) {
        depth++;
        if (depth >= maxDepth && depth > maxFound) {
          maxFound = depth;
          maxLine = i + 1;
        }
      }

      if (line.includes('}') && /@(if|for|switch)/.test(lines.slice(0, i + 1).reverse().find(l => NESTING_MARKERS_RE.test(l)) ?? '')) {
        // handled by closing brace tracking below
      }

      NESTING_MARKERS_RE.lastIndex = 0;
    }

    // Simpler approach: track depth via brace/directive nesting
    depth = 0;
    maxFound = 0;
    maxLine = 0;
    const depthStack: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      NESTING_MARKERS_RE.lastIndex = 0;

      if (NESTING_MARKERS_RE.test(line)) {
        depthStack.push(i);
        if (depthStack.length >= maxDepth && depthStack.length > maxFound) {
          maxFound = depthStack.length;
          maxLine = i + 1;
        }
      }

      NESTING_MARKERS_RE.lastIndex = 0;

      const opens = (line.match(/\{/g) ?? []).length;
      const closes = (line.match(/\}/g) ?? []).length;
      const netCloses = closes - opens;

      if (netCloses > 0) {
        for (let c = 0; c < netCloses && depthStack.length > 0; c++) {
          depthStack.pop();
        }
      }
    }

    if (maxFound >= maxDepth) {
      findings.push(createFinding({
        rule_id: 'template/deeply-nested-conditionals',
        file: file.path,
        line: maxLine,
        severity: 'warning',
        message: `Template has ${maxFound} levels of nested control flow (max: ${maxDepth}). Extract sub-components.`,
        source_principle: 'Deeply nested control flow reduces readability and performance',
        category: 'template',
        fix_complexity: 'M',
        evidence_trail: [{
          tool: 'parser',
          query: { pattern: 'nesting-depth', file: file.path },
          result: { maxDepth: maxFound, threshold: maxDepth },
          timestamp: new Date().toISOString(),
          cache_hit: false,
        }],
      }));
    }

    return findings;
  },
};
