import { describe, it, expect, vi } from 'vitest';
import { missingLoadingControllerRule } from './missing-loading-controller.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('ionic/missing-loading-controller', () => {
  it('detects HTTP call without loading in page', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class OrdersPage {
  load() {
    this.http.get('/api/orders').subscribe();
  }
}
`);
    const findings = await missingLoadingControllerRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
  });

  it('ignores page with LoadingController', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class OrdersPage {
  constructor(private loadingController: LoadingController) {}
  async load() {
    const loading = await this.loadingController.create();
    await loading.present();
    this.http.get('/api/orders').subscribe();
  }
}
`);
    const findings = await missingLoadingControllerRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores page with isLoading flag', async () => {
    const file: CategorizedFile = { path: 'src/app/pages/orders/orders.page.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class OrdersPage {
  isLoading = false;
  load() {
    this.isLoading = true;
    this.http.get('/api/orders').subscribe();
  }
}
`);
    const findings = await missingLoadingControllerRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores non-page files', async () => {
    const file: CategorizedFile = { path: 'src/app/services/order.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
class OrderService {
  load() {
    this.http.get('/api/orders').subscribe();
  }
}
`);
    const findings = await missingLoadingControllerRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
