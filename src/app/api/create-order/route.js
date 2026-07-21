import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    // Validate minimum amount of 100 paise (1 INR)
    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Amount must be at least 100 paise." }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay credentials are not configured on the server." }, { status: 401 });
    }

    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: Math.round(amount), // amount in paise
        currency,
        receipt: receipt || `receipt_${Date.now()}`
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Razorpay API order error:", data);
      return NextResponse.json(
        { error: data.error?.description || "Failed to create Razorpay order." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency
    });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Internal server error occurred." }, { status: 500 });
  }
}
