import type { RuleDefinition } from '../../../engine/runner.js';
import { createFinding } from '../../../engine/finding.js';
import path from 'node:path';

const RECOGNIZED_SUFFIXES = new Set([
  'component', 'service', 'page', 'pipe', 'guard', 'directive',
  'model', 'entity', 'api', 'port', 'adapter',
  'spec', 'test', 'mock', 'factory',
  'interceptor', 'resolver', 'store', 'modal', 'widget',
  'util', 'constant', 'enum', 'interface', 'type',
  'module', 'routes', 'config',
  'schema', 'loader', 'runner', 'scanner', 'cache', 'plugin',
  'registry', 'handler', 'helper', 'mapper', 'validator',
  'strategy', 'builder', 'command', 'formatter', 'parser',
  'transformer', 'converter', 'provider', 'gateway', 'repository',
  'listener', 'observer', 'emitter', 'middleware', 'filter',
  'serializer', 'deserializer', 'encoder', 'decoder',
]);

const EXEMPT_BASENAMES = new Set([
  'index.ts', 'main.ts', 'polyfills.ts',
  'environment.ts', 'environment.prod.ts', 'environment.development.ts',
  'setup-jest.ts', 'jest.config.ts', 'vitest.config.ts',
  'types.ts', 'constants.ts', 'defaults.ts', 'utils.ts', 'helpers.ts',
]);

function extractTypeSuffix(basename: string): string | null {
  const withoutExt = basename.replace(/\.ts$/, '');
  const parts = withoutExt.split('.');
  if (parts.length >= 2) {
    return parts[parts.length - 1]!;
  }
  return null;
}

export const missingTypeSuffixRule: RuleDefinition = {
  id: 'naming/missing-type-suffix',
  version: '1.0.0',
  category: 'naming',
  severity: 'warning',
  description: 'Detects .ts files without a recognized type suffix',
  principle: 'Type suffixes in filenames communicate purpose at a glance',
  applicable_to: ['is_typescript'],

  async run(file) {
    if (!file.path.endsWith('.ts')) return [];

    const basename = path.basename(file.path);

    if (EXEMPT_BASENAMES.has(basename)) return [];
    if (basename.endsWith('.d.ts')) return [];

    const suffix = extractTypeSuffix(basename);
    if (suffix && RECOGNIZED_SUFFIXES.has(suffix)) return [];

    return [createFinding({
      rule_id: 'naming/missing-type-suffix',
      file: file.path,
      line: 1,
      severity: 'warning',
      message: `File "${basename}" has no recognized type suffix (e.g. .component.ts, .service.ts)`,
      source_principle: 'File type suffix communicates purpose',
      category: 'naming',
      fix_complexity: 'S',
      evidence_trail: [{
        tool: 'regex',
        query: { pattern: 'type suffix', file: file.path },
        result: { basename, suffix: suffix ?? 'none' },
        timestamp: new Date().toISOString(),
        cache_hit: false,
      }],
    })];
  },
};
