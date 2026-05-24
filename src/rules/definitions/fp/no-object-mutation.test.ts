import { describe, it, expect, vi } from 'vitest';
import { noObjectMutationRule } from './no-object-mutation.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/order.service.ts', tags: ['is_typescript'] };

describe('functional/no-object-mutation', () => {
  it('detects direct property assignment', async () => {
    mockedRead.mockResolvedValue(`
function update(order: Order) {
  order.status = 'done';
  order.updatedAt = new Date();
}
`);
    const findings = await noObjectMutationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(2);
  });

  it('ignores this assignments', async () => {
    mockedRead.mockResolvedValue(`
class Service {
  process() {
    this.status = 'done';
  }
}
`);
    const findings = await noObjectMutationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores constructor assignments', async () => {
    mockedRead.mockResolvedValue(`
class Service {
  constructor(private http: HttpClient) {
    config.baseUrl = '/api';
  }
}
`);
    const findings = await noObjectMutationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores builder/factory files', async () => {
    const builderFile: CategorizedFile = { path: 'src/app/order.builder.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
function build(data: any) {
  data.id = uuid();
}
`);
    const findings = await noObjectMutationRule.run(builderFile, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores signal updates', async () => {
    mockedRead.mockResolvedValue(`
function update(store: Store) {
  store.count.set(10);
  store.items.update(v => [...v, item]);
}
`);
    const findings = await noObjectMutationRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
