import { describe, it, expect, vi } from 'vitest';
import { deadAbstractionRule } from './dead-abstraction.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
import { execSync } from 'node:child_process';

const mockedRead = vi.mocked(readSource);
const mockedExec = vi.mocked(execSync);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/domain/user.model.ts', tags: ['is_typescript'] };

describe('arch/dead-abstraction', () => {
  it('detects exported interface with zero consumers', async () => {
    mockedRead.mockResolvedValue(`
export interface UserProfile {
  name: string;
  email: string;
}

export class User {
  name: string = '';
}
`);
    mockedExec.mockReturnValue(Buffer.from('src/domain/user.model.ts\n'));

    const findings = await deadAbstractionRule.run(file, config, '/tmp');
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toContain('UserProfile');
  });

  it('ignores interface used in other files', async () => {
    mockedRead.mockResolvedValue(`
export interface UserProfile {
  name: string;
}
`);
    mockedExec.mockReturnValue(Buffer.from('src/domain/user.model.ts\nsrc/app/profile.ts\n'));

    const findings = await deadAbstractionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-exported interfaces', async () => {
    mockedRead.mockResolvedValue(`
interface InternalData {
  value: number;
}
`);
    mockedExec.mockReturnValue(Buffer.from(''));

    const findings = await deadAbstractionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
