'use client';

import { useState, useEffect, useRef } from 'react';
import './BookingWidget.css';

export default function BookingWidget({ onSearchStart }) {
  // Tabs: 'airport', 'rental', 'local', 'outstation'
  const [activeTab, setActiveTab] = useState('airport');
  
  // Sub-toggles
  const [airportSubTab, setAirportSubTab] = useState('drop'); // 'drop' or 'pickup'
  const [outstationSubTab, setOutstationSubTab] = useState('oneway'); // 'oneway' or 'roundtrip'

  // Input states
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [dropTerminal, setDropTerminal] = useState('');
  const [pickupTerminal, setPickupTerminal] = useState('');
  const [rentalPackage, setRentalPackage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [phone, setPhone] = useState('');

  // Coordinates
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);

  // Map modal states
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapTargetField, setMapTargetField] = useState('pickup'); // 'pickup' or 'drop'

  // Refs
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const tempCoordsRef = useRef(null);

  // UI state
  const [validationError, setValidationError] = useState('');
  const [showFareModal, setShowFareModal] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState({ base: 0, tax: 0, total: 0 });

  // Initialize Autocomplete for Input Fields
  useEffect(() => {
    let pickupAutocomplete = null;
    let dropAutocomplete = null;

    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      if (pickupInputRef.current) {
        pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'in' }
        });
        pickupAutocomplete.addListener('place_changed', () => {
          const place = pickupAutocomplete.getPlace();
          if (place && place.geometry && place.geometry.location) {
            setPickup(place.formatted_address || place.name);
            setPickupCoords({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
            setValidationError('');
          }
        });
      }

      if (dropInputRef.current) {
        dropAutocomplete = new window.google.maps.places.Autocomplete(dropInputRef.current, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'in' }
        });
        dropAutocomplete.addListener('place_changed', () => {
          const place = dropAutocomplete.getPlace();
          if (place && place.geometry && place.geometry.location) {
            setDrop(place.formatted_address || place.name);
            setDropCoords({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
            setValidationError('');
          }
        });
      }
    }

    return () => {
      // Clean up autocomplete listeners
      if (pickupAutocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(pickupAutocomplete);
      }
      if (dropAutocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(dropAutocomplete);
      }
    };
  }, [activeTab]);

  // Handle Map Modal Mounting and Init
  const initMap = () => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps) return;

    // Default map center (Patna coordinates or selected location coords if set)
    const initialCoords = mapTargetField === 'pickup'
      ? (pickupCoords || { lat: 25.5941, lng: 85.1376 })
      : (dropCoords || { lat: 25.5941, lng: 85.1376 });

    const mapElement = document.getElementById('booking-map');
    if (!mapElement) return;

    const mapInstance = new window.google.maps.Map(mapElement, {
      center: initialCoords,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    const markerInstance = new window.google.maps.Marker({
      position: initialCoords,
      map: mapInstance,
      draggable: true,
      title: "Drag to pin exact location"
    });

    let tempCoords = { ...initialCoords };

    // Move marker when clicking on the map
    mapInstance.addListener('click', (e) => {
      const clickedCoords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      markerInstance.setPosition(clickedCoords);
      tempCoords = clickedCoords;
    });

    // Capture drag coordinate results
    markerInstance.addListener('dragend', (e) => {
      const draggedCoords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      tempCoords = draggedCoords;
    });

    tempCoordsRef.current = tempCoords;
  };

  useEffect(() => {
    if (mapModalOpen) {
      const timer = setTimeout(() => {
        initMap();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mapModalOpen]);

  const openMapModal = (targetField) => {
    setMapTargetField(targetField);
    setMapModalOpen(true);
  };

  const handleSaveMapLocation = () => {
    const coords = tempCoordsRef.current;
    if (!coords) {
      setMapModalOpen(false);
      return;
    }

    if (mapTargetField === 'pickup') {
      setPickupCoords(coords);
      setPickup("Resolving address...");
    } else {
      setDropCoords(coords);
      setDrop("Resolving address...");
    }

    setMapModalOpen(false);

    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: coords }, (results, status) => {
        if (status === 'OK' && results[0]) {
          if (mapTargetField === 'pickup') {
            setPickup(results[0].formatted_address);
          } else {
            setDrop(results[0].formatted_address);
          }
        } else {
          const fallback = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
          if (mapTargetField === 'pickup') {
            setPickup(fallback);
          } else {
            setDrop(fallback);
          }
        }
      });
    }
  };

  // SVG Icons
  const Icons = {
    Airport: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1.95-2H17.8L12.9 3.1a2 2 0 0 0-2.8 0L9 4.2 12.3 8H6l-2-2v4l3.1.8c.6.2 1.1.7 1.3 1.3L9 16h10.05a2 2 0 0 0 1.95-2z" />
        <path d="M3 21h18" />
      </svg>
    ),
    Rental: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="10" width="20" height="8" rx="2" />
        <path d="m17 10-1.17-2.83a2 2 0 0 0-1.83-1.17H10a2 2 0 0 0-1.83 1.17L7 10" />
        <circle cx="6.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </svg>
    ),
    Local: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    Outstation: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M3 12h18M3 18h18" />
        <circle cx="12" cy="6" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
    Pin: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    Calendar: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    Clock: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    Target: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
      </svg>
    ),
    ChevronDown: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    )
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setValidationError('');
    setPickup('');
    setDrop('');
    setDropTerminal('');
    setPickupTerminal('');
    setRentalPackage('');
    setPickupCoords(null);
    setDropCoords(null);
  };

  // Browser Geolocation trigger (with Google reverse geocoding)
  const triggerCurrentLocation = () => {
    setValidationError('');
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setValidationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPickupCoords({ lat, lng });

        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              setPickup(results[0].formatted_address);
              console.log("Current location resolved:", results[0].formatted_address, { lat, lng });
            } else {
              setPickup(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          });
        } else {
          setPickup(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setValidationError("Unable to access GPS location. Please check browser location permissions.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Calculate Mock Fare
  const handleCheckFare = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!pickup.trim()) {
      setValidationError("Please select or enter your pickup location.");
      return;
    }

    if (activeTab === 'airport') {
      if (airportSubTab === 'drop' && !dropTerminal) {
        setValidationError("Please select a drop terminal.");
        return;
      }
      if (airportSubTab === 'pickup' && !pickupTerminal) {
        setValidationError("Please select a pickup terminal.");
        return;
      }
    } else if (activeTab === 'rental') {
      if (!rentalPackage) {
        setValidationError("Please select a rental duration package.");
        return;
      }
    } else {
      // local or outstation
      if (!drop.trim()) {
        setValidationError("Please enter your drop-off destination.");
        return;
      }
    }

    if (!date) {
      setValidationError("Please select a date for your journey.");
      return;
    }
    if (!time) {
      setValidationError("Please select a time for your journey.");
      return;
    }
    if (!phone || phone.length !== 10) {
      setValidationError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Geocode typed address if coordinates are missing (Fallback resolution)
    let finalPickupCoords = pickupCoords;
    let finalDropCoords = dropCoords;

    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      
      if (!finalPickupCoords) {
        try {
          const result = await new Promise((resolve) => {
            geocoder.geocode({ address: pickup }, (res, status) => {
              if (status === 'OK' && res[0] && res[0].geometry) {
                resolve({ lat: res[0].geometry.location.lat(), lng: res[0].geometry.location.lng() });
              } else {
                resolve(null);
              }
            });
          });
          if (result) finalPickupCoords = result;
        } catch (e) {
          console.error("Geocoding failed for pickup:", e);
        }
      }

      const targetDrop = activeTab === 'local' || activeTab === 'outstation' ? drop : '';
      if (targetDrop && !finalDropCoords) {
        try {
          const result = await new Promise((resolve) => {
            geocoder.geocode({ address: targetDrop }, (res, status) => {
              if (status === 'OK' && res[0] && res[0].geometry) {
                resolve({ lat: res[0].geometry.location.lat(), lng: res[0].geometry.location.lng() });
              } else {
                resolve(null);
              }
            });
          });
          if (result) finalDropCoords = result;
        } catch (e) {
          console.error("Geocoding failed for drop:", e);
        }
      }
    }

    // Store geocoded values back in state
    setPickupCoords(finalPickupCoords);
    setDropCoords(finalDropCoords);

    // Calculate mock pricing
    let base = 0;
    let tax = 0;

    if (activeTab === 'airport') {
      base = airportSubTab === 'drop' ? 950 : 1150;
      tax = 149;
    } else if (activeTab === 'rental') {
      if (rentalPackage.includes('2')) base = 599;
      else if (rentalPackage.includes('4')) base = 1099;
      else if (rentalPackage.includes('8')) base = 1999;
      else base = 2799;
      tax = 99;
    } else if (activeTab === 'local') {
      base = 350;
      tax = 49;
    } else if (activeTab === 'outstation') {
      base = outstationSubTab === 'oneway' ? 2499 : 4499;
      tax = 299;
    }

    setEstimatedFare({
      base,
      tax,
      total: base + tax
    });
    setShowFareModal(true);
  };

  const handleConfirmBooking = () => {
    setShowFareModal(false);
    
    // Callback to parent to open early access modal with coordinates included
    if (onSearchStart) {
      onSearchStart({
        phone,
        pickup,
        drop: activeTab === 'airport' 
          ? (airportSubTab === 'drop' ? dropTerminal : pickupTerminal)
          : (activeTab === 'rental' ? rentalPackage : drop),
        date,
        time,
        fare: estimatedFare.total,
        tab: activeTab,
        pickupCoords,
        dropCoords: activeTab === 'airport' || activeTab === 'rental' ? null : dropCoords
      });
    }
  };

  return (
    <section className="booking-section">
      <div className="booking-card-wrapper">
        
        {/* TABS OVERLAY */}
        <div className="booking-tabs">
          <button 
            type="button" 
            className={`booking-tab ${activeTab === 'airport' ? 'active' : ''}`}
            onClick={() => handleTabChange('airport')}
          >
            <span className="booking-tab-icon" style={{ color: activeTab === 'airport' ? '#025e4f' : '#71717a' }}>
              {Icons.Airport}
            </span>
            Airport Rides
          </button>
          
          <button 
            type="button" 
            className={`booking-tab ${activeTab === 'rental' ? 'active' : ''}`}
            onClick={() => handleTabChange('rental')}
          >
            <span className="booking-tab-icon" style={{ color: activeTab === 'rental' ? '#025e4f' : '#71717a' }}>
              {Icons.Rental}
            </span>
            Rental
          </button>
          
          <button 
            type="button" 
            className={`booking-tab ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => handleTabChange('local')}
          >
            <span className="booking-tab-icon" style={{ color: activeTab === 'local' ? '#025e4f' : '#71717a' }}>
              {Icons.Local}
            </span>
            Local
          </button>
          
          <button 
            type="button" 
            className={`booking-tab ${activeTab === 'outstation' ? 'active' : ''}`}
            onClick={() => handleTabChange('outstation')}
          >
            <span className="booking-tab-icon" style={{ color: activeTab === 'outstation' ? '#025e4f' : '#71717a' }}>
              {Icons.Outstation}
            </span>
            Outstation
          </button>
        </div>

        {/* MAIN SEARCH CARD */}
        <div className="booking-card">
          
          {/* Sub-toggles conditionally loaded */}
          {activeTab === 'airport' && (
            <div className="booking-sub-toggles">
              <button 
                type="button" 
                className={`booking-sub-toggle-btn ${airportSubTab === 'drop' ? 'active' : ''}`}
                onClick={() => setAirportSubTab('drop')}
              >
                Drop To Airport
              </button>
              <button 
                type="button" 
                className={`booking-sub-toggle-btn ${airportSubTab === 'pickup' ? 'active' : ''}`}
                onClick={() => setAirportSubTab('pickup')}
              >
                Pick Up From Airport
              </button>
            </div>
          )}

          {activeTab === 'outstation' && (
            <div className="booking-sub-toggles">
              <button 
                type="button" 
                className={`booking-sub-toggle-btn ${outstationSubTab === 'oneway' ? 'active' : ''}`}
                onClick={() => setOutstationSubTab('oneway')}
              >
                One Way
              </button>
              <button 
                type="button" 
                className={`booking-sub-toggle-btn ${outstationSubTab === 'roundtrip' ? 'active' : ''}`}
                onClick={() => setOutstationSubTab('roundtrip')}
              >
                Round Trip
              </button>
            </div>
          )}

          {/* Validation Feedback */}
          {validationError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              width: '100%',
              marginBottom: '1.25rem',
              boxSizing: 'border-box',
              textAlign: 'left'
            }}>
              ⚠️ {validationError}
            </div>
          )}

          <form onSubmit={handleCheckFare} style={{ width: '100%' }}>
            
            {/* GRID OF FORM CONTROLS */}
            <div className="booking-grid">
              
              {/* Pickup Location */}
              <div className="booking-field">
                <span className="booking-field-icon">{Icons.Pin}</span>
                <input 
                  ref={pickupInputRef}
                  type="text" 
                  className="booking-field-input" 
                  placeholder="Pickup Location"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="btn-geo" 
                  onClick={() => openMapModal('pickup')}
                  title="Pick on map"
                  aria-label="Pick on map"
                  style={{ marginRight: '0.35rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                  </svg>
                </button>
                <button 
                  type="button" 
                  className="btn-geo" 
                  onClick={triggerCurrentLocation}
                  title="Locate me"
                  aria-label="Locate me"
                >
                  {Icons.Target}
                </button>
              </div>

              {/* Dynamic Destination / Drop selection based on tab */}
              {activeTab === 'airport' && airportSubTab === 'drop' && (
                <div className="booking-field">
                  <span className="booking-field-icon">{Icons.Pin}</span>
                  <select 
                    className="booking-field-input booking-field-select" 
                    value={dropTerminal}
                    onChange={(e) => setDropTerminal(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Drop Terminal</option>
                    <option value="Patna Airport (PAT) - Terminal 1">Patna Airport (PAT) - Terminal 1</option>
                    <option value="Gaya Airport (GAY) - Domestic Terminal">Gaya Airport (GAY) - Domestic Terminal</option>
                    <option value="Bodhgaya Heliport - VIP Terminal">Bodhgaya Heliport - VIP Terminal</option>
                  </select>
                  <span style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#71717a', display: 'flex', alignItems: 'center' }}>
                    {Icons.ChevronDown}
                  </span>
                </div>
              )}

              {activeTab === 'airport' && airportSubTab === 'pickup' && (
                <div className="booking-field">
                  <span className="booking-field-icon">{Icons.Pin}</span>
                  <select 
                    className="booking-field-input booking-field-select" 
                    value={pickupTerminal}
                    onChange={(e) => setPickupTerminal(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Pickup Terminal</option>
                    <option value="Patna Airport (PAT) - Arrivals Gate 1">Patna Airport (PAT) - Arrivals Gate 1</option>
                    <option value="Gaya Airport (GAY) - Arrivals Terminal">Gaya Airport (GAY) - Arrivals Terminal</option>
                    <option value="Bodhgaya Heliport - Arrivals Gate">Bodhgaya Heliport - Arrivals Gate</option>
                  </select>
                  <span style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#71717a', display: 'flex', alignItems: 'center' }}>
                    {Icons.ChevronDown}
                  </span>
                </div>
              )}

              {activeTab === 'rental' && (
                <div className="booking-field">
                  <span className="booking-field-icon">{Icons.Pin}</span>
                  <select 
                    className="booking-field-input booking-field-select" 
                    value={rentalPackage}
                    onChange={(e) => setRentalPackage(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Package</option>
                    <option value="2 Hours / 20 Km Package">2 Hours / 20 Km Package</option>
                    <option value="4 Hours / 40 Km Package">4 Hours / 40 Km Package</option>
                    <option value="8 Hours / 80 Km Package">8 Hours / 80 Km Package</option>
                    <option value="12 Hours / 120 Km Package">12 Hours / 120 Km Package</option>
                  </select>
                  <span style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#71717a', display: 'flex', alignItems: 'center' }}>
                    {Icons.ChevronDown}
                  </span>
                </div>
              )}

              {(activeTab === 'local' || activeTab === 'outstation') && (
                <div className="booking-field">
                  <span className="booking-field-icon">{Icons.Pin}</span>
                  <input 
                    ref={dropInputRef}
                    type="text" 
                    className="booking-field-input" 
                    placeholder="Select Drop Location"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="btn-geo" 
                    onClick={() => openMapModal('drop')}
                    title="Pick on map"
                    aria-label="Pick on map"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="10" r="3"/>
                      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Pick a Date */}
              <div className="booking-field">
                <span className="booking-field-icon">{Icons.Calendar}</span>
                <input 
                  type="date" 
                  className="booking-field-input" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Prevents past date selection
                  required
                />
              </div>

              {/* Select Time */}
              <div className="booking-field">
                <span className="booking-field-icon">{Icons.Clock}</span>
                <input 
                  type="time" 
                  className="booking-field-input" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

            </div>

            {/* MOBILE INPUT SECTION */}
            <div className="booking-mobile-block">
              <label className="booking-mobile-label" htmlFor="booking-phone">Mobile Number *</label>
              <div className="booking-mobile-input-wrapper">
                <span className="booking-mobile-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <span className="booking-mobile-prefix">+91</span>
                <input 
                  id="booking-phone"
                  type="tel" 
                  className="booking-mobile-input" 
                  placeholder="Enter your mobile number"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // digits only
                    if (val.length <= 10) setPhone(val);
                  }}
                  required
                />
              </div>
            </div>

            {/* FARE CHECK SUBMIT */}
            <div className="booking-action">
              <button type="submit" className="btn-check-fare">
                Check Fare
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* ESTIMATED FARE DETAIL MODAL */}
      {showFareModal && (
        <div className="fare-modal-overlay" onClick={() => setShowFareModal(false)}>
          <div className="fare-modal-card" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="btn-modal-close" 
              onClick={() => setShowFareModal(false)}
              aria-label="Close modal"
            >
              &times;
            </button>
            
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎫</div>
            <h4 className="fare-modal-title">Fare Estimate</h4>
            <p className="fare-modal-subtitle">
              For your upcoming journey on {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {time}
            </p>

            <div className="fare-details-list">
              <div className="fare-detail-row">
                <span>Trip Type:</span>
                <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>
                  {activeTab} Rides {activeTab === 'airport' ? `(${airportSubTab === 'drop' ? 'Drop' : 'Pickup'})` : ''}
                </span>
              </div>
              <div className="fare-detail-row">
                <span>Pickup:</span>
                <span style={{ fontWeight: '600', maxWidth: '250px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={pickup}>
                  {pickup}
                </span>
              </div>
              {pickupCoords && (
                <div style={{ fontSize: '0.75rem', color: '#71717a', textAlign: 'left', marginTop: '-0.5rem', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                  Coordinates: {pickupCoords.lat.toFixed(5)}, {pickupCoords.lng.toFixed(5)}
                </div>
              )}
              {((activeTab === 'local' || activeTab === 'outstation') && drop) && (
                <div className="fare-detail-row">
                  <span>Drop-off:</span>
                  <span style={{ fontWeight: '600', maxWidth: '250px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={drop}>
                    {drop}
                  </span>
                </div>
              )}
              {dropCoords && (
                <div style={{ fontSize: '0.75rem', color: '#71717a', textAlign: 'left', marginTop: '-0.5rem', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                  Coordinates: {dropCoords.lat.toFixed(5)}, {dropCoords.lng.toFixed(5)}
                </div>
              )}
              <div className="fare-detail-row">
                <span>Base Fare:</span>
                <span>₹{estimatedFare.base}</span>
              </div>
              <div className="fare-detail-row">
                <span>Tolls & Taxes:</span>
                <span>₹{estimatedFare.tax}</span>
              </div>
              <div className="fare-detail-row total">
                <span>Estimated Total:</span>
                <span>₹{estimatedFare.total}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Verify your mobile number via secure SMS OTP to lock this guaranteed price and confirm your booking.
            </p>

            <button 
              type="button" 
              className="btn-get-started" 
              onClick={handleConfirmBooking}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              Lock Price & Book
            </button>
          </div>
        </div>
      )}

      {/* GOOGLE MAPS INTERACTIVE PIN PICKER MODAL */}
      {mapModalOpen && (
        <div className="map-modal-overlay" onClick={() => setMapModalOpen(false)}>
          <div className="map-modal-card" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="btn-modal-close" 
              onClick={() => setMapModalOpen(false)}
              aria-label="Close map"
            >
              &times;
            </button>
            <h4 className="map-modal-title">Select Location on Map</h4>
            <p className="map-modal-subtitle">
              Drag the pin marker or click anywhere on the map to select your exact location coordinates.
            </p>
            
            <div id="booking-map" style={{ width: '100%', height: '350px', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #d4d4d8' }}></div>
            
            <div className="map-btn-group">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setMapModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-get-started" 
                onClick={handleSaveMapLocation}
                style={{ padding: '0.6rem 2rem' }}
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
