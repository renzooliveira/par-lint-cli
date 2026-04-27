import { NgModule, Component } from '@angular/core';

@Component({
  selector: 'app-legacy',
  template: '<p>legacy</p>',
})
export class LegacyComponent {}

@NgModule({
  declarations: [LegacyComponent],
  exports: [LegacyComponent],
})
export class LegacyModule {}
