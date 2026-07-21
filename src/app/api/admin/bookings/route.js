import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db('taxii');
      const bookings = await db.collection('bookings')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ bookings });
    } else {
      const list = global._mockBookings || [];
      return NextResponse.json({ 
        bookings: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) 
      });
    }
  } catch (error) {
    console.error("Failed to query bookings:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { bookingId, rideStatus, paymentStatus, chauffeurName, chauffeurPhone } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    const updates = {};
    if (rideStatus) updates.rideStatus = rideStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (chauffeurName !== undefined) updates.chauffeurName = chauffeurName;
    if (chauffeurPhone !== undefined) updates.chauffeurPhone = chauffeurPhone;

    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db('taxii');
      const { ObjectId } = require('mongodb');

      let query;
      try {
        query = { _id: new ObjectId(bookingId) };
      } catch (e) {
        query = { _id: bookingId };
      }

      await db.collection('bookings').updateOne(query, { $set: updates });
      console.log(`Admin updated booking ${bookingId}:`, updates);
    } else {
      // Mock db update in Server Memory
      const list = global._mockBookings || [];
      const item = list.find(b => b._id === bookingId);
      if (item) {
        Object.assign(item, updates);
        console.log(`[Mock DB] Admin updated booking ${bookingId}:`, updates);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Booking details updated successfully." 
    });

  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
