import { describe, it, expect, vi } from 'vitest';
import { getChangedFiles } from './scanner.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';

describe('getChangedFiles', () => {
  const mockedExec = vi.mocked(execSync);

  it('returns only files matching include patterns', () => {
    mockedExec.mockReturnValue(Buffer.from(
      'src/app/home.ts\nsrc/app/home.html\nREADME.md\npackage.json\n',
    ));

    const files = getChangedFiles('/fake');
    expect(files).toContain('src/app/home.ts');
    expect(files).toContain('src/app/home.html');
    expect(files).not.toContain('README.md');
    expect(files).not.toContain('package.json');
  });

  it('excludes node_modules and test files', () => {
    mockedExec.mockReturnValue(Buffer.from(
      'node_modules/pkg/index.ts\nsrc/app/home.spec.ts\nsrc/app/home.test.ts\nsrc/app/real.ts\n',
    ));

    const files = getChangedFiles('/fake');
    expect(files).toEqual(['src/app/real.ts']);
  });

  it('returns empty array when git diff fails', () => {
    mockedExec.mockImplementation(() => { throw new Error('not a git repo'); });

    const files = getChangedFiles('/fake');
    expect(files).toEqual([]);
  });

  it('accepts custom base ref', () => {
    mockedExec.mockReturnValue(Buffer.from('src/x.ts\n'));

    getChangedFiles('/fake', 'origin/main');
    expect(mockedExec).toHaveBeenCalledWith(
      'git diff --name-only origin/main',
      expect.objectContaining({ cwd: '/fake' }),
    );
  });

  it('strips empty lines', () => {
    mockedExec.mockReturnValue(Buffer.from('\nsrc/a.ts\n\n'));

    const files = getChangedFiles('/fake');
    expect(files).toEqual(['src/a.ts']);
  });
});
