'use client';

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#060907',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 60%), radial-gradient(circle at 50% 50%, #060907 0%, #030403 100%)',
      color: '#f3f4f6',
      textAlign: 'center',
      fontFamily: 'var(--font-display), sans-serif',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Centered subtle green glow spot in the background */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{ 
        zIndex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '2.5rem', 
        padding: '2rem',
        animation: 'fadeInSlideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {/* Pulsing & Floating Logo Container */}
        <img
          src="/logo.png"
          alt="Magadh EV Cabs Logo"
          className="logo-pulse"
          style={{
            height: '130px',
            width: 'auto',
            borderRadius: '28px',
            border: '2px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.3)',
          }}
          onError={(e) => {
            // Safe fallback if the logo is missing
            e.target.style.display = 'none';
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Title Banner */}
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '900',
            letterSpacing: '-0.03em',
            margin: 0,
            background: 'linear-gradient(135deg, #ffffff 40%, #10b981 85%, #eab308 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 40px rgba(16, 185, 129, 0.15)'
          }}>
            Cooking Something Amazing
          </h1>
          
          {/* Subtle Tagline */}
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            margin: '0 auto',
            fontWeight: '400',
            letterSpacing: '0.01em',
            maxWidth: '520px',
            lineHeight: '1.6'
          }}>
            Magadh EV Cabs is preparing Bihar's first premium, fully-electric taxi fleet. Clean, silent, and smart rides are on the way.
          </p>
        </div>

        {/* Custom loader bar */}
        <div style={{
          width: '220px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.02)',
          position: 'relative'
        }}>
          <div 
            className="shimmer-bar"
            style={{
              height: '100%',
              backgroundColor: 'var(--primary)',
              borderRadius: '2px',
              width: '45%',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
              position: 'absolute'
            }}
          ></div>
        </div>
        
        {/* Regional indicators */}
        <span style={{
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.25)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontWeight: '600',
          marginTop: '1.5rem',
          fontFamily: 'var(--font-sans)',
          animation: 'pulseMuted 4s ease-in-out infinite'
        }}>
          Patna • Gaya • Bodhgaya • Nalanda
        </span>
      </div>

      <style jsx global>{`
        @keyframes fadeInSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseMuted {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
