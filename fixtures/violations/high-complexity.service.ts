import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ValidationService {
  validate(input: any): string {
    if (!input) return 'empty';
    if (typeof input !== 'object') return 'not-object';
    if (!input.type) return 'missing-type';

    switch (input.type) {
      case 'email':
        if (!input.value.includes('@')) return 'invalid-email';
        if (input.value.length > 255) return 'email-too-long';
        break;
      case 'phone':
        if (input.value.length < 10) return 'phone-too-short';
        if (!/^\d+$/.test(input.value)) return 'phone-non-numeric';
        break;
      case 'url':
        if (!input.value.startsWith('http')) return 'invalid-url';
        break;
      case 'date':
        if (isNaN(Date.parse(input.value))) return 'invalid-date';
        break;
      default:
        if (input.required && !input.value) return 'required-missing';
        break;
    }

    return 'valid';
  }
}
