'use client';

import { useState } from 'react';
import { auth, storage, isConfigured } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function RegistrationForm({ onSuccess, onSwitchMode, isLoginMode = false }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('rider'); // 'rider' or 'driver'
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLoginMode) {
        // --- LOGIN FLOW ---
        let uid = 'mock-uid-123';
        let loggedInRole = 'rider';

        if (isConfigured && auth) {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          uid = userCredential.user.uid;
        } else {
          // Simulate login delay
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // Fetch user metadata from db to know their details or fallback to mock
        try {
          // If we want to check their profile, we fetch from a endpoint or guess
          // We'll set a success message and log in
          if (email.includes('driver')) {
            loggedInRole = 'driver';
          }
        } catch (e) {}

        setSuccessMsg("Welcome back!");
        if (onSuccess) {
          onSuccess({
            name: email.split('@')[0].toUpperCase(),
            email,
            role: loggedInRole,
            uid,
            isMock: !isConfigured,
            isReturningUser: true,
          });
        }
      } else {
        // --- REGISTRATION FLOW ---
        let uid = `mock-uid-${Date.now()}`;
        let docUrl = null;

        // Validate password length
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        // 1. Firebase Auth Signup
        if (isConfigured && auth) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            uid = userCredential.user.uid;
          } catch (authErr) {
            if (authErr.code === 'auth/email-already-in-use') {
              throw new Error("This email is already registered in Firebase. Try logging in.");
            }
            throw authErr;
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // 2. Document Upload (Drivers only)
        if (role === 'driver') {
          if (!documentFile) {
            throw new Error("Please upload your Driving License or Identity Card.");
          }

          if (isConfigured && storage) {
            const storageRef = ref(storage, `drivers/${uid}/${documentFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, documentFile);

            docUrl = await new Promise((resolve, reject) => {
              uploadTask.on(
                'state_changed',
                (snapshot) => {
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  setUploadProgress(Math.round(progress));
                },
                (uploadErr) => reject(uploadErr),
                async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadURL);
                }
              );
            });
          } else {
            // Mock file upload progress
            for (let p = 0; p <= 100; p += 20) {
              setUploadProgress(p);
              await new Promise((r) => setTimeout(r, 200));
            }
            docUrl = `https://mockstorage.googleapis.com/v0/b/magadh-ev/o/drivers%2F${uid}%2Flicense.png`;
          }
        }

        // 3. Post to local MongoDB backend API
        const apiPayload = {
          name,
          email,
          phone,
          role,
          uid,
          documentUrl: docUrl
        };

        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to register profile. Please try again.");
        }

        setSuccessMsg("Registration successful! Welcome to the squad.");
        if (onSuccess) {
          onSuccess({
            name,
            email,
            phone,
            role,
            uid,
            documentUrl: docUrl,
            isMock: !isConfigured,
            isReturningUser: false
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during submission.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', border: '1px solid var(--glass-border)' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {isLoginMode ? 'Sign In to Dashboard' : 'Get Early Access'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {isLoginMode 
            ? 'Access your Magadh EV driver or rider account' 
            : 'Join the eco-friendly mobility revolution in Bihar'}
        </p>
      </div>

      {!isConfigured && (
        <div style={{
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          color: 'var(--secondary)',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          marginBottom: '1.25rem',
          textAlign: 'center'
        }}>
          💡 Running in <strong>Demo Mode</strong>. Registration is simulated in-memory and Firebase SDK is bypassed.
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--primary)',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
        }}>
          ✓ {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLoginMode && (
          <>
            {/* Role Picker */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span className="form-label">Are you registering as a Rider or Driver?</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('rider')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    border: role === 'rider' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    backgroundColor: role === 'rider' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: role === 'rider' ? 'var(--primary)' : 'var(--text-main)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  🚴 Rider / Passenger
                </button>
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    border: role === 'driver' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    backgroundColor: role === 'driver' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: role === 'driver' ? 'var(--primary)' : 'var(--text-main)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  🚖 Fleet Partner / Driver
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">Email Address</label>
          <input
            id="reg-email"
            type="email"
            className="form-control"
            placeholder={isLoginMode ? "email@example.com" : "you@example.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {!isLoginMode && (
          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">Phone Number (WhatsApp preferred)</label>
            <input
              id="reg-phone"
              type="tel"
              className="form-control"
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="reg-pass">Password</label>
          <input
            id="reg-pass"
            type="password"
            className="form-control"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {!isLoginMode && role === 'driver' && (
          <div className="form-group" style={{
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '10px',
            border: '1px dashed var(--glass-border)',
            marginTop: '1.5rem'
          }}>
            <label className="form-label" htmlFor="reg-doc" style={{ marginBottom: '0.25rem' }}>
              Upload Driving License / Aadhar Card
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Required for early onboarding validation. PDF, JPG, PNG accepted.
            </p>
            <input
              id="reg-doc"
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
              required
            />
            {uploadProgress > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.1s linear' }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '1.25rem' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="spinner" style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></span>
              Processing...
            </span>
          ) : (
            isLoginMode ? 'Sign In' : `Register as ${role === 'driver' ? 'Driver Partner' : 'Rider'}`
          )}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          {isLoginMode ? "Don't have an account? " : "Already registered? "}
        </span>
        <button
          onClick={onSwitchMode}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: '600',
            fontFamily: 'inherit'
          }}
        >
          {isLoginMode ? 'Join Early Access' : 'Sign in here'}
        </button>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
