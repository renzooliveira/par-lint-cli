import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Finding } from '../types/finding.js';

interface BaselineFile {
  version: string;
  created: string;
  finding_ids: string[];
}

export async function loadBaseline(baselinePath: string): Promise<Set<string>> {
  try {
    const content = await readFile(baselinePath, 'utf-8');
    const data = JSON.parse(content) as BaselineFile;
    return new Set(data.finding_ids ?? []);
  } catch {
    return new Set();
  }
}

export async function saveBaseline(baselinePath: string, findings: Finding[]): Promise<void> {
  const dir = path.dirname(baselinePath);
  await mkdir(dir, { recursive: true });

  const data: BaselineFile = {
    version: '1.0',
    created: new Date().toISOString(),
    finding_ids: findings.map((f) => f.finding_id),
  };

  await writeFile(baselinePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function filterByBaseline(findings: Finding[], baseline: Set<string>): Finding[] {
  if (baseline.size === 0) return findings;
  return findings.filter((f) => !baseline.has(f.finding_id));
}
