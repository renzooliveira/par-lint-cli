import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { Finding } from '../types/finding.js';

interface CacheEntry {
  hash: string;
  findings: Finding[];
}

interface CacheFile {
  version: string;
  entries: Record<string, CacheEntry>;
}

export class FileCache {
  private cachePath: string;
  private entries: Record<string, CacheEntry> = {};
  private version: string;

  constructor(cachePath: string, rulesVersion?: string) {
    this.cachePath = cachePath;
    this.version = rulesVersion ?? '1.0';
  }

  async load(): Promise<void> {
    try {
      const content = await readFile(this.cachePath, 'utf-8');
      const data = JSON.parse(content) as CacheFile;
      if (data.version !== this.version) {
        this.entries = {};
        return;
      }
      this.entries = data.entries ?? {};
    } catch {
      this.entries = {};
    }
  }

  lookup(filePath: string, hash: string): Finding[] | null {
    const entry = this.entries[filePath];
    if (!entry || entry.hash !== hash) return null;
    return entry.findings;
  }

  store(filePath: string, hash: string, findings: Finding[]): void {
    this.entries[filePath] = { hash, findings };
  }

  async save(): Promise<void> {
    const dir = path.dirname(this.cachePath);
    await mkdir(dir, { recursive: true });
    const data: CacheFile = { version: this.version, entries: this.entries };
    await writeFile(this.cachePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}
