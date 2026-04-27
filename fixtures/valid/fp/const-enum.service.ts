export const Status = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Pending: 'PENDING',
} as const;

export type Status = typeof Status[keyof typeof Status];
