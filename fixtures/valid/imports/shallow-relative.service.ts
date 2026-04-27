import { UserService } from '../../shared/services/user.service';
import { OrderModel } from '../models/order.model';
import { ConfigUtil } from './config.util';

export class ShallowRelativeService {
  constructor(private userService: UserService) {}
}
