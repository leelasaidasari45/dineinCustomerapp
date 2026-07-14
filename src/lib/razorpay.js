// Razorpay standard checkout payment helper

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
 * Open Razorpay standard payment modal using backend order creation and signature verification.
 * @param {Object} options
 * @param {number} options.amount - Amount in INR (standard currency unit)
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
    onFailure('Failed to load Razorpay checkout script. Please check your internet connection.');
    return;
  }

  try {
    // 1. Create order on the backend (amounts must be in paise)
    const amountInPaise = Math.round(amount * 100);

    const orderResponse = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Math.random().toString(36).substring(2, 11)}`,
      }),
    });

    if (!orderResponse.ok) {
      const errData = await orderResponse.json();
      throw new Error(errData.error || 'Failed to initialize order on the server');
    }

    const { order_id } = await orderResponse.json();

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      throw new Error('Vite Razorpay Key ID is not configured on the client.');
    }

    // 2. Open standard checkout modal with generated order_id
    const options = {
      key: keyId,
      amount: amountInPaise,
      currency: 'INR',
      name: 'Zuno',
      description: orderName,
      image: '/logo.png',
      order_id: order_id, // Secure order_id linked to Razorpay API
      handler: async (response) => {
        try {
          // 3. Verify payment signature on backend
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();
          if (verifyResponse.ok && verifyData.verified) {
            onSuccess(response);
          } else {
            onFailure(verifyData.error || 'Payment verification failed. Mismatched signatures.');
          }
        } catch (error) {
          onFailure(error.message || 'Signature verification API error occurred.');
        }
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
  } catch (error) {
    onFailure(error.message || 'Failed to initialize payment.');
  }
}
