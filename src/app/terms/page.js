'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="home-layout">
      <Header />
      
      <section style={{
        padding: '5rem 1.5rem 3rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(2, 94, 79, 0.05) 0%, rgba(123, 185, 40, 0.05) 100%)',
        textAlign: 'center',
        borderBottom: '1px solid rgba(228, 228, 231, 0.5)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span className="section-subtitle">Legal Documents</span>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '600',
            fontFamily: 'var(--font-serif)',
            color: '#18181b',
            marginBottom: '1rem'
          }}>
            Terms & Conditions
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#71717a' }}>
            Last updated: July 21, 2026
          </p>
        </div>
      </section>

      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#ffffff', textAlign: 'left' }}>
        <div className="section-container" style={{ maxWidth: '800px', margin: '0 auto', color: '#3f3d56', lineHeight: '1.7', fontSize: '0.95rem' }}>
          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>1. Agreement to Terms</h3>
          <p>
            By accessing or using the ride-booking services provided by The Taxii ("Company", "we", "our", "us"), you agree to be bound by these Terms & Conditions. If you do not agree, you must immediately discontinue using our website and services.
          </p>

          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>2. Services Description</h3>
          <p>
            The Taxii provides an online search and booking portal for premium electric taxi transportation in Bihar, India. All rides booked are subject to vehicle availability, verification of mobile number, and payment confirmation.
          </p>

          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>3. User Registration & Accounts</h3>
          <p>
            To confirm a ride booking, you must verify your phone number using our secure Firebase SMS One-Time Password (OTP) validation. You are responsible for ensuring that the contact details provided are accurate and that you have permission to receive text notifications on the registered mobile number.
          </p>

          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>4. Payments & Refunds</h3>
          <p>
            Payment transactions for ride bookings are processed securely via the Razorpay payment gateway. All bookings are billed in Indian Rupees (INR).
          </p>
          <ul>
            <li><strong>Cancellation</strong>: Bookings cancelled up to 2 hours prior to the scheduled departure time are eligible for a full refund.</li>
            <li><strong>No-show</strong>: Failure to report at the pickup location within 15 minutes of the scheduled time may result in cancellation without refund.</li>
          </ul>

          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>5. Limitation of Liability</h3>
          <p>
            The Company shall not be liable for any indirect, incidental, or consequential damages resulting from delay, chauffeur no-show, vehicular malfunction, or network connectivity errors beyond our reasonable control.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
