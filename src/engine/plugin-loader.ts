import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RuleDefinition } from './runner.js';

function isRuleDefinition(obj: unknown): obj is RuleDefinition {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.version === 'string' &&
    typeof r.category === 'string' &&
    typeof r.severity === 'string' &&
    Array.isArray(r.applicable_to) &&
    typeof r.run === 'function'
  );
}

function extractRule(mod: Record<string, unknown>, filePath: string): RuleDefinition {
  if (isRuleDefinition(mod.default)) return mod.default;

  for (const key of Object.keys(mod)) {
    if (key === 'default') continue;
    if (isRuleDefinition(mod[key])) return mod[key];
  }

  throw new Error(
    `Custom rule "${filePath}" does not export a valid RuleDefinition (needs id, version, category, severity, applicable_to, run)`,
  );
}

export async function loadCustomRules(paths: string[], cwd: string): Promise<RuleDefinition[]> {
  const rules: RuleDefinition[] = [];

  for (const p of paths) {
    const absolute = resolve(cwd, p);
    const fileUrl = pathToFileURL(absolute).href;

    let mod: Record<string, unknown>;
    try {
      mod = await import(fileUrl) as Record<string, unknown>;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to load custom rule "${p}" (${absolute}): ${msg}`);
    }

    rules.push(extractRule(mod, p));
  }

  return rules;
}
