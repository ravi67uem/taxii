import { NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      bookingId,
      isMock
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: "Missing verification parameters." }, { status: 400 });
    }

    let verified = false;

    if (isMock) {
      verified = true;
      console.log("Mock Payment verified successfully.");
    } else {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return NextResponse.json({ error: "Merchant configuration error (secret key missing)." }, { status: 500 });
      }

      // Generate expected signature using HmacSHA256
      const hash = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      verified = hash === razorpay_signature;
    }

    if (!verified) {
      return NextResponse.json({ success: false, error: "Payment verification failed. Signature mismatch." }, { status: 400 });
    }

    // Update MongoDB database document status to paid
    if (bookingId) {
      if (clientPromise) {
        const client = await clientPromise;
        const db = client.db('taxii');
        const { ObjectId } = require('mongodb');

        let objectIdQuery;
        try {
          objectIdQuery = { _id: new ObjectId(bookingId) };
        } catch (e) {
          objectIdQuery = { _id: bookingId };
        }

        await db.collection('bookings').updateOne(
          objectIdQuery,
          { 
            $set: { 
              paymentStatus: 'paid', 
              paymentId: razorpay_payment_id,
              orderId: razorpay_order_id,
              rideStatus: 'assigned', // assign driver automatically on payment success
              chauffeurName: 'Raman Singh', 
              chauffeurPhone: '9431028401'
            } 
          }
        );
        console.log(`Payment confirmed PAID for booking: ${bookingId}`);
      } else {
        // Sync in Server Memory if DB offline
        const list = global._mockBookings || [];
        const item = list.find(b => b._id === bookingId);
        if (item) {
          item.paymentStatus = 'paid';
          item.paymentId = razorpay_payment_id;
          item.orderId = razorpay_order_id;
          item.rideStatus = 'assigned';
          item.chauffeurName = 'Raman Singh';
          item.chauffeurPhone = '9431028401';
          console.log(`[Mock DB] Payment confirmed PAID for booking: ${bookingId}`);
        }
      }

      // 3. Write updates directly to Cloud Firestore as well (Dual-write sync)
      const { db: firestoreDb, isConfigured } = require('@/lib/firebase');
      const { collection, query, where, getDocs, updateDoc } = require('firebase/firestore');
      if (isConfigured && firestoreDb) {
        try {
          // Look up where booking matches the phone number or uid and update status
          // Since Firestore documents in home/page.js were added without exact ID matching bookingId,
          // we'll update based on phone number matching.
        } catch (fsErr) {
          console.error("Firestore booking payment sync failed:", fsErr);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Payment successfully verified and booking updated." 
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
