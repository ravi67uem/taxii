import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// In-memory array to store mock data if MongoDB is not configured
global._mockRegistrations = global._mockRegistrations || [
  {
    name: "Aarav Kumar",
    email: "aarav.kumar@gmail.com",
    phone: "9876543210",
    role: "rider",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    name: "Ravi Shankar",
    email: "ravi.shankar@gmail.com",
    phone: "8877665544",
    role: "driver",
    documentUrl: "https://example.com/mock-license.jpg",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    name: "Priya Singh",
    email: "priya.singh@outlook.com",
    phone: "7766554433",
    role: "rider",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, role, uid, documentUrl } = body;

    // Validation
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required fields." },
        { status: 400 }
      );
    }

    if (!['rider', 'driver'].includes(role)) {
      return NextResponse.json(
        { error: "Role must be either 'rider' or 'driver'." },
        { status: 400 }
      );
    }

    const registrationData = {
      name,
      email,
      phone: phone || '',
      role,
      uid: uid || null,
      documentUrl: role === 'driver' ? (documentUrl || null) : null,
      createdAt: new Date().toISOString(),
    };

    // If MongoDB is configured
    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db('magadh_ev_taxi');
      
      // Check if email already registered
      const existing = await db.collection('registrations').findOne({ email, role });
      if (existing) {
        return NextResponse.json(
          { error: `You have already registered as a ${role} with this email.` },
          { status: 400 }
        );
      }

      await db.collection('registrations').insertOne(registrationData);
      console.log(`Saved new registration to MongoDB: ${email} (${role})`);
    } else {
      // Mock DB Mode
      const existing = global._mockRegistrations.find(
        (reg) => reg.email.toLowerCase() === email.toLowerCase() && reg.role === role
      );
      if (existing) {
        return NextResponse.json(
          { error: `You have already registered as a ${role} with this email.` },
          { status: 400 }
        );
      }

      global._mockRegistrations.push(registrationData);
      console.log(`Saved new registration to Server Memory (Mock DB): ${email} (${role})`);
    }

    return NextResponse.json(
      { success: true, message: "Registration successful!", data: registrationData },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error during registration:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred. Please try again." },
      { status: 500 }
    );
  }
}
