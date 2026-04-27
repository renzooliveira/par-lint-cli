import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-signal',
  template: '<p>{{ data() }}</p>',
})
export class SignalComponent {
  private http = inject(HttpClient);
  data = toSignal(this.http.get('/api'), { initialValue: null });
}
