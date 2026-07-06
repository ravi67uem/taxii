import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if MongoDB is configured
    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db('magadh_ev_taxi');
      
      const ridersCount = await db.collection('registrations').countDocuments({ role: 'rider' });
      const driversCount = await db.collection('registrations').countDocuments({ role: 'driver' });
      
      return NextResponse.json({
        riders: ridersCount + 142, // Base offset for rich social proof
        drivers: driversCount + 37,
        total: ridersCount + driversCount + 179,
        isMock: false,
      });
    } else {
      // Mock mode
      const mockList = global._mockRegistrations || [];
      const ridersCount = mockList.filter(r => r.role === 'rider').length;
      const driversCount = mockList.filter(r => r.role === 'driver').length;
      
      return NextResponse.json({
        riders: ridersCount + 142,
        drivers: driversCount + 37,
        total: ridersCount + driversCount + 179,
        isMock: true,
      });
    }
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({
      riders: 142,
      drivers: 37,
      total: 179,
      isMock: true,
    });
  }
}
