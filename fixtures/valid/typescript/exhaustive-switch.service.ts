type Status = 'active' | 'inactive' | 'pending';

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

export function getLabel(status: Status): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'pending':
      return 'Pending';
    default:
      return assertNever(status);
  }
}
