class BaseEntity {
  id = '';
}

class TimestampedEntity extends BaseEntity {
  createdAt = new Date();
}

class AuditableEntity extends TimestampedEntity {
  updatedBy = '';
}

export class UserEntity extends AuditableEntity {
  name = '';
}
