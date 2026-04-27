import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-with-encapsulation',
  template: '<p>has encapsulation</p>',
  encapsulation: ViewEncapsulation.Emulated,
})
export class WithEncapsulationComponent {}
