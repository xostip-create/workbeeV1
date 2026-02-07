
'use server';

import { redirect } from 'next/navigation';

/**
 * Initializes a Paystack transaction.
 * In a real app, you'd use a secret key from environment variables.
 * For this demo, we use a placeholder or public key if allowed.
 */
export async function initializePayment(jobId: string, email: string, amount: number) {
  // Paystack secret key should be in .env
  const secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';
  
  // Paystack requires amount in Kobo (100 Kobo = 1 Naira)
  const amountInKobo = amount * 100;

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/payments/callback?jobId=${jobId}`,
        metadata: {
          jobId,
        },
      }),
    });

    const data = await response.json();

    if (data.status && data.data.authorization_url) {
      return { url: data.data.authorization_url };
    } else {
      console.error('Paystack initialization failed:', data);
      throw new Error(data.message || 'Could not initialize payment');
    }
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
}
