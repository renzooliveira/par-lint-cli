import { Component, inject } from '@angular/core';
import { signal } from '@angular/core';

@Component({ selector: 'app-task-list', template: '' })
export class TaskListComponent {
  count = signal(0);

  updateFromOutside(externalSignal: any) {
    // This should be flagged: mutating a signal from outside owner
    externalSignal.set('new-value');
    externalSignal.update((v: number) => v + 1);
  }
}
