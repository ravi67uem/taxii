'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#71717a' }}>
            Last updated: July 21, 2026
          </p>
        </div>
      </section>

      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#ffffff', textAlign: 'left' }}>
        <div className="section-container" style={{ maxWidth: '800px', margin: '0 auto', color: '#3f3d56', lineHeight: '1.7', fontSize: '0.95rem' }}>
          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>1. Information We Collect</h3>
          <p>
            We collect personal information necessary to offer and verify ride bookings. This includes:
          </p>
          <ul>
            <li><strong>Identification details</strong>: Name, Email Address, and Phone Number verified via SMS OTP.</li>
            <li><strong>Onboarding details</strong>: Identity verification documents (Aadhar Card, Driving License) submitted by driver partners.</li>
            <li><strong>Geographical data</strong>: Exact GPS coordinates of pickup and drop-off points for dispatch routing.</li>
            <li><strong>Transaction information</strong>: Payment records processed through secure Razorpay channels (we do not store raw card numbers or CVV details).</li>
          </ul>

          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>2. How We Use Your Data</h3>
          <p>
            Your personal information is used exclusively to dispatch electric vehicles, verify security credentials, process transactions, maintain ride histories, and prevent fraudulent activity.
          </p>

          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>3. Data Sharing & Third-Parties</h3>
          <p>
            We do not sell, rent, or lease passenger records to marketing firms. We share data only with:
          </p>
          <ul>
            <li>Assigned dispatch drivers (who receive passenger name and pickup coordinate details).</li>
            <li>Payment gateway partners (Razorpay) to complete secure transactions.</li>
            <li>Firebase Auth (Google) for secure telephone verification.</li>
          </ul>

          <h3 style={{ color: '#18181b', fontSize: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>4. Security Measures</h3>
          <p>
            All connection streams are encrypted using Transport Layer Security (TLS). Data assets are stored securely within MongoDB Atlas and Google Cloud Platform databases following industry best practices.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
