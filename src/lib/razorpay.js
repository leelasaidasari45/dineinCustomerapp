// Razorpay sandbox payment helper
const RAZORPAY_KEY_ID = 'rzp_test_mqbCQBQWNxXYfm';

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay payment modal.
 * @param {Object} options
 * @param {number} options.amount - Amount in paise (INR × 100)
 * @param {string} options.orderName - Display name for the order
 * @param {string} options.customerName
 * @param {string} options.customerEmail
 * @param {string} options.customerPhone
 * @param {Function} options.onSuccess - Called with payment response on success
 * @param {Function} options.onFailure - Called on payment failure
 */
export async function openRazorpayModal({
  amount,
  orderName,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onFailure('Failed to load Razorpay. Please check your connection.');
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    name: 'zunoindia',
    description: orderName,
    image: '/logo.png',
    handler: (response) => {
      onSuccess(response);
    },
    prefill: {
      name: customerName || '',
      email: customerEmail || '',
      contact: customerPhone || '',
    },
    notes: {
      order_name: orderName,
    },
    theme: {
      color: '#F59E0B',
    },
    modal: {
      ondismiss: () => {
        onFailure('Payment cancelled');
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response) => {
    onFailure(response.error.description || 'Payment failed');
  });
  rzp.open();
}
