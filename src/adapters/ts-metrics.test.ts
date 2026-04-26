import { describe, it, expect } from 'vitest';
import { analyzeSource, extractFunctions } from './ts-metrics.js';

describe('ts-metrics', () => {
  it('counts functions and metrics', () => {
    const source = `
export function add(a: number, b: number): number {
  return a + b;
}

export function complexFn(x: number): number {
  if (x > 10) {
    for (let i = 0; i < x; i++) {
      if (i % 2 === 0) {
        return i;
      }
    }
  } else if (x < 0) {
    return -x;
  }
  return x;
}
`;

    const metrics = analyzeSource(source);
    expect(metrics.functionCount).toBe(2);
    expect(metrics.maxCyclomaticComplexity).toBeGreaterThanOrEqual(4);
    expect(metrics.lineCount).toBeGreaterThan(0);
  });

  it('extracts function details', () => {
    const source = `
function simple() {
  return 1;
}

function withParams(a: string, b: number, c: boolean) {
  if (a) {
    return b;
  }
  return c;
}
`;

    const functions = extractFunctions(source);
    expect(functions.length).toBe(2);

    const simple = functions.find((f) => f.name === 'simple');
    expect(simple).toBeDefined();
    expect(simple!.parameterCount).toBe(0);
    expect(simple!.cyclomaticComplexity).toBe(1);

    const withParams = functions.find((f) => f.name === 'withParams');
    expect(withParams).toBeDefined();
    expect(withParams!.parameterCount).toBe(3);
    expect(withParams!.cyclomaticComplexity).toBeGreaterThanOrEqual(2);
  });

  it('handles empty source', () => {
    const metrics = analyzeSource('');
    expect(metrics.functionCount).toBe(0);
    expect(metrics.maxCyclomaticComplexity).toBe(0);
  });
});
