export default function Home() {
  return (
    <div className="container">
      {/* Brand logo in a classic border frame */}
      <div className="logo-classic">
        <img
          src="/logo.png"
          alt="Taxii Logo"
          style={{
            height: '90px',
            width: 'auto',
            display: 'block',
            borderRadius: '12px'
          }}
        />
      </div>

      {/* Core message */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
          <span className="status-pill">
            <span className="status-dot"></span>
            Cooking Something New
          </span>
        </div>
        
        <h1>We are preparing something new.</h1>
        
        <p>
          Taxii is building Bihar's first premium, 100% electric smart taxi service. Zero emissions, quiet rides, and reliable local travel are on the way.
        </p>
      </div>

      {/* Minimal progress tracker */}
      <div className="loader-track">
        <div className="loader-bar"></div>
      </div>

      {/* Serving footprint */}
      <div className="region-tag">
        Patna • Gaya • Bodhgaya • Nalanda
      </div>
    </div>
  );
}
