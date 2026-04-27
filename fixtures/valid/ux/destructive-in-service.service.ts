import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  async deleteTask(id: string): Promise<void> {
    await this.http.delete(`/api/tasks/${id}`).toPromise();
  }

  async removeTag(taskId: string, tagId: string): Promise<void> {
    await this.http.delete(`/api/tasks/${taskId}/tags/${tagId}`).toPromise();
  }

  destroySession(): void {
    localStorage.clear();
  }
}
