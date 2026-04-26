import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  async loadTasks(ids: string[]) {
    const results = [];
    for (const id of ids) {
      // N+1: HTTP call inside loop
      const task = await this.http.get(`/api/tasks/${id}`).toPromise();
      results.push(task);
    }
    return results;
  }

  loadUsers(userIds: string[]) {
    return userIds.map(id => this.http.get(`/api/users/${id}`));
  }
}
