import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    if (!amount) {
      return NextResponse.json({ error: "Amount is required." }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if configuration is active. Fallback to mock order if placeholders exist
    const isMock = !keyId || keyId.includes('your_') || !keySecret || keySecret.includes('your_');

    if (isMock) {
      const mockOrder = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        entity: "order",
        amount: Math.round(amount * 100), // in paise
        amount_paid: 0,
        amount_due: Math.round(amount * 100),
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        status: "created",
        attempts: 0,
        notes: [],
        created_at: Math.floor(Date.now() / 1000),
        isMock: true
      };
      console.log("Generated simulated Razorpay order ID:", mockOrder.id);
      return NextResponse.json(mockOrder);
    }

    // Call Razorpay API REST endpoint natively using basic auth header (no library required)
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // convert to paise
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

    return NextResponse.json(data);

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Internal server error occurred." }, { status: 500 });
  }
}
