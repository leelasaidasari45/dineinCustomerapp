/**
 * Format a number as Indian Rupees
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date to readable string
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date to time string
 */
export function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date to full datetime
 */
export function formatDateTime(dateString) {
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}

/**
 * Get status label for an order status
 */
export function getStatusLabel(status) {
  const labels = {
    pending_payment: 'Awaiting Payment',
    confirmed: 'Order Confirmed',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 */
export function getStatusColor(status) {
  const colors = {
    pending_payment: 'text-yellow-500',
    confirmed: 'text-blue-500',
    preparing: 'text-orange-500',
    ready: 'text-green-500',
    completed: 'text-gray-500',
    cancelled: 'text-red-500',
    no_show: 'text-red-400',
  };
  return colors[status] || 'text-gray-500';
}
