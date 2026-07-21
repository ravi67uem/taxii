'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

export default function FleetPage() {
  const router = useRouter();

  const vehicles = [
    {
      id: 'go',
      name: 'Taxii Go',
      type: 'Eco Hatchback',
      range: '250 Km Range',
      charging: 'Fast charge 10-80% in 58 mins',
      capacity: '4 Passengers',
      luggage: '1 Medium Bag',
      description: 'Ideal for quick city commutes, solo travelers, and everyday pocket-friendly green rides.',
      features: ['Climate Control', 'Digital Music Stream', 'GPS Tracking', 'USB Charger Port'],
      icon: (
        <svg width="120" height="70" viewBox="0 0 60 35" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#025e4f' }}>
          <path d="M5 24h50v4H5zm6-6.5C11 11 18 10 24 10c7 0 16 1.5 19 6l5 1.5c4 .5 5 2.5 5 4.5v2H7v-2c0-2 1-4.5 4-6.5z" fill="currentColor"/>
          <circle cx="16" cy="27" r="5" fill="#18181b"/>
          <circle cx="44" cy="27" r="5" fill="#18181b"/>
        </svg>
      )
    },
    {
      id: 'comfort',
      name: 'Taxii Comfort',
      type: 'Premium Sedan',
      range: '315 Km Range',
      charging: 'Fast charge 10-80% in 45 mins',
      capacity: '4 Passengers',
      luggage: '2 Large Bags',
      description: 'The executive ride class. Quiet, extra legroom, premium fabric seats, and spacious trunk space for airport transfers.',
      features: ['Silent Electric Cabin', 'High-quality Sound System', 'Spacious Trunk', 'Rear AC Vents', 'Phone Charging Ports'],
      icon: (
        <svg width="125" height="70" viewBox="0 0 65 35" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#025e4f' }}>
          <path d="M3 24h59v4H3zM9 18c0-5 6-7 14-7h15c8 0 14 2 14 7l6 1c2.5.5 3 2 3 3.5v2.5H6V22.5c0-1.5.5-3 3-3.5l1-1z" fill="currentColor"/>
          <circle cx="17" cy="27" r="5.5" fill="#18181b"/>
          <circle cx="48" cy="27" r="5.5" fill="#18181b"/>
        </svg>
      )
    },
    {
      id: 'elite',
      name: 'Taxii Elite',
      type: 'Premium SUV',
      range: '420 Km Range',
      charging: 'Fast charge 10-80% in 35 mins',
      capacity: '6 Passengers',
      luggage: '4 Large Bags',
      description: 'Luxury combined with space. Perfect for large families, outstation tourist travel, or business delegations looking for peak comfort.',
      features: ['Premium Leatherette Seats', 'Panoramic View Sunroof', 'Extra Luggage Rack', 'Independent Climate Zone', 'Premium Wi-Fi Onboard'],
      icon: (
        <svg width="125" height="76" viewBox="0 0 65 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#025e4f' }}>
          <path d="M2 26h61v4H2zM8 20c0-6 6-9 15-9h18c7 0 12 2 14 6l4.5 1c2.5.5 2.5 2 2.5 4v4H6v-4c0-2 .5-3.5 2-4l1.5-1.5z" fill="currentColor"/>
          <circle cx="16" cy="29" r="6" fill="#18181b"/>
          <circle cx="49" cy="29" r="6" fill="#18181b"/>
        </svg>
      )
    }
  ];

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
          <span className="section-subtitle">Our Fleet</span>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '600',
            fontFamily: 'var(--font-serif)',
            color: '#18181b',
            marginBottom: '1rem'
          }}>
            Explore The Electric Fleet
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#71717a', lineHeight: '1.6' }}>
            Choose the ride category that matches your trip requirements. 100% green, silent, and luxurious.
          </p>
        </div>
      </section>

      {/* FLEET GRID */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#ffffff' }}>
        <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {vehicles.map((vehicle, index) => (
            <div key={vehicle.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr',
              gap: '3rem',
              alignItems: 'center',
              backgroundColor: '#faf9f6',
              borderRadius: '20px',
              padding: '2.5rem',
              border: '1px solid rgba(228, 228, 231, 0.6)',
              flexDirection: index % 2 === 1 ? 'row-reverse' : 'row'
            }}>
              {/* Icon / Image visual */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '3rem 1.5rem',
                border: '1px solid rgba(228, 228, 231, 0.4)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
              }}>
                {vehicle.icon}
              </div>

              {/* Text specifications */}
              <div style={{ textAlign: 'left' }}>
                <span style={{
                  color: '#7BB928',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  fontWeight: '700',
                  letterSpacing: '0.1em'
                }}>
                  {vehicle.type}
                </span>
                <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 1rem 0', fontFamily: 'var(--font-serif)', color: '#18181b', fontWeight: '500' }}>
                  {vehicle.name}
                </h2>
                <p style={{ color: '#71717a', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {vehicle.description}
                </p>

                {/* Specs pills */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(2, 94, 79, 0.05)', color: '#025e4f', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                    🔋 {vehicle.range}
                  </span>
                  <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(2, 94, 79, 0.05)', color: '#025e4f', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                    ⚡ {vehicle.charging}
                  </span>
                  <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(2, 94, 79, 0.05)', color: '#025e4f', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                    👥 {vehicle.capacity}
                  </span>
                  <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(2, 94, 79, 0.05)', color: '#025e4f', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                    💼 {vehicle.luggage}
                  </span>
                </div>

                {/* Features list */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem', color: '#18181b' }}>Key Premium Features:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {vehicle.features.map(f => (
                      <li key={f} style={{ fontSize: '0.85rem', color: '#52525b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#7BB928', fontWeight: 'bold' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button onClick={() => router.push('/home')} className="btn-get-started" style={{ padding: '0.75rem 2.25rem' }}>
                  Book {vehicle.name} Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
