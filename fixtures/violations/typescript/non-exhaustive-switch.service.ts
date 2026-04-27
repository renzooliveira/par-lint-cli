type Status = 'active' | 'inactive' | 'pending';

export function getLabel(status: Status): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    default:
      return 'Unknown';
  }
}
