import { Component } from '@angular/core';

@Component({ selector: 'app-task-form', template: '' })
export class TaskFormComponent {
  saveTask(data: any) {
    this.http.post('/api/tasks', data).subscribe(() => {
      // No success feedback — just silently completes
      this.router.navigate(['/tasks']);
    });
  }

  updateProfile(profile: any) {
    this.http.put('/api/profile', profile).subscribe();
  }

  private http: any;
  private router: any;
}
