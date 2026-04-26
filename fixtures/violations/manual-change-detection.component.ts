import { Component, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-bad',
  template: '<div>bad</div>',
})
export class BadComponent {
  constructor(private cdr: ChangeDetectorRef) {}

  update() {
    this.cdr.detectChanges();
  }

  refresh() {
    this.cdr.markForCheck();
  }
}
