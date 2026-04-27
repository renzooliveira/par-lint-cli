import { Component } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';

@Component({
  selector: 'app-home',
  template: '<ion-content><p>Home</p></ion-content>',
})
export class HomePage implements ViewWillEnter {
  data: any[] = [];

  ionViewWillEnter() {
    this.loadData();
  }

  private loadData() {
    fetch('/api/data').then(r => r.json()).then(d => this.data = d);
  }
}
