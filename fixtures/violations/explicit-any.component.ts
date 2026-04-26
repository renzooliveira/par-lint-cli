import { Component } from '@angular/core';

@Component({ selector: 'app-any-demo', template: '' })
export class AnyDemoComponent {
  data: any;

  handleEvent(event: any): void {
    console.log(event);
  }

  processItems(items: any[]): any {
    return items.map((item: any) => item.value);
  }
}
