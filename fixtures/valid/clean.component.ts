import { Component, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-clean',
  template: '<div>clean</div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CleanComponent {
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);

  ngOnInit() {
    this.http.get('/api/data').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      console.log(data);
    });
  }
}
