'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="home-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <img src="/logo.png" alt="The Taxii Logo" className="footer-logo-img" />
          <p>Late Ride, Green Drive. Delivering Bihar's premium, smart electric mobility experience.</p>
        </div>
        <div className="footer-links-group">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link href="/home">Home</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/fleet">Our Fleet</Link></li>
            <li><Link href="/contact">Contact Support</Link></li>
          </ul>
        </div>
        <div className="footer-links-group">
          <h4>Legal & Policies</h4>
          <ul className="footer-links">
            <li><Link href="/terms">Terms & Conditions</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} The Taxii. All rights reserved. Bihar, India.</p>
      </div>
    </footer>
  );
}
