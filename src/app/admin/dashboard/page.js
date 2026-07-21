'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState({ totalBookings: 0, totalRevenue: 0, activeRides: 0, totalUsers: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status updates states
  const [editingId, setEditingId] = useState(null);
  const [tempRideStatus, setTempRideStatus] = useState('');
  const [tempChauffeurName, setTempChauffeurName] = useState('');
  const [tempChauffeurPhone, setTempChauffeurPhone] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('adminToken');
    if (token !== 'taxii_session_token_2026') {
      router.push('/admin/login');
    } else {
      setAuthorized(true);
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      let bookingsList = [];
      let usersCount = 0;
      let revenueSum = 0;
      let activeRides = 0;

      if (isConfigured && db) {
        // 1. Get all bookings from Firestore
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        bookingsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          bookingsList.push({
            _id: docSnap.id,
            ...data
          });
          
          if (data.paymentStatus === 'paid') {
            revenueSum += parseFloat(data.fare || 0);
          }
          if (['pending', 'assigned', 'ongoing'].includes(data.rideStatus)) {
            activeRides++;
          }
        });

        // 2. Get registrations count from Firestore
        const registrationsSnapshot = await getDocs(collection(db, 'registrations'));
        usersCount = registrationsSnapshot.size;
      }

      // Sort bookings by creation date descending
      bookingsList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setBookings(bookingsList);
      setStats({
        totalBookings: bookingsList.length,
        totalRevenue: Math.round(revenueSum),
        activeRides,
        totalUsers: usersCount
      });

    } catch (err) {
      console.error("Firestore admin metrics load failed, trying API fallback:", err);
      try {
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        const bookingsRes = await fetch('/api/admin/bookings');
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData.bookings || []);
        }
      } catch (apiErr) {
        console.error("API admin fallback failed:", apiErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (booking) => {
    setEditingId(booking._id);
    setTempRideStatus(booking.rideStatus || 'pending');
    setTempChauffeurName(booking.chauffeurName || '');
    setTempChauffeurPhone(booking.chauffeurPhone || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveChanges = async (bookingId) => {
    setActionLoading(true);
    try {
      // 1. Update in Cloud Firestore (Primary)
      if (isConfigured && db) {
        try {
          const docRef = doc(db, 'bookings', bookingId);
          await updateDoc(docRef, {
            rideStatus: tempRideStatus,
            chauffeurName: tempChauffeurName,
            chauffeurPhone: tempChauffeurPhone
          });
          console.log("Successfully updated booking document in Cloud Firestore.");
        } catch (fsErr) {
          console.error("Failed to update booking in Firestore:", fsErr);
        }
      }

      // 2. Sync to MongoDB (Optional background sync)
      try {
        await fetch('/api/admin/bookings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            rideStatus: tempRideStatus,
            chauffeurName: tempChauffeurName,
            chauffeurPhone: tempChauffeurPhone
          })
        });
      } catch (apiErr) {
        console.warn("MongoDB admin booking update failed (ignored):", apiErr);
      }

      alert("Booking details updated successfully!");
      setEditingId(null);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      alert("Error updating details.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
    }
    router.push('/admin/login');
  };

  if (!authorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-layout">
      <Header />

      {/* DASHBOARD HEADER */}
      <section style={{
        padding: '5rem 1.5rem 2rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(2, 94, 79, 0.05) 0%, rgba(123, 185, 40, 0.05) 100%)',
        borderBottom: '1px solid rgba(228, 228, 231, 0.5)'
      }}>
        <div className="section-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <span className="section-subtitle">Admin Operations</span>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#18181b', margin: '0.25rem 0 0 0', fontWeight: '600' }}>
              Dashboard Overview
            </h1>
          </div>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1.5rem' }}>
            Secure Log Out
          </button>
        </div>
      </section>

      {/* STATS METRICS CARDS */}
      <section style={{ padding: '3rem 1.5rem 1.5rem 1.5rem', backgroundColor: '#faf9f6' }}>
        <div className="section-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            
            {/* Total Bookings Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
              <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: '600', textTransform: 'uppercase' }}>Total Bookings</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: '#18181b', marginTop: '0.5rem' }}>
                {stats.totalBookings}
              </strong>
            </div>

            {/* Total Revenue Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
              <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: '600', textTransform: 'uppercase' }}>Gross Revenue (INR)</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: '#025e4f', marginTop: '0.5rem' }}>
                ₹{stats.totalRevenue}
              </strong>
            </div>

            {/* Active Rides Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
              <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: '600', textTransform: 'uppercase' }}>Active Trips</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                {stats.activeRides}
              </strong>
            </div>

            {/* Registered Users Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
              <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: '600', textTransform: 'uppercase' }}>Registered Accounts</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: '#18181b', marginTop: '0.5rem' }}>
                {stats.totalUsers}
              </strong>
            </div>

          </div>
        </div>
      </section>

      {/* BOOKINGS TABLE LIST */}
      <section style={{ padding: '1.5rem 1.5rem 5rem 1.5rem', backgroundColor: '#faf9f6' }}>
        <div className="section-container" style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.01)', overflowX: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#18181b', fontWeight: '700', textAlign: 'left' }}>
              Trip Booking Log
            </h3>
            <button onClick={loadDashboardData} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '4rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: '3rem', color: '#71717a', fontSize: '0.9rem' }}>
              No bookings are currently present in the database.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e4e4e7', color: '#52525b', fontWeight: '700' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Client</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Route (Pickup & Drop)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Schedule</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Fare Details</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Statuses</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Chauffeur & Dispatch</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id} style={{ borderBottom: '1px solid #e4e4e7', verticalAlign: 'top' }}>
                    
                    {/* User */}
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <strong style={{ display: 'block', color: '#18181b' }}>+91 {booking.phone}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>UID: {booking.uid?.substring(0, 8) || 'N/A'}</span>
                    </td>

                    {/* Route */}
                    <td style={{ padding: '1rem 0.5rem', maxWidth: '220px' }}>
                      <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={booking.pickup}>
                        🟢 {booking.pickup}
                      </span>
                      {booking.drop && (
                        <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.25rem' }} title={booking.drop}>
                          🔴 {booking.drop}
                        </span>
                      )}
                    </td>

                    {/* Schedule */}
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span style={{ display: 'block', fontWeight: '600', color: '#18181b' }}>{booking.date}</span>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>at {booking.time}</span>
                    </td>

                    {/* Fare */}
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span style={{ display: 'block', fontWeight: '700', color: '#025e4f' }}>₹{booking.fare}</span>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{booking.vehicleName}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {editingId === booking._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <select 
                            value={tempRideStatus} 
                            onChange={e => setTempRideStatus(e.target.value)}
                            style={{ padding: '0.25rem', border: '1px solid #d4d4d8', borderRadius: '4px', fontSize: '0.8rem' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: '700', 
                            textTransform: 'uppercase', 
                            color: booking.paymentStatus === 'paid' 
                              ? '#10b981' 
                              : booking.paymentStatus === 'pay_in_cab'
                                ? '#025e4f'
                                : '#f59e0b'
                          }}>
                            💳 {booking.paymentStatus === 'pay_in_cab' ? 'Pay in Cab (COD)' : (booking.paymentStatus || 'pending')}
                          </span>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: '700', 
                            textTransform: 'uppercase',
                            color: booking.rideStatus === 'completed' ? '#10b981' : (booking.rideStatus === 'cancelled' ? '#ef4444' : '#025e4f')
                          }}>
                            🚖 {booking.rideStatus || 'pending'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Chauffeur */}
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {editingId === booking._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <input
                            type="text"
                            placeholder="Driver Name"
                            value={tempChauffeurName}
                            onChange={e => setTempChauffeurName(e.target.value)}
                            style={{ padding: '0.25rem', border: '1px solid #d4d4d8', borderRadius: '4px', fontSize: '0.8rem', width: '110px' }}
                          />
                          <input
                            type="tel"
                            placeholder="Driver Phone"
                            value={tempChauffeurPhone}
                            onChange={e => setTempChauffeurPhone(e.target.value)}
                            style={{ padding: '0.25rem', border: '1px solid #d4d4d8', borderRadius: '4px', fontSize: '0.8rem', width: '110px' }}
                          />
                        </div>
                      ) : booking.chauffeurName ? (
                        <div>
                          <strong style={{ display: 'block', color: '#18181b' }}>{booking.chauffeurName}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#025e4f', fontWeight: '600' }}>📞 {booking.chauffeurPhone}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#71717a', fontSize: '0.8rem', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      {editingId === booking._id ? (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleSaveChanges(booking._id)}
                            className="btn btn-primary"
                            style={{ margin: 0, padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                            disabled={actionLoading}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-secondary"
                            style={{ margin: 0, padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                            disabled={actionLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(booking)}
                          className="btn-secondary"
                          style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Modify
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
