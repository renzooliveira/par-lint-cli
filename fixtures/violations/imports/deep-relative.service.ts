import { UserService } from '../../../shared/services/user.service';
import { OrderModel } from '../../../../models/order.model';
import { ConfigUtil } from '../../../utils/config.util';

export class DeepRelativeService {
  constructor(private userService: UserService) {}
}
