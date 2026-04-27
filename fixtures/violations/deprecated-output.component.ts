import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-old-output',
  template: '<button (click)="clicked.emit()">Go</button>',
})
export class OldOutputComponent {
  @Output() clicked = new EventEmitter<void>();
  @Output() changed = new EventEmitter<string>();
}
