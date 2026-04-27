import { Component } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-standalone',
  standalone: true,
  imports: [IonButton, IonContent],
  template: '<ion-content><ion-button>Click</ion-button></ion-content>',
})
export class StandaloneComponent {}
