import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface FileChurn {
  filePath: string;
  commits: number;
  linesChanged: number;
}

export async function getFileChurn(
  filePath: string,
  cwd: string,
  since?: string,
): Promise<FileChurn> {
  const sinceArg = since ?? '6 months ago';

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '--follow', '--oneline', `--since=${sinceArg}`, '--', filePath],
      { cwd: path.resolve(cwd), timeout: 15_000 },
    );

    const commits = stdout.trim().split('\n').filter((l) => l.trim()).length;

    let linesChanged = 0;
    try {
      const { stdout: statOut } = await execFileAsync(
        'git',
        ['log', '--follow', '--numstat', `--since=${sinceArg}`, '--format=', '--', filePath],
        { cwd: path.resolve(cwd), timeout: 15_000 },
      );

      for (const line of statOut.trim().split('\n')) {
        const parts = line.trim().split('\t');
        if (parts.length >= 2) {
          const added = parseInt(parts[0]!, 10) || 0;
          const removed = parseInt(parts[1]!, 10) || 0;
          linesChanged += added + removed;
        }
      }
    } catch {
      // numstat optional
    }

    return { filePath, commits, linesChanged };
  } catch {
    return { filePath, commits: 0, linesChanged: 0 };
  }
}

export async function getHotFiles(
  cwd: string,
  limit: number = 20,
  since?: string,
): Promise<FileChurn[]> {
  const sinceArg = since ?? '6 months ago';

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '--name-only', '--format=', `--since=${sinceArg}`],
      { cwd: path.resolve(cwd), timeout: 30_000, maxBuffer: 5 * 1024 * 1024 },
    );

    const counts = new Map<string, number>();
    for (const line of stdout.split('\n')) {
      const file = line.trim();
      if (file) {
        counts.set(file, (counts.get(file) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([filePath, commits]) => ({ filePath, commits, linesChanged: 0 }));
  } catch {
    return [];
  }
}
