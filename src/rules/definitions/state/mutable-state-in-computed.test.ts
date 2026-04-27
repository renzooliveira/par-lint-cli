import { describe, it, expect, vi } from 'vitest';
import { mutableStateInComputedRule } from './mutable-state-in-computed.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });
const file: CategorizedFile = { path: 'src/app/counter.component.ts', tags: ['is_typescript'] };

describe('state/mutable-state-in-computed', () => {
  it('detects .set() inside computed', async () => {
    mockedRead.mockResolvedValue(`
class Counter {
  count = signal(0);
  doubled = computed(() => {
    this.count.set(10);
    return this.count() * 2;
  });
}
`);
    const findings = await mutableStateInComputedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('.set(');
  });

  it('detects .update() inside computed', async () => {
    mockedRead.mockResolvedValue(`
class Counter {
  count = signal(0);
  doubled = computed(() => {
    this.count.update(v => v + 1);
    return this.count() * 2;
  });
}
`);
    const findings = await mutableStateInComputedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('detects array mutation inside computed', async () => {
    mockedRead.mockResolvedValue(`
class ListComponent {
  items = signal<string[]>([]);
  sorted = computed(() => {
    const list = this.items();
    list.push('new');
    list.sort();
    return list;
  });
}
`);
    const findings = await mutableStateInComputedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(2);
  });

  it('ignores mutations outside computed', async () => {
    mockedRead.mockResolvedValue(`
class Counter {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() {
    this.count.set(this.count() + 1);
    this.items.push('item');
  }
}
`);
    const findings = await mutableStateInComputedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores pure computed', async () => {
    mockedRead.mockResolvedValue(`
class Counter {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  tripled = computed(() => this.count() * 3);
}
`);
    const findings = await mutableStateInComputedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores spread-then-sort/reverse inside computed (copy is pure)', async () => {
    mockedRead.mockResolvedValue(`
class ListComponent {
  items = signal<Item[]>([]);
  sorted = computed(() => [...this.items()].sort((a, b) => a.name.localeCompare(b.name)));
  reversed = computed(() => [...this.items()].reverse());
}
`);
    const findings = await mutableStateInComputedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores local Map.set() inside computed (object construction)', async () => {
    mockedRead.mockResolvedValue(`
class TaskList {
  tasks = signal<Task[]>([]);
  taskMap = computed(() => {
    const map = new Map<string, Task>();
    for (const t of this.tasks()) map.set(t.id, t);
    return map;
  });
}
`);
    const findings = await mutableStateInComputedRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
