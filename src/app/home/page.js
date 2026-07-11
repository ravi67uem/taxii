'use client';

import { useState } from 'react';
import RegistrationForm from '@/components/RegistrationForm';
import './page.css';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [faqOpen, setFaqOpen] = useState({ 0: true });

  const toggleFaq = (index) => {
    setFaqOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const openModal = (login = false) => {
    setIsLoginMode(login);
    setModalOpen(true);
  };

  const handleRegistrationSuccess = (userData) => {
    console.log("Success callback data:", userData);
    // Keep modal open briefly to show the green success bar inside the form,
    // then close it or redirect
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
