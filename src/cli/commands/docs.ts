import { Command } from 'commander';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ALL_RULES } from '../../rules/registry.js';
import type { RuleDefinition } from '../../engine/runner.js';

export function generateRuleCatalog(rules: RuleDefinition[]): string {
  const lines: string[] = [];
  lines.push('# par-lint Rule Catalog');
  lines.push('');
  lines.push(`${rules.length} rules across ${new Set(rules.map((r) => r.category)).size} categories.`);
  lines.push('');

  const grouped: Record<string, RuleDefinition[]> = {};
  for (const rule of rules) {
    (grouped[rule.category] ??= []).push(rule);
  }

  for (const [category, catRules] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${category}`);
    lines.push('');
    lines.push('| Rule ID | Severity | Applicable To |');
    lines.push('|---------|----------|---------------|');
    for (const rule of catRules.sort((a, b) => a.id.localeCompare(b.id))) {
      const tags = rule.applicable_to.length > 0 ? rule.applicable_to.join(', ') : 'all';
      lines.push(`| ${rule.id} | ${rule.severity} | ${tags} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export const docsCommand = new Command('docs')
  .description('Generate rule catalog documentation')
  .option('--output <path>', 'Write to file instead of stdout')
  .action(async (options: { output?: string }) => {
    const markdown = generateRuleCatalog(ALL_RULES);

    if (options.output) {
      const outPath = path.resolve(options.output);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, markdown, 'utf-8');
      console.log(`Rule catalog written to ${options.output}`);
    } else {
      process.stdout.write(markdown);
    }
  });
