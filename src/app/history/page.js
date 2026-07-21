'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RegistrationForm from '@/components/RegistrationForm';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, isConfigured } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function HistoryPage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  // Payment simulation state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch booking history
        await fetchBookings(currentUser.uid, currentUser.phoneNumber);
      } else {
        setBookings([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchBookings = async (uid, phone) => {
    setBookingLoading(true);
    setError('');
    try {
      let bookingsList = [];

      if (isConfigured && db) {
        // Query bookings by user uid
        const q = query(
          collection(db, 'bookings'), 
          where('uid', '==', uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          bookingsList.push({
            _id: docSnap.id,
            ...docSnap.data()
          });
        });

        // Query bookings by phone number if they don't have uid, and merge/de-duplicate
        if (phone) {
          const cleanPhone = phone.startsWith('+91') ? phone.replace('+91', '') : phone;
          const qPhone = query(
            collection(db, 'bookings'),
            where('phone', '==', cleanPhone)
          );
          const phoneSnapshot = await getDocs(qPhone);
          phoneSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const exists = bookingsList.some(b => b._id === docSnap.id);
            if (!exists) {
              bookingsList.push({
                _id: docSnap.id,
                ...data
              });
            }
          });
        }
      }

      // Sort bookings locally by createdAt descending
      bookingsList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setBookings(bookingsList);
    } catch (err) {
      console.error("Firestore history fetch failed, trying API:", err);
      try {
        const res = await fetch(`/api/user/bookings?uid=${uid}&phone=${phone || ''}`);
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        } else {
          setError("Failed to fetch booking list.");
        }
      } catch (apiErr) {
        setError("Network error fetching bookings.");
      }
    } finally {
      setBookingLoading(false);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
  };

  // Complete payment of a pending ride
  const handlePayPendingBooking = async (booking) => {
    setPaymentProcessing(true);
    try {
      const orderRes = await fetch('/api/checkout/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: booking.fare, receipt: `receipt_${booking._id}` })
      });
      const orderData = await orderRes.json();

      if (orderData.isMock) {
        setPaymentData({
          orderId: orderData.id,
          bookingId: booking._id,
          amount: booking.fare,
          vehicleName: booking.vehicleName,
          booking
        });
        setShowPaymentModal(true);
      } else {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "The Taxii",
          description: `Resume Reservation: ${booking.vehicleName}`,
          order_id: orderData.id,
          handler: async (response) => {
            setPaymentProcessing(true);
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bookingId: booking._id
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                // Update Firestore status immediately client-side!
                if (isConfigured && db) {
                  try {
                    const docRef = doc(db, 'bookings', booking._id);
                    await updateDoc(docRef, {
                      paymentStatus: 'paid',
                      paymentId: response.razorpay_payment_id,
                      rideStatus: 'assigned',
                      chauffeurName: 'Raman Singh',
                      chauffeurPhone: '9431028401'
                    });
                  } catch (fsErr) {
                    console.error("Firestore payment sync failed:", fsErr);
                  }
                }
                alert("Payment completed successfully!");
                await fetchBookings(user.uid, user.phoneNumber);
              } else {
                alert("Payment verification failed! " + (verifyData.error || ""));
              }
            } catch (err) {
              console.error(err);
              alert("Error verifying payment signature.");
            } finally {
              setPaymentProcessing(false);
            }
          },
          prefill: {
            contact: user.phoneNumber
          },
          modal: {
            ondismiss: function () {
              setPaymentProcessing(false);
              alert("Payment session cancelled.");
            }
          },
          theme: {
            color: "#025e4f"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert(`Payment failed: ${response.error.description || "Transaction declined."}`);
          setPaymentProcessing(false);
        });
        rzp.open();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleMockPayConfirm = async () => {
    if (!paymentData) return;
    setPaymentProcessing(true);
    try {
      const verifyRes = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: paymentData.orderId,
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
          isMock: true,
          bookingId: paymentData.bookingId
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        // Update Firestore status immediately client-side!
        if (isConfigured && db) {
          try {
            const docRef = doc(db, 'bookings', paymentData.bookingId);
            await updateDoc(docRef, {
              paymentStatus: 'paid',
              paymentId: `pay_mock_${Date.now()}`,
              rideStatus: 'assigned',
              chauffeurName: 'Raman Singh',
              chauffeurPhone: '9431028401'
            });
          } catch (fsErr) {
            console.error("Firestore mock payment sync failed:", fsErr);
          }
        }
        setShowPaymentModal(false);
        alert("Simulated Payment Verified successfully!");
        await fetchBookings(user.uid, user.phoneNumber);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'completed': return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      case 'ongoing': return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'assigned': return { backgroundColor: 'rgba(123, 185, 40, 0.1)', color: '#025e4f' };
      case 'cancelled': return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      default: return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
    }
  };

  return (
    <div className="home-layout">
      <Header />

      {/* HEADER BANNER */}
      <section style={{
        padding: '5rem 1.5rem 3rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(2, 94, 79, 0.05) 0%, rgba(123, 185, 40, 0.05) 100%)',
        textAlign: 'center',
        borderBottom: '1px solid rgba(228, 228, 231, 0.5)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span className="section-subtitle">Account Control</span>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '600',
            fontFamily: 'var(--font-serif)',
            color: '#18181b',
            marginBottom: '1rem'
          }}>
            Ride Booking History
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#71717a', lineHeight: '1.6' }}>
            Verify your mobile number to retrieve your active reservations, assigned chauffeurs, and invoice records.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#ffffff', minHeight: '60vh' }}>
        <div className="section-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: '#71717a' }}>Verifying security session...</p>
            </div>
          ) : !user ? (
            /* Sign in Card */
            <div className="glass-card" style={{ maxWidth: '460px', margin: '0 auto', padding: '2.5rem', border: '1px solid rgba(228,228,231,0.6)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', color: '#18181b', textAlign: 'center' }}>
                Secure Ride Lookup
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '1.75rem', textAlign: 'center' }}>
                Enter your mobile number to verify details via secure SMS OTP.
              </p>
              <RegistrationForm 
                isLoginMode={true}
                onSwitchMode={() => {}}
                onSuccess={(userData) => {
                  setUser(userData);
                  fetchBookings(userData.uid, userData.phone);
                }}
              />
            </div>
          ) : (
            /* Logged in rides dashboard */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #e4e4e7', paddingBottom: '1rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#18181b', fontWeight: '700' }}>
                    Welcome Rider
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#71717a' }}>
                    Phone: {user.phoneNumber || 'Verified Account'}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                  Log Out
                </button>
              </div>

              {bookingLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <div className="spinner"></div>
                </div>
              ) : error ? (
                <div style={{ padding: '1rem', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                  {error}
                </div>
              ) : bookings.length === 0 ? (
                <div style={{
                  padding: '4rem 2rem',
                  border: '2px dashed #e4e4e7',
                  borderRadius: '16px',
                  color: '#71717a',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚖</div>
                  <h4 style={{ color: '#18181b', margin: '0 0 0.5rem 0', fontWeight: '700' }}>No Bookings Found</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>You have not reserved any premium electric rides with us yet.</p>
                </div>
              ) : (
                /* Bookings List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {bookings.map((booking) => (
                    <div key={booking._id} style={{
                      backgroundColor: '#faf9f6',
                      borderRadius: '16px',
                      padding: '1.75rem',
                      border: '1px solid rgba(228, 228, 231, 0.7)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                      textAlign: 'left'
                    }}>
                      {/* Header block */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px dashed #e4e4e7', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#18181b' }}>{booking.vehicleName}</strong>
                          <span style={{ fontSize: '0.85rem', color: '#71717a', display: 'block', marginTop: '0.15rem' }}>
                            Booking Date: {new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {booking.time}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {/* Payment status badge */}
                          <span style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            backgroundColor: booking.paymentStatus === 'paid' 
                              ? 'rgba(16, 185, 129, 0.1)' 
                              : booking.paymentStatus === 'pay_in_cab'
                                ? 'rgba(2, 94, 79, 0.1)'
                                : 'rgba(245, 158, 11, 0.1)',
                            color: booking.paymentStatus === 'paid' 
                              ? '#10b981' 
                              : booking.paymentStatus === 'pay_in_cab'
                                ? '#025e4f'
                                : '#f59e0b'
                          }}>
                            Payment: {booking.paymentStatus === 'pay_in_cab' ? 'Pay in Cab (COD)' : (booking.paymentStatus || 'pending')}
                          </span>

                          {/* Ride status badge */}
                          <span style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            ...getStatusBadgeStyle(booking.rideStatus)
                          }}>
                            Ride: {booking.rideStatus || 'pending'}
                          </span>
                        </div>
                      </div>

                      {/* Coordinates & location details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: '#52525b', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ color: '#025e4f', fontWeight: 'bold' }}>🟢 Pickup:</span>
                          <span>{booking.pickup}</span>
                        </div>
                        {booking.drop && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 Drop-off:</span>
                            <span>{booking.drop}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions / Chauffeur info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(228,228,231,0.4)' }}>
                        <div style={{ fontSize: '0.9rem' }}>
                          <span>Total Amount: </span>
                          <strong style={{ color: '#025e4f', fontSize: '1.1rem' }}>₹{booking.fare}</strong>
                        </div>

                        {booking.paymentStatus === 'pay_in_cab' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            {booking.chauffeurName && (
                              <div style={{ fontSize: '0.8rem', color: '#52525b', textAlign: 'right' }}>
                                <span>👨‍✈️ Driver: <strong>{booking.chauffeurName}</strong></span>
                                <span style={{ display: 'block', color: '#025e4f', fontWeight: '600' }}>📞 {booking.chauffeurPhone}</span>
                              </div>
                            )}
                            <button
                              onClick={() => handlePayPendingBooking(booking)}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              💳 Pay Online Now
                            </button>
                          </div>
                        ) : booking.rideStatus === 'assigned' && booking.chauffeurName ? (
                          <div style={{ fontSize: '0.8rem', color: '#52525b', textAlign: 'right' }}>
                            <span>👨‍✈️ Driver: <strong>{booking.chauffeurName}</strong></span>
                            <span style={{ display: 'block', color: '#025e4f', fontWeight: '600' }}>📞 {booking.chauffeurPhone}</span>
                          </div>
                        ) : booking.paymentStatus !== 'paid' && booking.rideStatus !== 'cancelled' ? (
                          <button
                            onClick={() => handlePayPendingBooking(booking)}
                            className="btn btn-primary"
                            style={{ margin: 0, padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}
                          >
                            Pay & Confirm Ride
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
                            No further actions required.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* DEMO MODE: SIMULATED PAYMENT MODAL */}
      {showPaymentModal && paymentData && (
        <div className="modal-overlay" style={{ zIndex: 1900 }}>
          <div className="modal-content-wrapper" style={{ padding: '2rem', maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💳</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#18181b' }}>
              Razorpay Payment Gateway
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '1.5rem' }}>
              [Demo Mode] Simulated payment to resume your <strong>{paymentData.vehicleName}</strong> reservation.
            </p>

            <div style={{
              backgroundColor: '#faf9f6',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid rgba(228, 228, 231, 0.6)',
              marginBottom: '1.5rem',
              textAlign: 'left',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Order ID:</span>
                <span style={{ fontWeight: '600' }}>{paymentData.orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #d4d4d8', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '1rem' }}>
                <strong>Amount Due:</strong>
                <strong style={{ color: '#025e4f' }}>₹{paymentData.amount}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.75rem' }}
                disabled={paymentProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={handleMockPayConfirm} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.75rem', margin: 0 }}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? 'Verifying...' : 'Pay Success'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERALL PAGE LOADING SPINNER */}
      {paymentProcessing && !showPaymentModal && (
        <div className="modal-overlay" style={{ zIndex: 3000, background: 'rgba(255,255,255,0.7)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: '#025e4f', fontWeight: '600' }}>
              Processing Transaction...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
