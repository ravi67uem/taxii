import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    let bookingsCount = 0;
    let revenueSum = 0;
    let activeRides = 0;
    let usersCount = 0;

    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db('taxii');

      bookingsCount = await db.collection('bookings').countDocuments();
      usersCount = await db.collection('registrations').countDocuments();
      
      // Calculate revenue sum from all PAID bookings
      const paidBookings = await db.collection('bookings').find({ paymentStatus: 'paid' }).toArray();
      revenueSum = paidBookings.reduce((sum, b) => sum + (b.fare || 0), 0);
      
      activeRides = await db.collection('bookings').countDocuments({ 
        rideStatus: { $in: ['pending', 'assigned', 'ongoing'] } 
      });
    } else {
      // Demo Mock database metrics
      const list = global._mockBookings || [];
      bookingsCount = list.length;
      revenueSum = list.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.fare, 0);
      activeRides = list.filter(b => ['pending', 'assigned', 'ongoing'].includes(b.rideStatus)).length;
      usersCount = 14; 
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalBookings: bookingsCount,
        totalRevenue: revenueSum,
        activeRides,
        totalUsers: usersCount
      }
    });
  } catch (err) {
    console.error("Failed to query metrics:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
