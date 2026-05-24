import { Component } from '@angular/core';

@Component({
  selector: 'app-multi-any',
  template: '<div></div>',
})
export class MultiAnyComponent {
  data: any = null;
  items: any[] = [];
  config: any = {};
}
