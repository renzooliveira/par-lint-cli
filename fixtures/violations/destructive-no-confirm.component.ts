import { Component } from '@angular/core';

@Component({ selector: 'app-tasks', template: '' })
export class TasksComponent {
  deleteTask(id: string) {
    this.taskService.delete(id).subscribe();
  }

  removeItem(item: any) {
    this.itemService.remove(item.id).subscribe();
  }

  destroyRecord(recordId: string) {
    this.recordService.destroy(recordId).subscribe();
  }

  private taskService: any;
  private itemService: any;
  private recordService: any;
}
