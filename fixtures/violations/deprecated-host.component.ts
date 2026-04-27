import { Component, HostListener, HostBinding } from '@angular/core';

@Component({
  selector: 'app-old-host',
  template: '<p>host</p>',
})
export class OldHostComponent {
  @HostBinding('class.active') isActive = false;

  @HostListener('click')
  onClick() {
    this.isActive = !this.isActive;
  }
}
