'use client';

import { useState } from 'react';
import RegistrationForm from '@/components/RegistrationForm';
import BookingWidget from '@/components/BookingWidget';
import { db, isConfigured } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import './page.css';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [prefilledPhone, setPrefilledPhone] = useState('');
  const [pendingBooking, setPendingBooking] = useState(null);
  const [successBookingMessage, setSuccessBookingMessage] = useState('');
  const [faqOpen, setFaqOpen] = useState({ 0: true });

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

  const handleBookingSearchStart = (bookingDetails) => {
    setPendingBooking(bookingDetails);
    openModal(false, bookingDetails.phone); // Open registration/OTP flow with phone pre-filled
  };

  const handleRegistrationSuccess = async (userData) => {
    console.log("Success callback data:", userData);
    
    if (pendingBooking) {
      const bookingPayload = {
        ...pendingBooking,
        uid: userData.uid,
        phone: userData.phone.startsWith('+91') ? userData.phone.replace('+91', '') : userData.phone
      };

      // 1. Write booking to Cloud Firestore if configured
      if (isConfigured && db) {
        try {
          await addDoc(collection(db, 'bookings'), {
            ...bookingPayload,
            createdAt: new Date().toISOString()
          });
          console.log("Booking saved to Cloud Firestore successfully.");
        } catch (fsErr) {
          console.error("Failed to save booking to Firestore:", fsErr);
        }
      }

      // 2. Post booking to MongoDB backend API
      try {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload)
        });
        if (!res.ok) {
          console.warn("Failed to sync booking to MongoDB.");
        } else {
          console.log("Booking synced to MongoDB successfully.");
        }
      } catch (apiErr) {
        console.error("Failed to post booking to MongoDB:", apiErr);
      }

      setSuccessBookingMessage(
        `Your price of ₹${pendingBooking.fare} has been locked! A professional chauffeur will be assigned for your trip from "${pendingBooking.pickup}" to "${pendingBooking.drop}" on ${new Date(pendingBooking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${pendingBooking.time}. Early access details have been linked to your phone number +91 ${bookingPayload.phone}.`
      );
      setPendingBooking(null);
    }

    setTimeout(() => {
      setModalOpen(false);
    }, 2000);
  };

  return (
    <div className="home-layout">
      {/* HEADER / NAVIGATION */}
      <header className="home-header">
        <div className="header-container">
          <div className="logo-container">
            <img src="/logo.png" alt="The Taxii Logo" className="logo-img" />
          </div>
          <nav className="nav-links">
            <a href="#hero" className="nav-link active">Home</a>
            <a href="#about" className="nav-link">About us</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </nav>
          <div className="header-cta">
            <button onClick={() => openModal(true)} className="btn-signin">Sign in</button>
            <button onClick={() => openModal(false)} className="btn-get-started">
              Get Started
            </button>
          </div>
        </div>
      </header>

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
              <div className="feature-icon">🌿</div>
              <h3>100% Electric Fleet</h3>
              <p>Zero tailpipe emissions. We ride silently to protect our cities, starting from historical hubs like Gaya & Patna.</p>
            </div>

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
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <img src="/logo.png" alt="The Taxii Logo" className="footer-logo-img" />
            <p>Late Ride, Green Drive. Delivering Bihar's premium, smart electric mobility experience.</p>
          </div>
          <div className="footer-links-group">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#hero">Home</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-links-group">
            <h4>Support & Contact</h4>
            <p className="footer-contact-info">
              📧 support@thetaxii.com<br />
              📞 +91 9600 111 444
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} The Taxii. All rights reserved. Bihar, India.</p>
        </div>
      </footer>

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

      {/* BOOKING CONFIRMATION MODAL */}
      {successBookingMessage && (
        <div className="fare-modal-overlay" onClick={() => setSuccessBookingMessage('')}>
          <div className="fare-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="btn-modal-close" onClick={() => setSuccessBookingMessage('')} aria-label="Close modal">
              &times;
            </button>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h4 className="fare-modal-title">Booking Confirmed!</h4>
            <p className="fare-modal-subtitle" style={{ color: '#025e4f', fontWeight: '700', fontSize: '1rem', marginBottom: '1rem' }}>
              Your Ride Waitlist Spot is Locked!
            </p>
            <p style={{ fontSize: '0.9rem', color: '#52525b', lineHeight: '1.6', marginBottom: '1.75rem', textAlign: 'left' }}>
              {successBookingMessage}
            </p>
            <button 
              type="button"
              className="btn-get-started" 
              onClick={() => setSuccessBookingMessage('')}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* FLOATING SUPPORT CALL BUTTON */}
      <a href="tel:+919600111444" className="floating-call-btn" aria-label="Call Support" title="Call Support">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </a>
    </div>
  );
}
