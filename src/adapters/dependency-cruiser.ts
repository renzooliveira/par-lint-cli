import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface ImportInfo {
  line: number;
  from: string;
  to: string;
  rawImport: string;
}

export async function extractImports(filePath: string, cwd: string): Promise<ImportInfo[]> {
  const absPath = path.resolve(cwd, filePath);
  const source = await readFile(absPath, 'utf-8');
  return parseImports(source, filePath);
}

const IMPORT_RE = /^import\s+(?:(?:type\s+)?(?:\{[^}]*\}|[\w*]+(?:\s*,\s*\{[^}]*\})?)\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/gm;

export function parseImports(source: string, filePath: string): ImportInfo[] {
  const lines = source.split('\n');
  const results: ImportInfo[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    IMPORT_RE.lastIndex = 0;
    const match = IMPORT_RE.exec(line);
    if (match) {
      results.push({
        line: i + 1,
        from: filePath,
        to: match[1]!,
        rawImport: line.trim(),
      });
    }
  }

  return results;
}

export interface CircularDependency {
  chain: string[];
  startLine: number;
}

export async function detectCircularImports(
  filePaths: string[],
  cwd: string,
): Promise<CircularDependency[]> {
  const graph = new Map<string, ImportInfo[]>();

  for (const fp of filePaths) {
    const imports = await extractImports(fp, cwd);
    graph.set(fp, imports);
  }

  const normalize = (from: string, to: string): string => {
    const dir = path.dirname(from);
    let resolved = path.normalize(path.join(dir, to));
    if (!resolved.endsWith('.ts')) resolved += '.ts';
    return resolved;
  };

  const cycles: CircularDependency[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(file: string, chain: string[], startLineMap: Map<string, number>): void {
    if (inStack.has(file)) {
      const cycleStart = chain.indexOf(file);
      if (cycleStart >= 0) {
        cycles.push({
          chain: [...chain.slice(cycleStart), file],
          startLine: startLineMap.get(file) ?? 1,
        });
      }
      return;
    }

    if (visited.has(file)) return;

    visited.add(file);
    inStack.add(file);

    const imports = graph.get(file) ?? [];
    for (const imp of imports) {
      const resolved = normalize(file, imp.to);
      if (graph.has(resolved)) {
        startLineMap.set(resolved, imp.line);
        dfs(resolved, [...chain, file], startLineMap);
      }
    }

    inStack.delete(file);
  }

  for (const file of filePaths) {
    visited.clear();
    inStack.clear();
    dfs(file, [], new Map());
  }

  return cycles;
}

export interface LayerViolation {
  file: string;
  line: number;
  importTarget: string;
  fromLayer: string;
  toLayer: string;
  rawImport: string;
}

const DEFAULT_LAYER_ORDER = ['core', 'shared', 'features', 'pages'];

export function resolveLayer(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/');
  for (const layer of DEFAULT_LAYER_ORDER) {
    if (normalized.includes(`/${layer}/`) || normalized.startsWith(`${layer}/`)) {
      return layer;
    }
  }
  return null;
}

export function checkLayerViolation(
  fromFile: string,
  importTarget: string,
  importLine: number,
  rawImport: string,
): LayerViolation | null {
  const fromLayer = resolveLayer(fromFile);
  const resolvedTarget = path.normalize(path.join(path.dirname(fromFile), importTarget));
  const toLayer = resolveLayer(resolvedTarget);

  if (!fromLayer || !toLayer) return null;

  const fromIdx = DEFAULT_LAYER_ORDER.indexOf(fromLayer);
  const toIdx = DEFAULT_LAYER_ORDER.indexOf(toLayer);

  if (fromIdx < toIdx) {
    return {
      file: fromFile,
      line: importLine,
      importTarget,
      fromLayer,
      toLayer,
      rawImport,
    };
  }

  return null;
}
