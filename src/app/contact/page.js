'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db, isConfigured } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    if (!name || !email || !message) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const payload = {
      name,
      email,
      phone: phone || '',
      subject,
      message,
      createdAt: new Date().toISOString()
    };

    try {
      if (isConfigured && db) {
        await addDoc(collection(db, 'inquiries'), payload);
        console.log("Contact form written to Firestore:", payload);
      } else {
        // Mock save delay
        await new Promise(r => setTimeout(r, 1000));
        console.log("[Demo Mode] Contact form mock-saved:", payload);
      }

      setSuccess("Your message has been received! Our support team will contact you shortly.");
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
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
          <span className="section-subtitle">Get In Touch</span>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '600',
            fontFamily: 'var(--font-serif)',
            color: '#18181b',
            marginBottom: '1rem'
          }}>
            Contact Our Team
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#71717a', lineHeight: '1.6' }}>
            Have questions about ride bookings, corporate packages, or partnering with us? Drop us a line!
          </p>
        </div>
      </section>

      {/* CONTACT GRID */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#ffffff' }}>
        <div className="section-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '4rem' }}>
          
          {/* Contact Details Panel */}
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: '400', marginBottom: '1.5rem', color: '#18181b' }}>
              Office Information
            </h2>
            <p style={{ color: '#71717a', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              Our customer happiness center is operational 24 hours a day, 7 days a week, to assist you with active ride bookings and chauffeur dispatch validation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem' }}>📍</span>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '700' }}>HQ Address</h4>
                  <p style={{ margin: 0, color: '#52525b', fontSize: '0.9rem' }}>
                    The Taxii Office, East Boring Canal Road, Patna, Bihar 800001, India
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem' }}>📧</span>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '700' }}>Email Support</h4>
                  <p style={{ margin: 0, color: '#025e4f', fontSize: '0.9rem', fontWeight: '600' }}>
                    thetaxiiofficial@gmail.com
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem' }}>📞</span>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '700' }}>Call Center</h4>
                  <p style={{ margin: 0, color: '#025e4f', fontSize: '0.9rem', fontWeight: '600' }}>
                    +91 9600 111 444
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(228, 228, 231, 0.7)', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#18181b' }}>
              Send an Inquiry
            </h3>

            {success && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--primary)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                ✓ {success}
              </div>
            )}

            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="contact-name">Full Name *</label>
                  <input
                    id="contact-name"
                    type="text"
                    className="form-control"
                    placeholder="Enter your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="contact-email">Email Address *</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="contact-phone">Phone Number</label>
                  <input
                    id="contact-phone"
                    type="tel"
                    className="form-control"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="contact-subject">Subject</label>
                  <select
                    id="contact-subject"
                    className="form-control"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    disabled={loading}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Booking Assistance">Booking Assistance</option>
                    <option value="Corporate Partnerships">Corporate Partnerships</option>
                    <option value="Driver Recruitment">Driver Onboarding</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="contact-message">Message *</label>
                <textarea
                  id="contact-message"
                  className="form-control"
                  placeholder="Tell us what you need help with..."
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={loading}
                  required
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
                {loading ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
