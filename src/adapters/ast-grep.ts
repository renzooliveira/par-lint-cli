import { Lang, parse } from '@ast-grep/napi';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface AstGrepMatch {
  text: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

function langFromExtension(ext: string): Lang | null {
  switch (ext) {
    case '.ts':
      return Lang.TypeScript;
    case '.html':
      return Lang.Html;
    case '.css':
    case '.scss':
      return Lang.Css;
    default:
      return null;
  }
}

export async function findPattern(
  filePath: string,
  pattern: string,
  cwd: string,
): Promise<AstGrepMatch[]> {
  const absPath = path.resolve(cwd, filePath);
  const ext = path.extname(filePath);
  const lang = langFromExtension(ext);

  if (!lang) return [];

  const source = await readFile(absPath, 'utf-8');
  const root = parse(lang, source).root();
  const nodes = root.findAll(pattern);

  return nodes.map((node) => {
    const range = node.range();
    return {
      text: node.text(),
      line: range.start.line + 1,
      column: range.start.column + 1,
      endLine: range.end.line + 1,
      endColumn: range.end.column + 1,
    };
  });
}

export async function countPattern(
  filePath: string,
  pattern: string,
  cwd: string,
): Promise<number> {
  const matches = await findPattern(filePath, pattern, cwd);
  return matches.length;
}

export async function readSource(filePath: string, cwd: string): Promise<string> {
  return readFile(path.resolve(cwd, filePath), 'utf-8');
}
