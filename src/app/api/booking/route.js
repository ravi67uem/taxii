import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      phone, 
      pickup, 
      drop, 
      date, 
      time, 
      fare, 
      tab, 
      pickupCoords, 
      dropCoords, 
      uid 
    } = body;

    // Validation
    if (!phone || !pickup || !fare || !date || !time) {
      return NextResponse.json(
        { error: "Phone, pickup, date, time, and fare are required fields." },
        { status: 400 }
      );
    }

    const bookingData = {
      uid: uid || null,
      phone,
      pickup,
      drop: drop || null,
      date,
      time,
      fare: parseFloat(fare),
      tab,
      pickupCoords: pickupCoords || null,
      dropCoords: dropCoords || null,
      createdAt: new Date().toISOString(),
    };

    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db('taxii');
      await db.collection('bookings').insertOne(bookingData);
      console.log(`Saved new booking to MongoDB for phone: ${phone}`);
    } else {
      // Mock db insertion
      global._mockBookings = global._mockBookings || [];
      global._mockBookings.push(bookingData);
      console.log(`Saved new booking to Server Memory (Mock DB) for phone: ${phone}`);
    }

    return NextResponse.json({
      success: true,
      message: "Booking confirmed successfully!",
      booking: bookingData
    }, { status: 201 });

  } catch (error) {
    console.error("API error during booking:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
