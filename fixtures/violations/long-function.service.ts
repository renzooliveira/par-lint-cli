import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DataProcessingService {
  processData(items: any[]) {
    const result: any[] = [];
    let total = 0;
    let count = 0;
    let max = 0;
    let min = Infinity;

    for (const item of items) {
      if (item.active) {
        total += item.value;
        count++;
        if (item.value > max) {
          max = item.value;
        }
        if (item.value < min) {
          min = item.value;
        }
        const processed = {
          id: item.id,
          value: item.value,
          normalized: item.value / total,
          active: item.active,
          category: item.category,
        };
        result.push(processed);
      }

      if (item.category === 'special') {
        const specialResult = {
          id: item.id,
          value: item.value * 2,
          bonus: true,
        };
        result.push(specialResult);
      }

      if (item.priority > 5) {
        const highPriority = {
          id: item.id,
          value: item.value * 1.5,
          priority: item.priority,
        };
        result.push(highPriority);
      }

      if (item.tags && item.tags.length > 0) {
        for (const tag of item.tags) {
          const tagResult = {
            id: item.id,
            tag: tag,
            value: item.value,
          };
          result.push(tagResult);
        }
      }

      if (item.metadata) {
        const metaResult = {
          id: item.id,
          meta: item.metadata,
          value: item.value,
        };
        result.push(metaResult);
      }
    }

    return { result, total, count, max, min, average: total / count };
  }
}
