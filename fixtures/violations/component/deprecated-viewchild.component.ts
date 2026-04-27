import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-old-viewchild',
  template: '<div #container>content</div>',
})
export class OldViewchildComponent {
  @ViewChild('container') container!: ElementRef;
}
