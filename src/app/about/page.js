'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="home-layout">
      <Header />
      
      {/* PAGE TITLE BANNER */}
      <section style={{
        padding: '5rem 1.5rem 3rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(2, 94, 79, 0.05) 0%, rgba(123, 185, 40, 0.05) 100%)',
        textAlign: 'center',
        borderBottom: '1px solid rgba(228, 228, 231, 0.5)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span className="section-subtitle">Our Journey</span>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '600',
            fontFamily: 'var(--font-serif)',
            color: '#18181b',
            marginBottom: '1rem'
          }}>
            About The Taxii
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#71717a', lineHeight: '1.6' }}>
            We are Bihar's pioneer premium electric smart ride service, blending zero-emission electric mobility with unmatched comfort and technology.
          </p>
        </div>
      </section>

      {/* CORE VISION SECTION */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#ffffff' }}>
        <div className="section-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', fontWeight: '400', marginBottom: '1.5rem', color: '#18181b' }}>
              Pioneering Sustainable Transit in Bihar
            </h2>
            <p style={{ color: '#71717a', lineHeight: '1.7', marginBottom: '1.25rem', fontSize: '1rem' }}>
              The Taxii was founded with a singular, clear vision: to establish a silent, emission-free transport network connecting Bihar's historical landmarks and commercial hubs, including Patna, Gaya, Bodhgaya, and Nalanda.
            </p>
            <p style={{ color: '#71717a', lineHeight: '1.7', marginBottom: '1.25rem', fontSize: '1rem' }}>
              By integrating state-of-the-art electric sedans and SUVs with locally employed, highly trained professional chauffeurs, we deliver premium airport transfers, local rentals, and outstation trips while leaving a green footprint.
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #025e4f 0%, #7BB928 100%)',
            borderRadius: '20px',
            padding: '3rem 2.5rem',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(2, 94, 79, 0.15)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Our Green Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', display: 'block' }}>100%</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>Electric Fleet</span>
              </div>
              <div>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', display: 'block' }}>0</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>Tailpipe Emissions</span>
              </div>
              <div>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', display: 'block' }}>10k+</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>Happy Riders</span>
              </div>
              <div>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', display: 'block' }}>24/7</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>Customer Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUES SECTION */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#faf9f6', borderTop: '1px solid rgba(228,228,231,0.5)' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-subtitle">Values</span>
            <h2 className="section-title">Driven by Quality & Integrity</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
            <div className="feature-card">
              <span style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}>🌿</span>
              <h3>Eco-friendly</h3>
              <p>Zero carbon emission operations, utilizing clean solar & grid energy to power our silent electric vehicles.</p>
            </div>
            <div className="feature-card">
              <span style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}>💎</span>
              <h3>Premium Hospitality</h3>
              <p>Professional verified chauffeurs, pristine cabin comfort, high-speed Wi-Fi, and refreshments on board.</p>
            </div>
            <div className="feature-card">
              <span style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}>⚡</span>
              <h3>Safety & Security</h3>
              <p>Real-time vehicle tracking, emergency panic triggers, and comprehensive trip insurance for passenger safety.</p>
            </div>
            <div className="feature-card">
              <span style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}>🤝</span>
              <h3>Honest Pricing</h3>
              <p>Transparent fare estimates without surge pricing, hidden toll charges, or sudden cancellation penalties.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
