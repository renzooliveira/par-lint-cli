import { Component, signal } from '@angular/core';

@Component({ selector: 'app-bullet-editor', template: '' })
export class BulletEditorComponent {
  bulletPoints = signal<{ id: number; value: string }[]>([]);

  removeBulletPoint(bulletId: number): void {
    this.bulletPoints.update((points) => points.filter((p) => p.id !== bulletId));
  }

  removeFile(index: number): void {
    this.pendingFiles.update((files) => files.filter((_, i) => i !== index));
  }

  private pendingFiles = signal<File[]>([]);
}
