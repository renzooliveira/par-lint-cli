import type { RuleDefinition } from '../../../engine/runner.js';
import { readSource } from '../../../adapters/ast-grep.js';
import { createFinding } from '../../../engine/finding.js';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9-]*)/g;
const TEMPLATE_EXT_RE = /\.(?:page|component)\.html$/;

function extractDomSkeleton(html: string): string[] {
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(TAG_RE.source, 'g');
  while ((match = re.exec(html)) !== null) {
    tags.push(match[1]!.toLowerCase());
  }
  return tags;
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const bigramsA = toBigrams(a);
  const bigramsB = toBigrams(b);

  if (bigramsA.size === 0 && bigramsB.size === 0) return 1;

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

function toBigrams(tags: string[]): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < tags.length - 1; i++) {
    set.add(`${tags[i]}|${tags[i + 1]}`);
  }
  return set;
}

async function findSiblingTemplates(filePath: string, cwd: string): Promise<{ name: string; absPath: string }[]> {
  const absPath = path.resolve(cwd, filePath);
  const dir = path.dirname(absPath);
  const parentDir = path.dirname(dir);
  const results: { name: string; absPath: string }[] = [];

  try {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const entryStr = typeof entry === 'string' ? entry : (entry as any).name ?? String(entry);
      const full = path.join(dir, entryStr);
      if (full === absPath) continue;
      if (TEMPLATE_EXT_RE.test(entryStr)) {
        results.push({ name: entryStr, absPath: full });
      }
    }
  } catch { /* dir not readable */ }

  try {
    const parentEntries = await readdir(parentDir);
    for (const entry of parentEntries) {
      const entryName = typeof entry === 'string' ? entry : (entry as any).name ?? String(entry);
      const sibDir = path.join(parentDir, entryName);
      if (sibDir === dir) continue;
      try {
        const sibStat = await stat(sibDir);
        if (!sibStat.isDirectory()) continue;
      } catch { continue; }
      try {
        const sibFiles = await readdir(sibDir);
        for (const sf of sibFiles) {
          const sfStr = typeof sf === 'string' ? sf : (sf as any).name ?? String(sf);
          if (TEMPLATE_EXT_RE.test(sfStr)) {
            results.push({ name: `${entryName}/${sfStr}`, absPath: path.join(sibDir, sfStr) });
          }
        }
      } catch { /* sibling dir not readable */ }
    }
  } catch { /* parent dir not readable */ }

  return results;
}

export const similarComponentRule: RuleDefinition = {
  id: 'duplication/similar-component',
  version: '1.0.0',
  category: 'duplication',
  severity: 'info',
  description: 'Detects Angular components with >70% similar template DOM structure',
  principle: 'Similar components should be consolidated or share a common base',
  applicable_to: ['is_template'],

  async run(file, config, cwd) {
    if (!TEMPLATE_EXT_RE.test(file.path)) return [];
    if (file.path.includes('.spec.') || file.path.includes('.test.')) return [];

    const opts = config.rules['duplication/similar-component'] as { similarity_threshold?: number } | undefined;
    const threshold = opts?.similarity_threshold ?? 0.70;

    const source = await readSource(file.path, cwd);
    const mySkeleton = extractDomSkeleton(source);
    if (mySkeleton.length < 4) return [];

    const siblings = await findSiblingTemplates(file.path, cwd);
    const findings: ReturnType<typeof createFinding>[] = [];

    for (const sibling of siblings) {
      try {
        const sibSource = await readFile(sibling.absPath, 'utf-8');
        const sibSkeleton = extractDomSkeleton(sibSource);
        if (sibSkeleton.length < 4) continue;

        const similarity = jaccardSimilarity(mySkeleton, sibSkeleton);
        if (similarity >= threshold) {
          const pct = Math.round(similarity * 100);
          findings.push(createFinding({
            rule_id: 'duplication/similar-component',
            file: file.path,
            line: 1,
            severity: 'info',
            message: `Template is ${pct}% similar to ${sibling.name}. Consider extracting a shared component.`,
            source_principle: 'Similar components should be consolidated or share a common base',
            category: 'duplication',
            fix_complexity: 'L',
            evidence_trail: [{
              tool: 'fingerprint.domSkeleton',
              query: { file: file.path, compared: sibling.name },
              result: { similarity: pct, threshold: Math.round(threshold * 100) },
              timestamp: new Date().toISOString(),
              cache_hit: false,
            }],
          }));
        }
      } catch { /* file not readable */ }
    }

    return findings;
  },
};
