export class TaskListController {
  private taskMap = new Map<string, Task>();

  enrichTasks(tasks: Task[]): EnrichedTask[] {
    const result: EnrichedTask[] = [];
    for (const task of tasks) {
      const cached = this.taskMap.get(task.id);
      if (cached) {
        result.push({ ...task, extra: cached.extra });
      }
    }
    return result;
  }

  buildLookup(items: Item[]): Map<string, Item> {
    const lookup = new Map<string, Item>();
    for (let i = 0; i < items.length; i++) {
      lookup.set(items[i].id, items[i]);
    }
    return lookup;
  }
}

interface Task { id: string; extra?: string; }
interface EnrichedTask extends Task { extra: string; }
interface Item { id: string; }
