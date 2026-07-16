import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const phone = searchParams.get('phone');

    if (!uid && !phone) {
      return NextResponse.json(
        { error: "Either uid or phone parameter is required." },
        { status: 400 }
      );
    }

    // Build query criteria
    const query = {};
    if (uid) query.uid = uid;
    if (phone) {
      query.phone = phone;
    }

    let user = null;

    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db('taxii');
      
      user = await db.collection('registrations').findOne(query);
      
      // If we queried by UID and didn't find them, but have phone, try querying by phone
      if (!user && uid && phone) {
        user = await db.collection('registrations').findOne({ phone });
        // Update their UID if they have logged in now
        if (user && !user.uid) {
          await db.collection('registrations').updateOne(
            { _id: user._id },
            { $set: { uid } }
          );
          user.uid = uid;
        }
      }
    } else {
      // Mock database fallback
      const mockList = global._mockRegistrations || [];
      user = mockList.find(
        (reg) => (uid && reg.uid === uid) || (phone && reg.phone === phone)
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        uid: user.uid,
        documentUrl: user.documentUrl || null,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error("API error during user fetch:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
