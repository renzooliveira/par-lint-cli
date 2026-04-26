import { describe, it, expect, vi } from 'vitest';
import { createDebouncer } from './watch.js';

describe('createDebouncer', () => {
  it('calls fn after delay', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = createDebouncer(fn, 100);

    debounced('file.ts');
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(new Set(['file.ts']));

    vi.useRealTimers();
  });

  it('batches multiple calls within delay', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = createDebouncer(fn, 100);

    debounced('a.ts');
    debounced('b.ts');
    debounced('a.ts');

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(new Set(['a.ts', 'b.ts']));

    vi.useRealTimers();
  });

  it('resets timer on each call', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = createDebouncer(fn, 100);

    debounced('a.ts');
    await vi.advanceTimersByTimeAsync(80);
    debounced('b.ts');
    await vi.advanceTimersByTimeAsync(80);
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(20);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
