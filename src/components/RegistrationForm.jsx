'use client';

import { useState, useEffect } from 'react';
import { auth, storage, db, isConfigured } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function RegistrationForm({ onSuccess, onSwitchMode, isLoginMode = false, initialPhone = '' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(initialPhone || ''); // Stores the 10-digit number (digits only)
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [role, setRole] = useState('rider'); // 'rider' or 'driver'
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Clean up recaptcha verifier when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error("Error clearing recaptcha verifier:", e);
        }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleSwitchMode = () => {
    setName('');
    setPhone('');
    setEmail('');
    setOtpCode('');
    setOtpSent(false);
    setConfirmationResult(null);
    setError('');
    setSuccessMsg('');
    if (onSwitchMode) {
      onSwitchMode();
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    // For registration mode, validate details before sending OTP
    if (!isLoginMode) {
      if (!name.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      if (role === 'driver' && !documentFile) {
        setError("Please upload your Driving License or Identity Card.");
        setLoading(false);
        return;
      }
    }

    const formattedPhone = `+91${phone}`;

    try {
      if (isConfigured && auth) {
        // Prepare recaptcha DOM element and constructor
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (e) {}
          window.recaptchaVerifier = null;
        }

        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        });

        const appVerifier = window.recaptchaVerifier;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setSuccessMsg(`Verification code sent to ${formattedPhone}.`);
      } else {
        // Mock mode sending OTP
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setOtpSent(true);
        setSuccessMsg(`[Demo Mode] OTP sent to ${formattedPhone}. Use code 123456 to verify.`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send OTP code. Please verify your number.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      setLoading(false);
      return;
    }

    const formattedPhone = `+91${phone}`;

    try {
      let uid = `mock-uid-${Date.now()}`;

      if (isConfigured && auth && confirmationResult) {
        try {
          const userCredential = await confirmationResult.confirm(otpCode);
          uid = userCredential.user.uid;
        } catch (confirmErr) {
          throw new Error("Invalid verification code. Please check and try again.");
        }
      } else {
        // Mock confirmation check
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (otpCode !== '123456') {
          throw new Error("Invalid verification code. In Demo Mode, please use 123456.");
        }
      }

      if (isLoginMode) {
        // --- LOGIN VERIFICATION FLOW ---
        try {
          let userData = null;

          // 1. Try reading profile from Cloud Firestore if configured
          if (isConfigured && db) {
            try {
              const docSnap = await getDoc(doc(db, 'registrations', uid));
              if (docSnap.exists()) {
                userData = docSnap.data();
                console.log("User profile fetched from Cloud Firestore:", userData);
              }
            } catch (fsErr) {
              console.warn("Could not fetch user from Firestore, falling back to local DB:", fsErr);
            }
          }

          // 2. Query MongoDB backend API for user verification and sync
          const res = await fetch(`/api/user?phone=${encodeURIComponent(formattedPhone)}&uid=${uid}`);
          if (!res.ok) {
            // User profile not found in MongoDB
            if (userData) {
              // Redundancy check: Sync Firestore record to MongoDB if it exists in Firestore
              try {
                await fetch('/api/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    phone: formattedPhone,
                    role: userData.role,
                    uid: uid,
                    documentUrl: userData.documentUrl
                  })
                });
                console.log("Synchronized Firestore profile to MongoDB successfully.");
              } catch (syncErr) {
                console.error("Failed to sync profile to MongoDB:", syncErr);
              }
            } else {
              // Not registered anywhere!
              setOtpSent(false);
              setOtpCode('');
              setError("No account found for this phone number. We pre-filled it—please register below.");
              if (onSwitchMode) {
                onSwitchMode(); // Switch parent to register mode
              }
              return;
            }
          }

          // Fetch user details from MongoDB response if Firestore query didn't execute/find it
          if (!userData) {
            const data = await res.json();
            userData = data.user;
          }

          setSuccessMsg(`Welcome back, ${userData.name}!`);
          if (onSuccess) {
            onSuccess({
              ...userData,
              isMock: !isConfigured,
              isReturningUser: true,
            });
          }
        } catch (err) {
          throw new Error(err.message || "Failed to fetch user profile details.");
        }
      } else {
        // --- REGISTRATION VERIFICATION FLOW ---
        let docUrl = null;

        // 1. Upload Driver License (Drivers only)
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
            docUrl = `https://mockstorage.googleapis.com/v0/b/magadh/o/drivers%2F${uid}%2Flicense.png`;
          }
        }

        // 2. Prepare payload
        const apiPayload = {
          name,
          email,
          phone: formattedPhone,
          role,
          uid,
          documentUrl: docUrl,
          createdAt: new Date().toISOString()
        };

        // 3. Write profile to Cloud Firestore
        if (isConfigured && db) {
          try {
            await setDoc(doc(db, 'registrations', uid), apiPayload);
            console.log("Successfully stored profile document in Cloud Firestore.");
          } catch (fsErr) {
            console.error("Firestore write failed:", fsErr);
            throw new Error("Failed to write to Cloud Firestore: " + fsErr.message);
          }
        }

        // 4. Save user profile to MongoDB database
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to save registration profile to MongoDB.");
        }

        setSuccessMsg("Registration successful! Welcome to The Taxii.");
        if (onSuccess) {
          onSuccess({
            name,
            email,
            phone: formattedPhone,
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
      setError(err.message || "Verification failed. Please try again.");
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
            ? 'Access your Magadh driver or rider account' 
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
          💡 Running in <strong>Demo Mode</strong>. Phone OTP verification is simulated.
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

      {/* Hidden Recaptcha container */}
      <div id="recaptcha-container"></div>

      {!otpSent ? (
        <form onSubmit={handleSendOtp}>
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
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">Phone Number</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                padding: '0.65rem 0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                fontWeight: '600'
              }}>
                +91
              </span>
              <input
                id="reg-phone"
                type="tel"
                className="form-control"
                placeholder="XXXXXXXXXX"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ''); // numbers only
                  if (val.length <= 10) setPhone(val);
                }}
                disabled={loading}
                required
                style={{ flex: 1, marginTop: 0 }}
              />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              We will send a 6-digit verification code to this number.
            </p>
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
                disabled={loading}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1.25rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span className="spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Sending...
              </span>
            ) : (
              isLoginMode ? 'Send Verification OTP' : 'Send Registration OTP'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="otp-code">Enter Verification Code</label>
            <input
              id="otp-code"
              type="text"
              className="form-control"
              placeholder="123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // numbers only
                if (val.length <= 6) setOtpCode(val);
              }}
              disabled={loading}
              required
              style={{
                letterSpacing: otpCode ? '0.5rem' : 'normal',
                textAlign: otpCode ? 'center' : 'left',
                fontSize: otpCode ? '1.5rem' : '1rem',
                fontWeight: '600'
              }}
            />
          </div>

          {loading && uploadProgress > 0 && (
            <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span>Uploading document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.1s linear' }}></div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || otpCode.length !== 6}
            style={{ width: '100%', marginTop: '1.25rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span className="spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Verifying...
              </span>
            ) : (
              isLoginMode ? 'Verify & Sign In' : 'Verify & Register'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtpCode('');
              setError('');
              setSuccessMsg('');
            }}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.85rem',
              marginTop: '1rem',
              display: 'block',
              width: '100%',
              textAlign: 'center'
            }}
          >
            ← Back to phone number
          </button>
        </form>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          {isLoginMode ? "Don't have an account? " : "Already registered? "}
        </span>
        <button
          onClick={handleSwitchMode}
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
