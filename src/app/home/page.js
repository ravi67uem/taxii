'use client';

import { useState } from 'react';
import RegistrationForm from '@/components/RegistrationForm';
import BookingWidget from '@/components/BookingWidget';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db, isConfigured } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import './page.css';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [prefilledPhone, setPrefilledPhone] = useState('');
  const [pendingBooking, setPendingBooking] = useState(null);
  const [successBookingMessage, setSuccessBookingMessage] = useState('');
  const [faqOpen, setFaqOpen] = useState({ 0: true });

  // Payment method selection modal state
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [methodModalData, setMethodModalData] = useState(null);

  // Razorpay payment integration state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const toggleFaq = (index) => {
    setFaqOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const openModal = (login = false, phone = '') => {
    setPrefilledPhone(phone);
    setIsLoginMode(login);
    setModalOpen(true);
  };

  const handleBookingSearchStart = async (bookingDetails) => {
    const authInstance = getAuth();
    const activeUser = authInstance.currentUser;

    if (activeUser) {
      // User logged in: pre-fill user profile info & open payment method selector modal
      console.log("User is already logged in. Launching payment selection.");
      
      let userData = {
        uid: activeUser.uid,
        phone: activeUser.phoneNumber || bookingDetails.phone,
        name: 'Rider'
      };

      if (isConfigured && db) {
        try {
          const docSnap = await getDoc(doc(db, 'registrations', activeUser.uid));
          if (docSnap.exists()) {
            userData = docSnap.data();
          }
        } catch (e) {
          console.warn("Could not retrieve logged-in user profile from Firestore:", e);
        }
      }

      setPendingBooking(bookingDetails);
      setMethodModalData({ userData, bookingDetails });
      setShowMethodModal(true);
    } else {
      // Guest: open signup OTP flow
      setPendingBooking(bookingDetails);
      openModal(false, bookingDetails.phone);
    }
  };

  const handleSelectPaymentType = async (type) => {
    if (!methodModalData) return;
    const { userData, bookingDetails } = methodModalData;
    setShowMethodModal(false);

    if (type === 'cab') {
      // Proceed with Pay in Cab / COD
      await executeBookingFlow(userData, bookingDetails, 'pay_in_cab');
    } else {
      // Proceed with Online Razorpay payment
      await executeBookingFlow(userData, bookingDetails, 'pending');
    }
  };

  const handlePaymentSuccess = async (userData, bookingPayload, paymentId) => {
    // Update status in Cloud Firestore (Primary)
    if (isConfigured && db && bookingPayload.bookingId) {
      try {
        const docRef = doc(db, 'bookings', bookingPayload.bookingId);
        await updateDoc(docRef, {
          paymentStatus: 'paid',
          paymentId: paymentId,
          rideStatus: 'assigned',
          chauffeurName: 'Raman Singh',
          chauffeurPhone: '9431028401'
        });
        console.log("Successfully confirmed booking payment status to PAID in Cloud Firestore.");
      } catch (fsErr) {
        console.error("Failed to update booking status in Firestore:", fsErr);
      }
    }

    setSuccessBookingMessage(
      `Your booking and payment of ₹${bookingPayload.fare} has been successfully processed! Chauffeur Raman Singh (+91 9431028401) has been assigned for your ride from "${bookingPayload.pickup}" to "${bookingPayload.drop}" on ${new Date(bookingPayload.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${bookingPayload.time}. Confirmation details have been sent to your phone number +91 ${bookingPayload.phone}.`
    );
    setPendingBooking(null);
    setShowPaymentModal(false);
    setModalOpen(false);
  };

  const handleMockPayConfirm = async () => {
    if (!paymentData) return;
    setPaymentLoading(true);

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
        await handlePaymentSuccess(paymentData.userData, paymentData.bookingPayload, `pay_mock_${Date.now()}`);
      }
    } catch (e) {
      console.error("Mock verification error:", e);
    } finally {
      setPaymentLoading(false);
    }
  };

  const executeBookingFlow = async (userData, bookingDetails, initialPaymentStatus = 'pending') => {
    const cleanPhone = userData.phone.startsWith('+91') 
      ? userData.phone.replace('+91', '') 
      : userData.phone;

    const bookingPayload = {
      ...bookingDetails,
      uid: userData.uid,
      phone: cleanPhone,
      paymentStatus: initialPaymentStatus,
      rideStatus: initialPaymentStatus === 'pay_in_cab' ? 'assigned' : 'pending',
      chauffeurName: initialPaymentStatus === 'pay_in_cab' ? 'Raman Singh' : null,
      chauffeurPhone: initialPaymentStatus === 'pay_in_cab' ? '9431028401' : null
    };

    setPaymentLoading(true);

    let bookingId = `booking_mock_${Date.now()}`;

    // 1. Write booking to Cloud Firestore (Primary)
    if (isConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, 'bookings'), {
          ...bookingPayload,
          createdAt: new Date().toISOString()
        });
        bookingId = docRef.id;
        console.log("Booking written to Cloud Firestore successfully with ID:", bookingId);
      } catch (fsErr) {
        console.error("Failed to save booking to Firestore:", fsErr);
      }
    }

    bookingPayload.bookingId = bookingId;

    // 2. Sync booking in MongoDB (Optional background sync)
    try {
      await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
    } catch (apiErr) {
      console.warn("MongoDB booking synchronization failed (ignored):", apiErr);
    }

    if (initialPaymentStatus === 'pay_in_cab') {
      // Pay in Cab confirmed instantly! Show success banner immediately.
      setPaymentLoading(false);
      setSuccessBookingMessage(
        `Your ride is confirmed! You chose to pay ₹${bookingDetails.fare} in the cab (Cash/UPI to driver). Chauffeur Raman Singh (+91 9431028401) has been assigned for your trip from "${bookingDetails.pickup}" to "${bookingDetails.drop}" on ${new Date(bookingDetails.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${bookingDetails.time}.`
      );
      setPendingBooking(null);
      setModalOpen(false);
      return;
    }

    // 3. Create Razorpay order (for online bookings)
    try {
      const orderRes = await fetch('/api/checkout/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bookingDetails.fare, receipt: `receipt_${bookingId}` })
      });
      
      if (!orderRes.ok) {
        throw new Error("Failed to create order");
      }

      const orderData = await orderRes.json();

      // 4. Initiate payment widget / simulation
      if (orderData.isMock) {
        setPaymentData({
          orderId: orderData.id,
          bookingId,
          amount: bookingDetails.fare,
          userData,
          bookingPayload
        });
        setShowPaymentModal(true);
      } else {
        // Open Razorpay Checkout Widget
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "The Taxii",
          description: `Ride Reservation: ${bookingDetails.vehicleName || 'Taxii Go'}`,
          order_id: orderData.id,
          handler: async (response) => {
            setPaymentLoading(true);
            try {
              // Verify signature
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bookingId
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                await handlePaymentSuccess(userData, bookingPayload, response.razorpay_payment_id);
              } else {
                alert("Payment verification failed! Try again.");
              }
            } catch (verifyErr) {
              console.error("Verification endpoint error:", verifyErr);
              alert("Error verifying payment signature.");
            } finally {
              setPaymentLoading(false);
            }
          },
          prefill: {
            name: userData.name || '',
            contact: userData.phone || ''
          },
          modal: {
            ondismiss: function () {
              setPaymentLoading(false);
              alert("Payment session cancelled. You can complete the payment anytime in your Ride History.");
            }
          },
          theme: {
            color: "#025e4f"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert(`Payment failed: ${response.error.description || "Transaction declined."}`);
          setPaymentLoading(false);
        });
        rzp.open();
      }
    } catch (checkoutErr) {
      console.error("Checkout creation failed:", checkoutErr);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRegistrationSuccess = async (userData) => {
    console.log("Success callback data:", userData);
    
    if (pendingBooking) {
      setMethodModalData({ userData, bookingDetails: pendingBooking });
      setShowMethodModal(true);
    } else {
      setTimeout(() => {
        setModalOpen(false);
      }, 1500);
    }
  };

  return (
    <div className="home-layout">
      {/* HEADER / NAVIGATION */}
      <Header openModal={openModal} />

      {/* SUCCESS CONFIRMATION OVERLAY */}
      {successBookingMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px',
          backgroundColor: '#025e4f',
          borderLeft: '5px solid #7BB928',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          zIndex: 2000,
          textAlign: 'left',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>✓</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '1rem', color: '#7BB928' }}>
                Booking Confirmed!
              </strong>
              {successBookingMessage}
            </div>
            <button 
              onClick={() => setSuccessBookingMessage('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                marginLeft: 'auto',
                padding: '0 0.5rem'
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section id="hero" className="hero-section">
        {/* Background landscape image spanning full 90vh/100vw */}
        <img
          src="/assets/hero-bg.png"
          alt="Taxii Premium Ride Electric Varanasi Ganga Ghat"
          className="hero-bg-img"
        />
        {/* Soft shadow/fade overlay */}
        <div className=""></div>

        {/* Hero title text positioned above the visual elements in the sky */}
        <div className="hero-content">
          <h1 className="hero-title">Ride Premium. Ride Electric. Ride Taxii.</h1>
        </div>
      </section>

      {/* BOOKING SEARCH SECTION */}
      <BookingWidget onSearchStart={handleBookingSearchStart} />

      {/* VALUE PROPOSITION / FEATURES SECTION */}
      <section id="about" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-subtitle">Why Choose The Taxii</span>
            <h2 className="section-title">A New Standard of Premium Travel</h2>
            <p className="section-desc">
              We are blending luxurious passenger comfort with 100% eco-friendly, zero-emission smart mobility. Experience transit that is quiet, clean, and reliable.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💎</div>
              <h3>Premium Comfort</h3>
              <p>State-of-the-art vehicles equipped with modern climate control, high-quality audio, and pristine interiors.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👮</div>
              <h3>Verified Chauffeurs</h3>
              <p>Professional, background-verified local drivers trained to deliver a polite and secure hospitality experience.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Smart Booking</h3>
              <p>Transparent pricing, digital ticketing, and live tracking. No hidden charges, no sudden surges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faq" className="faq-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-subtitle">Got Questions?</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            <div className={`faq-item ${faqOpen[0] ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => toggleFaq(0)}>
                <span>Where does The Taxii operate?</span>
                <span className="faq-icon">{faqOpen[0] ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>We are launching our services primarily in Bihar, connecting key cities and tourist landmarks including Patna, Gaya, Bodhgaya, and Nalanda with reliable premium electric rides.</p>
              </div>
            </div>

            <div className={`faq-item ${faqOpen[1] ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => toggleFaq(1)}>
                <span>How can I register as a Fleet Partner / Driver?</span>
                <span className="faq-icon">{faqOpen[1] ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>You can join us by clicking the "Get Started" button and selecting "Fleet Partner / Driver". You will need to upload your Driving License or Identity Card for onboarding validation.</p>
              </div>
            </div>

            <div className={`faq-item ${faqOpen[2] ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => toggleFaq(2)}>
                <span>Is this service 100% electric?</span>
                <span className="faq-icon">{faqOpen[2] ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>Yes. The Taxii runs exclusively on clean electric energy. Our mission is to introduce sustainable smart mobility with zero emissions and zero noise pollution in Bihar.</p>
              </div>
            </div>

            <div className={`faq-item ${faqOpen[3] ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => toggleFaq(3)}>
                <span>When will full booking services launch?</span>
                <span className="faq-icon">{faqOpen[3] ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>We are currently onboarding early access riders and driver partners. Registering today places you on the premium VIP waiting list with exclusive discount vouchers for our maiden voyages!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

      {/* REGISTRATION MODAL */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setModalOpen(false)} aria-label="Close modal">
              &times;
            </button>
            <RegistrationForm
              isLoginMode={isLoginMode}
              onSwitchMode={() => setIsLoginMode(!isLoginMode)}
              onSuccess={handleRegistrationSuccess}
              initialPhone={prefilledPhone}
            />
          </div>
        </div>
      )}

      {/* PAYMENT METHOD SELECTION MODAL */}
      {showMethodModal && methodModalData && (
        <div className="modal-overlay" style={{ zIndex: 1850 }}>
          <div className="modal-content-wrapper" style={{ padding: '2rem', maxWidth: '450px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🚖</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#18181b' }}>
              Select Payment Method
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '1.5rem' }}>
              Confirm how you would like to pay for your <strong>{methodModalData.bookingDetails.vehicleName}</strong> ride.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Pay Online Card */}
              <div 
                onClick={() => handleSelectPaymentType('online')}
                style={{
                  border: '1px solid #e4e4e7',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff'
                }}
                className="payment-type-card"
              >
                <span style={{ fontSize: '1.8rem' }}>💳</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#18181b' }}>Pay Online</strong>
                  <span style={{ fontSize: '0.75rem', color: '#71717a' }}>UPI, Cards, or Netbanking securely</span>
                </div>
                <strong style={{ marginLeft: 'auto', color: '#025e4f' }}>₹{methodModalData.bookingDetails.fare}</strong>
              </div>

              {/* Pay in Cab Card */}
              <div 
                onClick={() => handleSelectPaymentType('cab')}
                style={{
                  border: '1px solid #e4e4e7',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff'
                }}
                className="payment-type-card"
              >
                <span style={{ fontSize: '1.8rem' }}>💵</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: '#18181b' }}>Pay in Cab (COD)</strong>
                  <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Pay Cash or UPI to driver on arrival</span>
                </div>
                <strong style={{ marginLeft: 'auto', color: '#025e4f' }}>₹{methodModalData.bookingDetails.fare}</strong>
              </div>
            </div>

            <button 
              onClick={() => setShowMethodModal(false)}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.65rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DEMO MODE: SIMULATED PAYMENT MODAL */}
      {showPaymentModal && paymentData && (
        <div className="modal-overlay" style={{ zIndex: 1900 }}>
          <div className="modal-content-wrapper" style={{ padding: '2rem', maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💳</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#18181b' }}>
              Razorpay Payment Gateway
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '1.5rem' }}>
              [Demo Mode] Simulated payment request for your <strong>{paymentData.bookingPayload.vehicleName}</strong> reservation.
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Booking ID:</span>
                <span style={{ fontWeight: '600' }}>{paymentData.bookingId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #d4d4d8', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '1rem' }}>
                <strong>Amount Due:</strong>
                <strong style={{ color: '#025e4f' }}>₹{paymentData.amount}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  alert("Booking created but payment cancelled. You can complete payment under History.");
                }} 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.75rem' }}
                disabled={paymentLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleMockPayConfirm} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.75rem', margin: 0 }}
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Verifying...' : 'Pay Success'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERALL PAGE LOADING SPINNER */}
      {paymentLoading && !showPaymentModal && (
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
