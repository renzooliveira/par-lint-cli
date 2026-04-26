import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GodService {
  prop1 = '';
  prop2 = '';
  prop3 = '';

  method1() { return this.prop1; }
  method2() { return this.prop2; }
  method3() { return this.prop3; }
  method4() { return this.prop1 + this.prop2; }
  method5() { return this.prop2 + this.prop3; }
  method6() { return this.prop1 + this.prop3; }
  method7() { return 'a'; }
  method8() { return 'b'; }
  method9() { return 'c'; }
  method10() { return 'd'; }
  method11() { return 'e'; }
  method12() { return 'f'; }
  method13() { return 'g'; }
  method14() { return 'h'; }
  method15() { return 'i'; }
  method16() { return 'j'; }
  method17() { return 'k'; }
  method18() { return 'l'; }
  method19() { return 'm'; }
  method20() { return 'n'; }
  method21() { return 'o'; }
}

export function helper1() { return 1; }
export function helper2() { return 2; }
export function helper3() { return 3; }
export function helper4() { return 4; }
export function helper5() { return 5; }
export function helper6() { return 6; }
export function helper7() { return 7; }
export function helper8() { return 8; }
export function helper9() { return 9; }
export function helper10() { return 10; }
export function helper11() { return 11; }
export function helper12() { return 12; }
export function helper13() { return 13; }
export function helper14() { return 14; }
export function helper15() { return 15; }
export function helper16() { return 16; }
