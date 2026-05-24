import { Command } from 'commander';
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import type { RuleDefinition } from '../../engine/runner.js';
import type { ParLintConfig } from '../../types/config.js';
import { ALL_RULES } from '../../rules/registry.js';
import { loadConfig } from '../../config/loader.js';

export function generateClaudeMdSection(rules: RuleDefinition[], config: ParLintConfig): string {
  const active = rules.filter((r) => {
    const rc = config.rules[r.id];
    return !rc || rc.enabled !== false;
  });

  const lines: string[] = [];

  lines.push('## par-lint — Active Rules');
  lines.push('');
  lines.push('This project uses par-lint for deterministic code quality validation.');
  lines.push('Run `par-lint review` to scan. Below are the active rules.');
  lines.push('');

  if (active.length === 0) {
    lines.push('No active rules configured.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('| Rule | Severity | Description |');
  lines.push('|------|----------|-------------|');

  for (const rule of active.sort((a, b) => a.id.localeCompare(b.id))) {
    const desc = rule.description ?? rule.id;
    lines.push(`| ${rule.id} | ${rule.severity} | ${desc} |`);
  }

  lines.push('');

  const withPrinciple = active.filter((r) => r.principle);
  if (withPrinciple.length > 0) {
    lines.push('### Principles');
    lines.push('');
    for (const rule of withPrinciple.sort((a, b) => a.id.localeCompare(b.id))) {
      lines.push(`- **${rule.id}**: ${rule.principle}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export const initClaudeMdCommand = new Command('init-claude-md')
  .description('Generate CLAUDE.md section from active par-lint rules')
  .option('--target <path>', 'Target project directory')
  .option('--append', 'Append to existing CLAUDE.md')
  .action(async (options: { target?: string; append?: boolean }) => {
    const cwd = options.target ? path.resolve(options.target) : process.cwd();

    const { config } = await loadConfig(cwd);
    const section = generateClaudeMdSection(ALL_RULES, config);

    if (options.append) {
      const claudeMdPath = path.resolve(cwd, 'CLAUDE.md');
      let existing = '';
      try {
        await access(claudeMdPath);
        existing = await readFile(claudeMdPath, 'utf-8');
      } catch {
        // file doesn't exist, start fresh
      }

      const content = existing ? `${existing}\n${section}` : section;
      await writeFile(claudeMdPath, content, 'utf-8');
      console.log(chalk.green(`  ✔ CLAUDE.md updated at ${path.relative(cwd, claudeMdPath)}`));
    } else {
      process.stdout.write(section);
    }
  });
