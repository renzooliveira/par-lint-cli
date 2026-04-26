import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface EslintResult {
  filePath: string;
  messages: EslintMessage[];
}

export interface EslintMessage {
  ruleId: string | null;
  severity: 1 | 2;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export async function runEslint(
  filePaths: string[],
  cwd: string,
  eslintBin?: string,
): Promise<EslintResult[]> {
  const bin = eslintBin ?? 'npx';
  const args = bin === 'npx'
    ? ['eslint', '--format', 'json', '--no-error-on-unmatched-pattern', ...filePaths]
    : ['--format', 'json', '--no-error-on-unmatched-pattern', ...filePaths];

  try {
    const { stdout } = await execFileAsync(bin, args, {
      cwd: path.resolve(cwd),
      timeout: 60_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    return JSON.parse(stdout) as EslintResult[];
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'stdout' in err) {
      const stdout = (err as { stdout: string }).stdout;
      if (stdout) {
        try {
          return JSON.parse(stdout) as EslintResult[];
        } catch {
          return [];
        }
      }
    }
    return [];
  }
}
