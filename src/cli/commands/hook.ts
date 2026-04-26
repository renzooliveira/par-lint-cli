import { Command } from 'commander';
import path from 'node:path';
import { writeFile, chmod, stat } from 'node:fs/promises';
import chalk from 'chalk';

export function generateHookScript(): string {
  return `#!/bin/sh
# par-lint pre-commit hook
# Installed by: par-lint hook install

npx par-lint review --incremental --severity error --dry-run 2>/dev/null
status=$?

if [ $status -ne 0 ]; then
  echo ""
  echo "par-lint: commit blocked — error-level findings detected."
  echo "Run 'par-lint review' for details."
  exit 1
fi
`;
}

const installAction = new Command('install')
  .description('Install git pre-commit hook')
  .option('--target <path>', 'Target project directory')
  .option('--force', 'Overwrite existing hook')
  .action(async (options: { target?: string; force?: boolean }) => {
    const cwd = options.target ? path.resolve(options.target) : process.cwd();
    const hookPath = path.resolve(cwd, '.git/hooks/pre-commit');

    try {
      const existing = await stat(hookPath).catch(() => null);
      if (existing && !options.force) {
        console.log(chalk.yellow(`\n  Pre-commit hook already exists at ${hookPath}`));
        console.log(chalk.dim('  Use --force to overwrite\n'));
        return;
      }

      await writeFile(hookPath, generateHookScript(), 'utf-8');
      await chmod(hookPath, 0o755);
      console.log(chalk.green(`\n  Pre-commit hook installed at ${hookPath}\n`));
    } catch (err) {
      console.error(chalk.red(`  Failed to install hook: ${err instanceof Error ? err.message : err}`));
      process.exitCode = 1;
    }
  });

const uninstallAction = new Command('uninstall')
  .description('Remove git pre-commit hook')
  .option('--target <path>', 'Target project directory')
  .action(async (options: { target?: string }) => {
    const cwd = options.target ? path.resolve(options.target) : process.cwd();
    const hookPath = path.resolve(cwd, '.git/hooks/pre-commit');

    try {
      const { unlink } = await import('node:fs/promises');
      await unlink(hookPath);
      console.log(chalk.green(`\n  Pre-commit hook removed from ${hookPath}\n`));
    } catch {
      console.log(chalk.yellow('\n  No pre-commit hook found.\n'));
    }
  });

export const hookCommand = new Command('hook')
  .description('Manage git hooks for par-lint')
  .addCommand(installAction)
  .addCommand(uninstallAction);
