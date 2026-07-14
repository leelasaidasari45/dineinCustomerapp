import Razorpay from 'razorpay';

// Standard Vercel Serverless Function configuration for Node.js
export default async function handler(req, res) {
  // CORS Configuration matching existing proxy functions
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, currency, receipt } = req.body;

  // Validate amount >= 100 paise
  if (amount === undefined || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid amount. Amount must be a number.' });
  }

  if (amount < 100) {
    return res.status(400).json({ error: 'Amount must be at least 100 paise (1 INR).' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay API credentials are not configured on the server.' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount), // must be in integer paise
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Return order details (order_id is order.id)
    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    console.error('Razorpay API Order Creation Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to initialize Razorpay order.' });
  }
}
