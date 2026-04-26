import { Component } from '@angular/core';

@Component({ selector: 'app-listener', template: '' })
export class ListenerLeakComponent {
  ngOnInit() {
    document.addEventListener('click', this.handleClick);
    window.addEventListener('resize', this.handleResize);
  }

  handleClick(event: any) {
    console.log(event);
  }

  handleResize() {
    console.log('resize');
  }
}
