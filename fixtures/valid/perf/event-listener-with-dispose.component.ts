import { Component } from '@angular/core';

@Component({
  selector: 'app-listener',
  template: '<p>listener</p>',
})
export class ListenerComponent {
  ngOnInit() {
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  onResize() {}
}
