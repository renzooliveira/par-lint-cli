import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-old-input',
  template: '<p>{{ name }}</p>',
})
export class OldInputComponent {
  @Input() name: string = '';
  @Input() age!: number;
}
