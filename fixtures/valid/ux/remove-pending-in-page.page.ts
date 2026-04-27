import { Component, signal } from '@angular/core';

@Component({ selector: 'app-task-create', template: '' })
export class TaskCreatePage {
  pendingImages = signal<File[]>([]);
  pendingFiles = signal<File[]>([]);

  removePendingImage(index: number): void {
    this.pendingImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  removePendingFile(index: number): void {
    this.pendingFiles.update(files => files.filter((_, i) => i !== index));
  }

  removeFromDraft(itemId: string): void {
    this.pendingFiles.update(files => files.filter(f => f.name !== itemId));
  }
}
