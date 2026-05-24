import { Injectable } from '@angular/core';
import { Logger } from '../shared/logger.service';

@Injectable({ providedIn: 'root' })
export class CoreInternalService {
  constructor(private logger: Logger) {}
}
