import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import YAML from 'yaml';

const DEFAULT_CONFIG = {
  schema_version: '1.0',
  project: {
    name: '',
    stack: 'angular-ionic',
  },
  realizations: {},
  layers: [],
  layer_rules: [],
  rules: {},
  suppression: {
    require_reason: true,
    min_reason_length: 20,
    reviewable: true,
  },
  output: {
    formats: ['json'],
    json_path: '.par-lint/findings.json',
    sarif_path: '.par-lint/findings.sarif',
    markdown_path: '.par-lint/report.md',
    state_path: '.par-lint/state.json',
  },
  performance: {
    cache_enabled: true,
    parallel_workers: 4,
    incremental: 'auto',
  },
};

export const initCommand = new Command('init')
  .description('Initialize par-lint configuration in current project')
  .option('--name <name>', 'Project name')
  .option('--stack <stack>', 'Project stack: angular, angular-ionic, react, dotnet', 'angular-ionic')
  .action(async (options: { name?: string; stack: string }) => {
    const cwd = process.cwd();
    const configPath = path.resolve(cwd, 'par-lint.config.yaml');
    const projectName = options.name ?? path.basename(cwd);

    const config = {
      ...DEFAULT_CONFIG,
      project: {
        name: projectName,
        stack: options.stack,
      },
    };

    const yamlContent = YAML.stringify(config, { indent: 2 });
    await writeFile(configPath, yamlContent, 'utf-8');

    console.log('');
    console.log(chalk.green('  ✔ Created par-lint.config.yaml'));
    console.log(chalk.dim(`    Project: ${projectName}`));
    console.log(chalk.dim(`    Stack: ${options.stack}`));
    console.log('');
    console.log('  Next steps:');
    console.log(chalk.dim('    1. Edit par-lint.config.yaml to configure layers and realizations'));
    console.log(chalk.dim('    2. Run: par-lint review'));
    console.log('');
  });
