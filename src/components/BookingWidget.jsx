'use client';

import { useState, useEffect, useRef } from 'react';
import './BookingWidget.css';
import { auth, isConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

  // Vehicle Selection: 'go' (Hatchback), 'comfort' (Sedan), 'elite' (SUV)
  const [selectedVehicle, setSelectedVehicle] = useState('go');

  // Map modal states
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapTargetField, setMapTargetField] = useState('pickup'); // 'pickup' or 'drop'

  // Refs
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const tempCoordsRef = useRef(null);

  // UI state
  const [validationError, setValidationError] = useState('');

  // Auto-prefill phone number if user is already logged in
  useEffect(() => {
    if (!isConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.phoneNumber) {
        const clean = currentUser.phoneNumber.replace('+91', '');
        setPhone(clean);
      }
    });
    return () => unsubscribe();
  }, []);

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState(null); // 'pickup' or 'drop'
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Close suggestions when click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setPickupSuggestions([]);
      setDropSuggestions([]);
      setActiveSuggestionField(null);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', handleOutsideClick);
      }
    };
  }, []);

  const fetchSuggestions = (queryStr, field) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (!queryStr || queryStr.trim().length < 3) {
      if (field === 'pickup') setPickupSuggestions([]);
      if (field === 'drop') setDropSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=5&countrycodes=in`);
        if (res.ok) {
          const data = await res.json();
          if (field === 'pickup') {
            setPickupSuggestions(data);
            setActiveSuggestionField('pickup');
          } else {
            setDropSuggestions(data);
            setActiveSuggestionField('drop');
          }
        }
      } catch (err) {
        console.error("Nominatim search failed:", err);
      }
    }, 450);

    setSearchTimeout(timeout);
  };

  const handleSelectPickupSuggestion = (item) => {
    setPickup(item.display_name);
    setPickupCoords({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    });
    setPickupSuggestions([]);
    setActiveSuggestionField(null);
  };

  const handleSelectDropSuggestion = (item) => {
    setDrop(item.display_name);
    setDropCoords({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    });
    setDropSuggestions([]);
    setActiveSuggestionField(null);
  };

  // Handle Map Modal Mounting and Init
  const initMap = () => {
    if (typeof window === 'undefined' || !window.L) return;

    // Default map center (Patna coordinates or selected location coords if set)
    const initialCoords = mapTargetField === 'pickup'
      ? (pickupCoords || { lat: 25.5941, lng: 85.1376 })
      : (dropCoords || { lat: 25.5941, lng: 85.1376 });

    const mapElement = document.getElementById('booking-map');
    if (!mapElement) return;

    // Clean up old instance to avoid leaflet container re-initialization error
    if (window._leafletMap) {
      try {
        window._leafletMap.remove();
      } catch (e) {
        console.warn("Leaflet previous instance remove failed:", e);
      }
      window._leafletMap = null;
    }

    // Configure default CDN marker icons
    const DefaultIcon = window.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    window.L.Marker.prototype.options.icon = DefaultIcon;

    const mapInstance = window.L.map(mapElement).setView([initialCoords.lat, initialCoords.lng], 15);
    window._leafletMap = mapInstance;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    const markerInstance = window.L.marker([initialCoords.lat, initialCoords.lng], {
      draggable: true
    }).addTo(mapInstance);

    let tempCoords = { ...initialCoords };

    // Move marker when clicking on the map
    mapInstance.on('click', (e) => {
      const clickedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
      markerInstance.setLatLng([clickedCoords.lat, clickedCoords.lng]);
      tempCoords = clickedCoords;
    });

    // Capture drag coordinate results
    markerInstance.on('dragend', (e) => {
      const draggedCoords = { lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng };
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

    // Call Nominatim API for reverse geocoding
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'en'
      }
    })
    .then(res => res.json())
    .then(data => {
      const resolvedAddress = data.display_name || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      if (mapTargetField === 'pickup') {
        setPickup(resolvedAddress);
      } else {
        setDrop(resolvedAddress);
      }
    })
    .catch(err => {
      console.error("Reverse geocoding error:", err);
      const fallback = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      if (mapTargetField === 'pickup') {
        setPickup(fallback);
      } else {
        setDrop(fallback);
      }
    });
  };

  // Helper: check if route fields are filled to show vehicle selector
  const isRouteSelected = () => {
    if (!pickup.trim()) return false;
    if (activeTab === 'airport') {
      if (airportSubTab === 'drop' && !dropTerminal) return false;
      if (airportSubTab === 'pickup' && !pickupTerminal) return false;
    } else if (activeTab === 'rental') {
      if (!rentalPackage) return false;
    } else {
      if (!drop.trim()) return false;
    }
    return !!(date && time);
  };

  // Helper: calculate fare dynamically
  const calculateFare = (vClass, tab, subTab, pkg) => {
    let base = 0;
    let tax = 0;

    if (tab === 'airport') {
      base = subTab === 'drop' ? 950 : 1150;
      tax = 149;
    } else if (tab === 'rental') {
      if (pkg.includes('2')) base = 599;
      else if (pkg.includes('4')) base = 1099;
      else if (pkg.includes('8')) base = 1999;
      else base = 2799;
      tax = 99;
    } else if (tab === 'local') {
      base = 350;
      tax = 49;
    } else if (tab === 'outstation') {
      base = subTab === 'oneway' ? 2499 : 4499;
      tax = 299;
    }

    // Apply multipliers for vehicle classes
    if (vClass === 'comfort') {
      base = Math.round(base * 1.3);
      tax = Math.round(tax * 1.3);
    } else if (vClass === 'elite') {
      base = Math.round(base * 1.8);
      tax = Math.round(tax * 1.8);
    }

    return { base, tax, total: base + tax };
  };

  // Confirm booking & trigger Early Access OTP login/registration
  const handleBookRide = async (e) => {
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

    // Resolve coordinates in background if missing via Nominatim API
    let finalPickupCoords = pickupCoords;
    let finalDropCoords = dropCoords;

    const resolveAddressCoords = async (address) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=in`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        }
      } catch (e) {
        console.error("Nominatim geocode failed:", e);
      }
      return null;
    };

    if (!finalPickupCoords) {
      const result = await resolveAddressCoords(pickup);
      if (result) finalPickupCoords = result;
    }

    const targetDrop = activeTab === 'local' || activeTab === 'outstation' ? drop : '';
    if (targetDrop && !finalDropCoords) {
      const result = await resolveAddressCoords(targetDrop);
      if (result) finalDropCoords = result;
    }

    setPickupCoords(finalPickupCoords);
    setDropCoords(finalDropCoords);

    // Get fare for chosen vehicle
    const subTabVal = activeTab === 'airport' ? airportSubTab : outstationSubTab;
    const fareDetails = calculateFare(selectedVehicle, activeTab, subTabVal, rentalPackage);

    // Get human readable vehicle class
    const vehicleNames = {
      go: 'Taxii Go (Eco)',
      comfort: 'Taxii Comfort (Sedan)',
      elite: 'Taxii Elite (SUV)'
    };

    // Callback to parent to open early access modal
    if (onSearchStart) {
      onSearchStart({
        phone,
        pickup,
        drop: activeTab === 'airport' 
          ? (airportSubTab === 'drop' ? dropTerminal : pickupTerminal)
          : (activeTab === 'rental' ? rentalPackage : drop),
        date,
        time,
        fare: fareDetails.total,
        tab: activeTab,
        pickupCoords: finalPickupCoords,
        dropCoords: activeTab === 'airport' || activeTab === 'rental' ? null : finalDropCoords,
        vehicleClass: selectedVehicle,
        vehicleName: vehicleNames[selectedVehicle]
      });
    }
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

        // Call Nominatim API for reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: {
            'Accept-Language': 'en'
          }
        })
        .then(res => res.json())
        .then(data => {
          setPickup(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          console.log("Current location resolved:", data.display_name, { lat, lng });
        })
        .catch(err => {
          console.error("Geolocation reverse geocoding error:", err);
          setPickup(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
        setValidationError("Unable to access GPS location. Please check browser location permissions.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
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
    ),
    Hatchback: (
      <svg width="60" height="35" viewBox="0 0 60 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 24h50v4H5zm6-6.5C11 11 18 10 24 10c7 0 16 1.5 19 6l5 1.5c4 .5 5 2.5 5 4.5v2H7v-2c0-2 1-4.5 4-6.5z" fill="currentColor"/>
        <circle cx="16" cy="27" r="5" fill="#18181b"/>
        <circle cx="44" cy="27" r="5" fill="#18181b"/>
      </svg>
    ),
    Sedan: (
      <svg width="65" height="35" viewBox="0 0 65 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 24h59v4H3zM9 18c0-5 6-7 14-7h15c8 0 14 2 14 7l6 1c2.5.5 3 2 3 3.5v2.5H6V22.5c0-1.5.5-3 3-3.5l1-1z" fill="currentColor"/>
        <circle cx="17" cy="27" r="5.5" fill="#18181b"/>
        <circle cx="48" cy="27" r="5.5" fill="#18181b"/>
      </svg>
    ),
    SUV: (
      <svg width="65" height="38" viewBox="0 0 65 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 26h61v4H2zM8 20c0-6 6-9 15-9h18c7 0 12 2 14 6l4.5 1c2.5.5 2.5 2 2.5 4v4H6v-4c0-2 .5-3.5 2-4l1.5-1.5z" fill="currentColor"/>
        <circle cx="16" cy="29" r="6" fill="#18181b"/>
        <circle cx="49" cy="29" r="6" fill="#18181b"/>
      </svg>
    )
  };

  const showVehicles = isRouteSelected();
  const subTabVal = activeTab === 'airport' ? airportSubTab : outstationSubTab;

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

          <form onSubmit={handleBookRide} style={{ width: '100%' }}>
            
            {/* GRID OF FORM CONTROLS */}
            <div className="booking-grid">
              
              {/* Pickup Location */}
              <div className="booking-field" style={{ position: 'relative' }}>
                <span className="booking-field-icon">{Icons.Pin}</span>
                <input 
                  ref={pickupInputRef}
                  type="text" 
                  className="booking-field-input" 
                  placeholder="Pickup Location"
                  value={pickup}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    fetchSuggestions(e.target.value, 'pickup');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pickupSuggestions.length > 0) setActiveSuggestionField('pickup');
                  }}
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

                {pickupSuggestions.length > 0 && activeSuggestionField === 'pickup' && (
                  <div className="autocomplete-suggestions" onClick={(e) => e.stopPropagation()}>
                    {pickupSuggestions.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="suggestion-item" 
                        onClick={() => handleSelectPickupSuggestion(item)}
                      >
                        <span style={{ marginRight: '0.5rem' }}>📍</span>
                        <span className="suggestion-text">{item.display_name}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                <div className="booking-field" style={{ position: 'relative' }}>
                  <span className="booking-field-icon">{Icons.Pin}</span>
                  <input 
                    ref={dropInputRef}
                    type="text" 
                    className="booking-field-input" 
                    placeholder="Select Drop Location"
                    value={drop}
                    onChange={(e) => {
                      setDrop(e.target.value);
                      fetchSuggestions(e.target.value, 'drop');
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dropSuggestions.length > 0) setActiveSuggestionField('drop');
                    }}
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

                  {dropSuggestions.length > 0 && activeSuggestionField === 'drop' && (
                    <div className="autocomplete-suggestions" onClick={(e) => e.stopPropagation()}>
                      {dropSuggestions.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="suggestion-item" 
                          onClick={() => handleSelectDropSuggestion(item)}
                        >
                          <span style={{ marginRight: '0.5rem' }}>📍</span>
                          <span className="suggestion-text">{item.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                  min={new Date().toISOString().split('T')[0]} 
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

            {/* VEHICLE SELECTION GRID & PHONE BLOCKS (LOADED DYNAMICALLY) */}
            {showVehicles ? (
              <>
                <div className="booking-vehicles-section">
                  <span className="booking-vehicles-title">Select Ride Option</span>
                  <div className="booking-vehicles-grid">
                    
                    {/* Taxii Go */}
                    <div 
                      className={`vehicle-card ${selectedVehicle === 'go' ? 'active' : ''}`}
                      onClick={() => setSelectedVehicle('go')}
                    >
                      <div className="vehicle-icon-wrapper">{Icons.Hatchback}</div>
                      <div className="vehicle-name">Taxii Go</div>
                      <div className="vehicle-details">
                        <span>🚴 4 Seats</span>
                        <span>•</span>
                        <span>💼 1 Bag</span>
                      </div>
                      <div className="vehicle-price">
                        ₹{calculateFare('go', activeTab, subTabVal, rentalPackage).total}
                      </div>
                    </div>

                    {/* Taxii Comfort */}
                    <div 
                      className={`vehicle-card ${selectedVehicle === 'comfort' ? 'active' : ''}`}
                      onClick={() => setSelectedVehicle('comfort')}
                    >
                      <div className="vehicle-icon-wrapper">{Icons.Sedan}</div>
                      <div className="vehicle-name">Taxii Comfort</div>
                      <div className="vehicle-details">
                        <span>🚖 4 Seats</span>
                        <span>•</span>
                        <span>💼 2 Bags</span>
                      </div>
                      <div className="vehicle-price">
                        ₹{calculateFare('comfort', activeTab, subTabVal, rentalPackage).total}
                      </div>
                    </div>

                    {/* Taxii Elite */}
                    <div 
                      className={`vehicle-card ${selectedVehicle === 'elite' ? 'active' : ''}`}
                      onClick={() => setSelectedVehicle('elite')}
                    >
                      <div className="vehicle-icon-wrapper">{Icons.SUV}</div>
                      <div className="vehicle-name">Taxii Elite</div>
                      <div className="vehicle-details">
                        <span>🚙 6 Seats</span>
                        <span>•</span>
                        <span>💼 4 Bags</span>
                      </div>
                      <div className="vehicle-price">
                        ₹{calculateFare('elite', activeTab, subTabVal, rentalPackage).total}
                      </div>
                    </div>

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
                        const val = e.target.value.replace(/\D/g, ''); 
                        if (val.length <= 10) setPhone(val);
                      }}
                      required
                    />
                  </div>
                </div>

                {/* FARE CHECK SUBMIT */}
                <div className="booking-action">
                  <button type="submit" className="btn-check-fare">
                    Lock Price & Book
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                width: '100%',
                padding: '2rem 1.5rem',
                backgroundColor: 'rgba(2, 94, 79, 0.02)',
                border: '1px dashed rgba(2, 94, 79, 0.15)',
                borderRadius: '12px',
                fontSize: '0.85rem',
                color: '#52525b',
                boxSizing: 'border-box',
                marginTop: '1rem',
                marginBottom: '1rem'
              }}>
                ℹ️ Please fill in your pickup location, drop-off destination, and date/time above to view available vehicles and fare rates.
              </div>
            )}

          </form>

        </div>
      </div>

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
