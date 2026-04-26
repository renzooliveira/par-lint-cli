import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface FileMetrics {
  lineCount: number;
  functionCount: number;
  maxCyclomaticComplexity: number;
  maxFunctionLines: number;
  parameterCountMax: number;
  exportCount: number;
}

export interface FunctionMetric {
  name: string;
  line: number;
  lineCount: number;
  cyclomaticComplexity: number;
  parameterCount: number;
}

const FUNCTION_START_RE = /^\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(\w+)\s*\([^)]*\)\s*(?::\s*\S+\s*)?\{|(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)/;
const CLASS_METHOD_RE = /^\s*(?:private\s+|protected\s+|public\s+|static\s+|async\s+|readonly\s+)*(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{/;
const PARAMS_RE = /\(([^)]*)\)/;

const BRANCHING_RE = /\b(if|else\s+if|for|while|do|switch|case|\?\?|catch)\b|\?\s*[^:]+\s*:/g;

export async function analyzeFile(filePath: string, cwd: string): Promise<FileMetrics> {
  const source = await readFile(path.resolve(cwd, filePath), 'utf-8');
  return analyzeSource(source);
}

export function analyzeSource(source: string): FileMetrics {
  const lines = source.split('\n');
  const functions = extractFunctions(source);

  return {
    lineCount: lines.length,
    functionCount: functions.length,
    maxCyclomaticComplexity: functions.length > 0
      ? Math.max(...functions.map((f) => f.cyclomaticComplexity))
      : 0,
    maxFunctionLines: functions.length > 0
      ? Math.max(...functions.map((f) => f.lineCount))
      : 0,
    parameterCountMax: functions.length > 0
      ? Math.max(...functions.map((f) => f.parameterCount))
      : 0,
    exportCount: (source.match(/\bexport\b/g) ?? []).length,
  };
}

export function extractFunctions(source: string): FunctionMetric[] {
  const lines = source.split('\n');
  const results: FunctionMetric[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const funcMatch = FUNCTION_START_RE.exec(line) ?? CLASS_METHOD_RE.exec(line);

    if (funcMatch) {
      const name = funcMatch[1] ?? funcMatch[2] ?? funcMatch[3] ?? 'anonymous';
      const startLine = i;

      const paramsMatch = PARAMS_RE.exec(line);
      const params = paramsMatch?.[1]?.trim();
      const parameterCount = params ? params.split(',').filter((p) => p.trim()).length : 0;

      let braceDepth = 0;
      let endLine = i;
      let complexity = 1;

      for (let j = i; j < lines.length; j++) {
        const l = lines[j]!;
        braceDepth += (l.match(/{/g) ?? []).length;
        braceDepth -= (l.match(/}/g) ?? []).length;

        BRANCHING_RE.lastIndex = 0;
        while (BRANCHING_RE.exec(l) !== null) {
          complexity++;
        }

        if (braceDepth <= 0 && j > i) {
          endLine = j;
          break;
        }
        endLine = j;
      }

      results.push({
        name,
        line: startLine + 1,
        lineCount: endLine - startLine + 1,
        cyclomaticComplexity: complexity,
        parameterCount,
      });

      i = endLine + 1;
    } else {
      i++;
    }
  }

  return results;
}
