import { Component, inject, DestroyRef, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-clean',
  template: '<div>clean</div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class CleanComponent {
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);

  ngOnInit() {
    this.http.get('/api/data').pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      this.handleData(data);
    });
  }
}
