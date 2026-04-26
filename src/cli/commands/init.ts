import { Command } from 'commander';
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import YAML from 'yaml';

interface DetectedStack {
  stack: string;
  evidence: string;
}

async function detectStack(cwd: string): Promise<DetectedStack> {
  try {
    const pkgPath = path.resolve(cwd, 'package.json');
    const raw = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['@ionic/angular']) return { stack: 'angular-ionic', evidence: '@ionic/angular in package.json' };
    if (deps['@angular/core']) return { stack: 'angular', evidence: '@angular/core in package.json' };
    if (deps['react']) return { stack: 'react', evidence: 'react in package.json' };
  } catch {
    // no package.json
  }

  try {
    const csprojFiles = await import('node:fs').then((fs) =>
      fs.readdirSync(cwd).filter((f: string) => f.endsWith('.csproj')),
    );
    if (csprojFiles.length > 0) return { stack: 'dotnet', evidence: '.csproj found' };
  } catch {
    // no csproj
  }

  return { stack: 'angular', evidence: 'default' };
}

function buildConfig(projectName: string, stack: string) {
  const config: Record<string, unknown> = {
    schema_version: '1.0',
    project: { name: projectName, stack },
    rules: {} as Record<string, unknown>,
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

  if (stack === 'angular-ionic' || stack === 'angular') {
    (config.rules as Record<string, unknown>)['scss/hardcoded-color'] = {
      enabled: true,
      exclude: ['**/variables.scss', '**/theme/**'],
    };
    (config.rules as Record<string, unknown>)['scss/hardcoded-spacing'] = {
      enabled: true,
      exclude: ['**/variables.scss', '**/theme/**'],
    };
    (config.rules as Record<string, unknown>)['scss/deep-nesting'] = {
      enabled: true,
      exclude: ['**/variables.scss', '**/theme/**'],
    };
  }

  return config;
}

export const initCommand = new Command('init')
  .description('Initialize par-lint configuration in current project')
  .option('--name <name>', 'Project name')
  .option('--stack <stack>', 'Project stack: angular, angular-ionic, react, dotnet')
  .option('--target <path>', 'Target project directory')
  .option('--force', 'Overwrite existing config')
  .action(async (options: { name?: string; stack?: string; target?: string; force?: boolean }) => {
    const cwd = options.target ? path.resolve(options.target) : process.cwd();
    const configPath = path.resolve(cwd, 'par-lint.config.yaml');

    if (!options.force) {
      try {
        await access(configPath);
        console.log(chalk.yellow(`  ⚠ par-lint.config.yaml already exists. Use --force to overwrite.`));
        return;
      } catch {
        // file doesn't exist, proceed
      }
    }

    const detected = await detectStack(cwd);
    const stack = options.stack ?? detected.stack;
    const projectName = options.name ?? path.basename(cwd);

    const config = buildConfig(projectName, stack);
    const yamlContent = YAML.stringify(config, { indent: 2 });
    await writeFile(configPath, yamlContent, 'utf-8');

    console.log('');
    console.log(chalk.green('  ✔ Created par-lint.config.yaml'));
    console.log(chalk.dim(`    Project: ${projectName}`));
    console.log(chalk.dim(`    Stack: ${stack} (${options.stack ? 'manual' : `detected: ${detected.evidence}`})`));
    if (Object.keys(config.rules as object).length > 0) {
      console.log(chalk.dim(`    Pre-configured: ${Object.keys(config.rules as object).length} rule overrides`));
    }
    console.log('');
    console.log('  Next steps:');
    console.log(chalk.dim('    1. Review par-lint.config.yaml'));
    console.log(chalk.dim('    2. Run: par-lint review'));
    console.log('');
  });
