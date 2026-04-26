import { Command } from 'commander';
import chalk from 'chalk';
import { ALL_RULES } from '../../rules/registry.js';

const SEVERITY_COLORS: Record<string, (s: string) => string> = {
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
};

export const rulesCommand = new Command('rules')
  .description('List all available rules')
  .option('--category <cat>', 'Filter by category')
  .option('--json', 'Output as JSON')
  .action((options: { category?: string; json?: boolean }) => {
    let rules = ALL_RULES;

    if (options.category) {
      rules = rules.filter((r) => r.category === options.category);
    }

    if (options.json) {
      const data = rules.map((r) => ({
        id: r.id,
        category: r.category,
        severity: r.severity,
        version: r.version,
        applicable_to: r.applicable_to,
      }));
      process.stdout.write(JSON.stringify(data, null, 2));
      return;
    }

    console.log('');
    console.log(chalk.bold(`  par-lint rules (${rules.length})`));
    console.log('');

    const grouped: Record<string, typeof rules> = {};
    for (const rule of rules) {
      (grouped[rule.category] ??= []).push(rule);
    }

    for (const [category, catRules] of Object.entries(grouped).sort()) {
      console.log(chalk.bold.underline(`  ${category} (${catRules.length})`));
      for (const rule of catRules.sort((a, b) => a.id.localeCompare(b.id))) {
        const colorFn = SEVERITY_COLORS[rule.severity] ?? chalk.white;
        const severity = colorFn(rule.severity.padEnd(7));
        console.log(`    ${severity} ${rule.id}`);
      }
      console.log('');
    }
  });
