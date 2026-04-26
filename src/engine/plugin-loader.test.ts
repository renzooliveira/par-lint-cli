import { describe, it, expect, beforeAll } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadCustomRules } from './plugin-loader.js';
import type { RuleDefinition } from './runner.js';

const FIXTURE_DIR = join(tmpdir(), 'par-lint-plugin-test-' + Date.now());

beforeAll(async () => {
  await mkdir(FIXTURE_DIR, { recursive: true });

  await writeFile(
    join(FIXTURE_DIR, 'valid-rule.mjs'),
    `export default {
      id: 'custom/valid',
      version: '1.0.0',
      category: 'custom',
      severity: 'warning',
      applicable_to: ['is_typescript'],
      run: async () => [],
    };`,
  );

  await writeFile(
    join(FIXTURE_DIR, 'named-export-rule.mjs'),
    `export const myRule = {
      id: 'custom/named',
      version: '1.0.0',
      category: 'custom',
      severity: 'info',
      applicable_to: [],
      run: async () => [],
    };`,
  );

  await writeFile(
    join(FIXTURE_DIR, 'invalid-rule.mjs'),
    `export default { id: 'bad', version: '1.0.0' };`,
  );

  return async () => {
    await rm(FIXTURE_DIR, { recursive: true, force: true });
  };
});

describe('loadCustomRules', () => {
  it('loads valid default export', async () => {
    const rules = await loadCustomRules(['valid-rule.mjs'], FIXTURE_DIR);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.id).toBe('custom/valid');
    expect(rules[0]!.severity).toBe('warning');
  });

  it('loads named export when no default', async () => {
    const rules = await loadCustomRules(['named-export-rule.mjs'], FIXTURE_DIR);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.id).toBe('custom/named');
  });

  it('throws on invalid export (missing run)', async () => {
    await expect(
      loadCustomRules(['invalid-rule.mjs'], FIXTURE_DIR),
    ).rejects.toThrow(/invalid-rule\.mjs/);
  });

  it('throws on non-existent file', async () => {
    await expect(
      loadCustomRules(['nope.mjs'], FIXTURE_DIR),
    ).rejects.toThrow(/nope\.mjs/);
  });

  it('loads multiple paths', async () => {
    const rules = await loadCustomRules(
      ['valid-rule.mjs', 'named-export-rule.mjs'],
      FIXTURE_DIR,
    );
    expect(rules).toHaveLength(2);
    expect(rules.map((r: RuleDefinition) => r.id)).toContain('custom/valid');
    expect(rules.map((r: RuleDefinition) => r.id)).toContain('custom/named');
  });

  it('returns empty array for empty paths', async () => {
    const rules = await loadCustomRules([], FIXTURE_DIR);
    expect(rules).toEqual([]);
  });
});
