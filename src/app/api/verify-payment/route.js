import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingId
    } = body;

    // Validate missing fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing verification parameters." }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Merchant secret key is not configured on the server." }, { status: 500 });
    }

    // Verify HMAC-SHA256 signature
    const hash = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const verified = hash === razorpay_signature;

    if (!verified) {
      return NextResponse.json({ success: false, error: "Payment verification failed. Signature mismatch." }, { status: 400 });
    }

    // Sync status update in Firestore if a booking reference is supplied
    if (bookingId) {
      const { db, isConfigured } = require('@/lib/firebase');
      const { doc, updateDoc } = require('firebase/firestore');

      if (isConfigured && db) {
        try {
          const docRef = doc(db, 'bookings', bookingId);
          await updateDoc(docRef, {
            paymentStatus: 'paid',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            rideStatus: 'assigned',
            chauffeurName: 'Raman Singh',
            chauffeurPhone: '9431028401'
          });
          console.log(`Payment confirmed PAID in Firestore for booking: ${bookingId}`);
        } catch (fsErr) {
          console.error("Firestore booking payment sync failed:", fsErr);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Payment successfully verified." 
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error occurred." }, { status: 500 });
  }
}
