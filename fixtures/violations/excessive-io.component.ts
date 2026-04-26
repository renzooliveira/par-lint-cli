import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-excessive',
  template: '<div>excessive</div>',
})
export class ExcessiveComponent {
  @Input() prop1 = '';
  @Input() prop2 = '';
  @Input() prop3 = '';
  @Input() prop4 = '';
  @Input() prop5 = '';
  @Input() prop6 = '';
  @Input() prop7 = '';
  @Input() prop8 = '';
  @Input() prop9 = '';

  @Output() event1 = new EventEmitter();
  @Output() event2 = new EventEmitter();
  @Output() event3 = new EventEmitter();
  @Output() event4 = new EventEmitter();
  @Output() event5 = new EventEmitter();
  @Output() event6 = new EventEmitter();
  @Output() event7 = new EventEmitter();
}
