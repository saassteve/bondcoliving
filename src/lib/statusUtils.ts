export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed':
    case 'active':
    case 'paid':
    case 'checked_in':
      return 'bg-green-900/50 text-green-300 border border-green-700';
    case 'pending':
      return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700';
    case 'cancelled':
    case 'failed':
      return 'bg-red-900/50 text-red-300 border border-red-700';
    case 'completed':
    case 'checked_out':
      return 'bg-blue-900/50 text-blue-300 border border-blue-700';
    case 'refunded':
    default:
      return 'bg-gray-700/50 text-gray-300 border border-gray-600';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
