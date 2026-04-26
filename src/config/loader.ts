import { cosmiconfig } from 'cosmiconfig';
import { parLintConfigSchema } from './schema.js';
import { getStackDefaults } from './defaults.js';
import type { ParLintConfig } from '../types/config.js';

const MODULE_NAME = 'par-lint';

const explorer = cosmiconfig(MODULE_NAME, {
  searchPlaces: [
    'par-lint.config.yaml',
    'par-lint.config.yml',
    'par-lint.config.json',
    '.par-lint.yaml',
    '.par-lint.yml',
  ],
});

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key];
    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

export interface LoadConfigResult {
  config: ParLintConfig;
  filepath: string | null;
}

export async function loadConfig(searchFrom?: string): Promise<LoadConfigResult> {
  const result = await explorer.search(searchFrom);

  const rawConfig = result?.config ?? { project: { name: 'unknown' } };
  const filepath = result?.filepath ?? null;

  const stackDefaults = getStackDefaults(rawConfig?.project?.stack ?? 'angular');
  const merged = deepMerge(stackDefaults as Record<string, unknown>, rawConfig as Record<string, unknown>);

  const parsed = parLintConfigSchema.parse(merged);

  return {
    config: parsed as ParLintConfig,
    filepath,
  };
}
