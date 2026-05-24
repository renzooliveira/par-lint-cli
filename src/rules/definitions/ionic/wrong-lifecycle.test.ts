import { describe, it, expect, vi } from 'vitest';
import { wrongLifecycleRule } from './wrong-lifecycle.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/wrong-lifecycle', () => {
  it('detects data loading in ngOnInit on Ionic page', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class OrdersPage implements OnInit {
  ngOnInit() {
    this.http.get('/api/orders').subscribe(data => {
      this.orders = data;
    });
  }
}
`);
    const findings = await wrongLifecycleRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('ionViewWillEnter');
  });

  it('ignores ionViewWillEnter usage', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class OrdersPage {
  ionViewWillEnter() {
    this.http.get('/api/orders').subscribe(data => {
      this.orders = data;
    });
  }
}
`);
    const findings = await wrongLifecycleRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores ngOnInit without data loading', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class OrdersPage implements OnInit {
  ngOnInit() {
    this.title = 'Orders';
  }
}
`);
    const findings = await wrongLifecycleRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-page files', async () => {
    const file: CategorizedFile = { path: 'src/app/services/order.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class OrderService implements OnInit {
  ngOnInit() {
    this.http.get('/api').subscribe();
  }
}
`);
    const findings = await wrongLifecycleRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
