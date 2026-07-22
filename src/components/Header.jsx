'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, isConfigured } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Header({ openModal }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        console.log("Successfully logged user out of Firebase session.");
        router.push('/home');
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
  };

  return (
    <header className="home-header">
      <div className="header-container">
        <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => router.push('/home')}>
          <img src="/logo.png" alt="The Taxii Logo" className="logo-img" />
        </div>
        <nav className="nav-links">
          <Link href="/home" className="nav-link">Home</Link>
          <Link href="/about" className="nav-link">About us</Link>
          <Link href="/fleet" className="nav-link">Fleet</Link>
          <Link href="/history" className="nav-link">History</Link>
          <Link href="/contact" className="nav-link">Contact</Link>
        </nav>
        <div className="header-cta">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user && (user.phoneNumber === '+918409251542' || user.phoneNumber === '8409251542') && (
                <Link href="/admin/dashboard" style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: '#7bb928',
                  textDecoration: 'none',
                  border: '1px solid #7bb928',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'rgba(123, 185, 40, 0.05)',
                  cursor: 'pointer'
                }} className="admin-header-link">
                  🛠️ Admin
                </Link>
              )}
              <div 
                onClick={() => router.push('/history')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer',
                  backgroundColor: 'rgba(2, 94, 79, 0.05)',
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(2, 94, 79, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                className="header-profile-badge"
              >
                <span style={{ fontSize: '1rem' }}>👤</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#025e4f' }}>
                  {user.phoneNumber ? user.phoneNumber.replace('+91', '') : 'My Profile'}
                </span>
              </div>
              <button 
                onClick={handleLogout} 
                className="btn-signin"
                style={{ 
                  padding: '0.45rem 0.95rem', 
                  fontSize: '0.8rem', 
                  minWidth: 'auto', 
                  border: 'none', 
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              {openModal ? (
                <>
                  <button onClick={() => openModal(true)} className="btn-signin">Sign in</button>
                  <button onClick={() => openModal(false)} className="btn-get-started">
                    Get Started
                  </button>
                </>
              ) : (
                <button onClick={() => router.push('/home')} className="btn-get-started">
                  Book Now
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
