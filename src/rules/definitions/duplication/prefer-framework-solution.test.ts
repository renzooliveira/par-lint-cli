import { describe, it, expect, vi } from 'vitest';
import { preferFrameworkSolutionRule } from './prefer-framework-solution.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/data.service.ts', tags: ['is_typescript'] };

describe('duplication/prefer-framework-solution', () => {
  it('detects fetch() usage', async () => {
    mockedRead.mockResolvedValue(`
class DataService {
  getData() {
    return fetch('/api/data').then(r => r.json());
  }
}
`);
    const findings = await preferFrameworkSolutionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('HttpClient');
  });

  it('detects document.getElementById', async () => {
    mockedRead.mockResolvedValue(`
const el = document.getElementById('myEl');
`);
    const findings = await preferFrameworkSolutionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('ViewChild');
  });

  it('detects window.location navigation', async () => {
    mockedRead.mockResolvedValue(`
window.location.href = '/login';
`);
    const findings = await preferFrameworkSolutionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('Router');
  });

  it('ignores framework-native code', async () => {
    mockedRead.mockResolvedValue(`
class DataService {
  constructor(private http: HttpClient) {}
  getData() {
    return this.http.get('/api/data');
  }
}
`);
    const findings = await preferFrameworkSolutionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores comments', async () => {
    mockedRead.mockResolvedValue(`
// fetch('/api/old-endpoint')
* document.getElementById('old')
`);
    const findings = await preferFrameworkSolutionRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
