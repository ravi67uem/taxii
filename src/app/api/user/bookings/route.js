import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const uid = searchParams.get('uid');

    if (!phone && !uid) {
      return NextResponse.json({ error: "Phone number or UID is required." }, { status: 400 });
    }

    const query = {};
    if (uid) {
      query.uid = uid;
    } else if (phone) {
      const cleanPhone = phone.startsWith('+91') ? phone.replace('+91', '') : phone;
      query.phone = cleanPhone;
    }

    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db('taxii');
      const bookings = await db.collection('bookings')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ bookings });
    } else {
      // Fallback: Read mock data in Server Memory
      const list = global._mockBookings || [];
      const cleanPhone = phone ? (phone.startsWith('+91') ? phone.replace('+91', '') : phone) : '';
      const filtered = list.filter(b => b.uid === uid || b.phone === cleanPhone);
      
      return NextResponse.json({ 
        bookings: filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) 
      });
    }

  } catch (error) {
    console.error("Failed to query bookings:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
