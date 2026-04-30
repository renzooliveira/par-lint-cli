import { describe, it, expect, vi } from 'vitest';
import { crossAggregateDirectCallRule } from './cross-aggregate-direct-call.js';
import { parLintConfigSchema } from '../../../config/schema.js';
import type { CategorizedFile } from '../../../discovery/categorizer.js';

vi.mock('../../../adapters/ast-grep.js', () => ({
  readSource: vi.fn(),
}));

import { readSource } from '../../../adapters/ast-grep.js';
const mockedRead = vi.mocked(readSource);

const config = parLintConfigSchema.parse({ project: { name: 'test' } });

describe('arch/cross-aggregate-direct-call', () => {
  it('detects aggregate root calling another aggregate directly', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/order/order.aggregate.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { PaymentAggregate } from '../payment/payment.aggregate';

export class OrderAggregate {
  private payment: PaymentAggregate;

  confirm() {
    this.payment.processPayment(this.total);
  }
}
`);
    const findings = await crossAggregateDirectCallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('PaymentAggregate');
  });

  it('ignores non-aggregate files', async () => {
    const file: CategorizedFile = { path: 'src/app/services/order.service.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { PaymentService } from '../payment/payment.service';

export class OrderService {
  constructor(private payment: PaymentService) {}
  confirm() { this.payment.process(); }
}
`);
    const findings = await crossAggregateDirectCallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('ignores self-references within same aggregate', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/order/order.aggregate.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
export class OrderAggregate {
  private items: OrderItem[] = [];

  addItem(item: OrderItem) {
    this.items.push(item);
  }
}
`);
    const findings = await crossAggregateDirectCallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });

  it('detects via import of aggregate class', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/shipping/shipping.aggregate.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { InventoryAggregate } from '../inventory/inventory.aggregate';
import { OrderAggregate } from '../order/order.aggregate';

export class ShippingAggregate {
  ship(order: OrderAggregate, inventory: InventoryAggregate) {
    inventory.reserve(order.items);
    order.markShipped();
  }
}
`);
    const findings = await crossAggregateDirectCallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(2);
  });

  it('ignores spec/test files', async () => {
    const file: CategorizedFile = { path: 'src/app/domain/order/order.aggregate.spec.ts', tags: ['is_typescript'] };
    mockedRead.mockResolvedValue(`
import { PaymentAggregate } from '../payment/payment.aggregate';
const payment = new PaymentAggregate();
`);
    const findings = await crossAggregateDirectCallRule.run(file, config, '/tmp');
    expect(findings).toHaveLength(0);
  });
});
