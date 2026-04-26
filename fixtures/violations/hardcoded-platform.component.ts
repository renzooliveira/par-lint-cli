import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({ selector: 'app-platform', template: '' })
export class PlatformComponent {
  constructor(private platform: Platform) {}

  doStuff() {
    if (this.platform.is('ios')) {
      console.log('iOS specific');
    }
    if (this.platform.is('android')) {
      console.log('Android specific');
    }
  }
}
