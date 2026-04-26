import { describe, it, expect, vi } from 'vitest';
import { shotgunSurgeryRule } from './shotgun-surgery.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
const mockedExec = vi.mocked(execSync);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/user.service.ts', tags: ['is_typescript'] };

describe('arch/shotgun-surgery-candidate', () => {
  it('detects file that co-changes with many others', async () => {
    const gitLog = [
      'abc1234abc1234abc1234abc1234abc1234abc12',
      'src/app/user.service.ts',
      'src/app/user.model.ts',
      'src/app/user.component.ts',
      '',
      'def5678def5678def5678def5678def5678def56',
      'src/app/user.service.ts',
      'src/app/user.model.ts',
      'src/app/user.api.ts',
      '',
      'aaa0000bbb1111ccc2222ddd3333eee4444fff55',
      'src/app/user.service.ts',
      'src/app/user.component.ts',
      'src/app/user.api.ts',
      'src/app/user.store.ts',
      '',
    ].join('\n');

    mockedExec.mockReturnValue(Buffer.from(gitLog));

    const findings = await shotgunSurgeryRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toContain('co-changes');
  });

  it('ignores file with few co-changes', async () => {
    mockedExec.mockReturnValue(Buffer.from('abc1234\nsrc/app/user.service.ts\n\n'));

    const findings = await shotgunSurgeryRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('returns empty when git fails', async () => {
    mockedExec.mockImplementation(() => { throw new Error('not a git repo'); });

    const findings = await shotgunSurgeryRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
