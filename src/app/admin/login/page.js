'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate secure passcode check or call verification
    await new Promise(r => setTimeout(r, 600));

    if (passcode === 'taxiiadmin2026') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminToken', 'taxii_session_token_2026');
      }
      router.push('/admin/dashboard');
    } else {
      setError("Invalid administrative passcode key.");
    }
    setLoading(false);
  };

  return (
    <div className="home-layout">
      <Header />

      <section style={{
        padding: '6rem 1.5rem',
        backgroundColor: '#faf9f6',
        minHeight: '65vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2.5rem',
          border: '1px solid rgba(228,228,231,0.6)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#18181b', marginBottom: '0.25rem' }}>
            Admin Control Center
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '1.75rem' }}>
            Restricted access. Please input your secure security key below.
          </p>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              marginBottom: '1.25rem',
              textAlign: 'left'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="admin-pass">Secure Passcode</label>
              <input
                id="admin-pass"
                type="password"
                className="form-control"
                placeholder="Enter admin passcode"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', margin: 0 }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
