import { Component, signal, computed } from '@angular/core';

interface Task { id: string; name: string; }

@Component({ selector: 'app-task-list', template: '' })
export class TaskListPage {
  tasks = signal<Task[]>([]);

  taskMap = computed(() => {
    const map = new Map<string, Task>();
    for (const task of this.tasks()) {
      map.set(task.id, task);
    }
    return map;
  });
}
