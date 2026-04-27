import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-standalone',
  standalone: true,
  imports: [IonicModule],
  template: '<ion-button>Click</ion-button>',
})
export class StandaloneComponent {}
