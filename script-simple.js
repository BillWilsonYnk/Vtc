// Version simplifiée et fonctionnelle avec Google Maps
console.log('Script simple chargé');

// Google Maps variables
let map;
let departureMarker;
let arrivalMarker;
let directionsService;
let directionsRenderer;
let departureAutocomplete;
let arrivalAutocomplete;
let geocoder;
let currentMapClick = null;

// Vehicle data
const vehicles = [
    { id: 'berline', name: 'Berline', basePrice: 1.5, minPrice: 30, capacity: 4, icon: '🚗' },
    { id: 'eco', name: 'Éco', basePrice: 1.2, minPrice: 25, capacity: 4, icon: '🚙' },
    { id: 'van', name: 'Van', basePrice: 2.0, minPrice: 40, capacity: 8, icon: '🚐' }
];

let bookingData = {
    departure: '',
    arrival: '',
    distance: 0,
    vehicle: null,
    fullName: '',
    phone: '',
    email: '',
    departureDate: '',
    departureTime: '',
    passengers: 1,
    luggage: 0,
    notes: ''
};

let currentStep = 1;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('Initialisation...');
    
    // Initialize Google Maps after a short delay to ensure API is loaded
    // Try multiple times in case API loads slowly
    let attempts = 0;
    const maxAttempts = 5;
    
    const tryInitMaps = () => {
        attempts++;
        if (typeof google !== 'undefined' && google.maps) {
            initializeGoogleMaps();
        } else if (attempts < maxAttempts) {
            setTimeout(tryInitMaps, 500);
        } else {
            console.log('Google Maps API not available after multiple attempts');
            showMapFallback();
        }
    };
    
    setTimeout(tryInitMaps, 500);
    
    // Load vehicles
    const vehicleSelect = document.getElementById('vehicle');
    if (vehicleSelect) {
        vehicleSelect.innerHTML = '<option value="">Sélectionnez un véhicule</option>';
        vehicles.forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `${v.icon} ${v.name} - ${v.capacity} places`;
            vehicleSelect.appendChild(option);
        });
    }
    
    // Navigation buttons
    const nextStep1 = document.getElementById('nextStep1');
    if (nextStep1) {
        nextStep1.addEventListener('click', () => {
            const departure = document.getElementById('departure')?.value.trim();
            const arrival = document.getElementById('arrival')?.value.trim();
            
            if (!departure || !arrival) {
                alert('Veuillez remplir les deux adresses');
                return;
            }
            
            bookingData.departure = departure;
            bookingData.arrival = arrival;
            
            // Calculate distance with Google Maps if available
            if (typeof google !== 'undefined' && google.maps && directionsService) {
                calculateDistanceWithGoogleMaps();
            } else {
                // Fallback calculation
                bookingData.distance = Math.floor(Math.random() * 50) + 10;
                
                const distanceInfo = document.getElementById('distanceInfo');
                const distanceValue = document.getElementById('distanceValue');
                if (distanceInfo && distanceValue) {
                    distanceValue.textContent = bookingData.distance;
                    distanceInfo.style.display = 'block';
                }
            }
            
            goToStep(2);
        });
    }
    
    const prevStep2 = document.getElementById('prevStep2');
    if (prevStep2) {
        prevStep2.addEventListener('click', () => goToStep(1));
    }
    
    // Confirm booking
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            submitBooking();
        });
    }
    
    // Location button for departure
    const locationBtn = document.getElementById('getLocationBtn');
    if (locationBtn) {
        console.log('✅ Location button found, adding event listener');
        locationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📍 Location button clicked for departure');
            try {
                getLocationAndConvert('departure', 'getLocationBtn', 'locationStatus');
            } catch (error) {
                console.error('Error in location button handler:', error);
                const status = document.getElementById('locationStatus');
                if (status) {
                    status.textContent = '❌ Erreur: ' + error.message;
                    status.style.color = '#e74c3c';
                    status.style.display = 'block';
                }
            }
        });
    } else {
        console.error('❌ Location button (getLocationBtn) not found!');
    }
    
    // Location button for arrival
    const locationArrivalBtn = document.getElementById('getLocationArrivalBtn');
    if (locationArrivalBtn) {
        console.log('✅ Location arrival button found, adding event listener');
        locationArrivalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📍 Location button clicked for arrival');
            try {
                getLocationAndConvert('arrival', 'getLocationArrivalBtn', 'locationStatusArrival');
            } catch (error) {
                console.error('Error in location button handler:', error);
                const status = document.getElementById('locationStatusArrival');
                if (status) {
                    status.textContent = '❌ Erreur: ' + error.message;
                    status.style.color = '#e74c3c';
                    status.style.display = 'block';
                }
            }
        });
    } else {
        console.error('❌ Location arrival button (getLocationArrivalBtn) not found!');
    }
    
    // Set current year
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
    
    // Set min date
    const dateInput = document.getElementById('departureDate');
    if (dateInput) {
        dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }
    
    // Mobile menu
    const menuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length > 0) {
        console.log('Tab buttons found:', tabButtons.length);
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = btn.dataset.tab;
                console.log('Tab clicked:', tab);
                
                // Remove active class from all tabs
                tabButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked tab
                btn.classList.add('active');
                
                // If tarifs tab, scroll to pricing section
                if (tab === 'tarifs') {
                    const tarifsSection = document.getElementById('tarifs');
                    if (tarifsSection) {
                        tarifsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        console.warn('Tarifs section not found');
                    }
                }
                // If reservation tab, scroll back to form
                else if (tab === 'reservation') {
                    const bookingForm = document.getElementById('bookingForm');
                    if (bookingForm) {
                        bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    } else {
        console.warn('No tab buttons found');
    }
    
    // Update price when vehicle changes
    if (vehicleSelect) {
        vehicleSelect.addEventListener('change', updatePrice);
    }
    
    console.log('Initialisation terminée');
}

// Initialize Google Maps
function initializeGoogleMaps() {
    // Check if Google Maps is available
    if (typeof google === 'undefined' || !google.maps) {
        console.warn('Google Maps API not loaded - using fallback mode');
        showMapFallback();
        return false;
    }
    
    try {
        // Initialize map
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.warn('Map container not found');
            return false;
        }
        
        map = new google.maps.Map(mapContainer, {
            center: { lat: 48.8566, lng: 2.3522 }, // Paris center
            zoom: 12,
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: false,
            zoomControl: true
        });
        
        // Handle map errors
        google.maps.event.addListener(map, 'error', function() {
            console.error('Google Maps error occurred');
            showMapFallback();
        });
        
        // Initialize services
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: false
        });
        geocoder = new google.maps.Geocoder();
        
        // Initialize autocomplete for departure
        const departureInput = document.getElementById('departure');
        if (departureInput) {
            departureAutocomplete = new google.maps.places.Autocomplete(departureInput, {
                componentRestrictions: { country: 'fr' },
                fields: ['geometry', 'formatted_address', 'address_components']
            });
            
            departureAutocomplete.addListener('place_changed', () => {
                const place = departureAutocomplete.getPlace();
                if (place.geometry) {
                    updateMapWithPlace(place, 'departure');
                    calculateDistanceWithGoogleMaps();
                }
            });
        }
        
        // Initialize autocomplete for arrival
        const arrivalInput = document.getElementById('arrival');
        if (arrivalInput) {
            arrivalAutocomplete = new google.maps.places.Autocomplete(arrivalInput, {
                componentRestrictions: { country: 'fr' },
                fields: ['geometry', 'formatted_address', 'address_components']
            });
            
            arrivalAutocomplete.addListener('place_changed', () => {
                const place = arrivalAutocomplete.getPlace();
                if (place.geometry) {
                    updateMapWithPlace(place, 'arrival');
                    calculateDistanceWithGoogleMaps();
                }
            });
        }
        
        // Map click handler
        map.addListener('click', (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            // Show button to use this location
            const useMapLocationBtn = document.getElementById('useMapLocation');
            if (useMapLocationBtn) {
                useMapLocationBtn.style.display = 'block';
                currentMapClick = { lat, lng };
            }
        });
        
        // Button to use clicked location
        const useMapLocationBtn = document.getElementById('useMapLocation');
        if (useMapLocationBtn) {
            useMapLocationBtn.addEventListener('click', () => {
                if (currentMapClick) {
                    // Determine which field to fill based on which is empty
                    const departureInput = document.getElementById('departure');
                    const arrivalInput = document.getElementById('arrival');
                    
                    if (!departureInput.value.trim()) {
                        convertCoordinatesToAddress(currentMapClick.lat, currentMapClick.lng, departureInput, null, document.getElementById('locationStatus'));
                    } else if (!arrivalInput.value.trim()) {
                        convertCoordinatesToAddress(currentMapClick.lat, currentMapClick.lng, arrivalInput, null, document.getElementById('locationStatusArrival'));
                    }
                    
                    useMapLocationBtn.style.display = 'none';
                    currentMapClick = null;
                }
            });
        }
        
        console.log('Google Maps initialisé');
        return true;
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        showMapFallback();
        return false;
    }
}

// Show fallback message if Google Maps fails
function showMapFallback() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 400px; background: #f5f5f5; border-radius: 8px; flex-direction: column; padding: 20px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                <h3 style="margin-bottom: 0.5rem; color: #333;">Carte non disponible</h3>
                <p style="color: #666; margin-bottom: 1rem;">Pour activer la carte interactive, configurez votre clé API Google Maps dans index.html</p>
                <p style="color: #999; font-size: 0.9rem;">Le formulaire fonctionne toujours normalement sans la carte.</p>
            </div>
        `;
    }
}

// Update map with place
function updateMapWithPlace(place, type) {
    if (!map || !place.geometry) return;
    
    const location = place.geometry.location;
    
    if (type === 'departure') {
        if (departureMarker) {
            departureMarker.setPosition(location);
        } else {
            departureMarker = new google.maps.Marker({
                position: location,
                map: map,
                title: 'Départ',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#27ae60',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2
                }
            });
        }
    } else if (type === 'arrival') {
        if (arrivalMarker) {
            arrivalMarker.setPosition(location);
        } else {
            arrivalMarker = new google.maps.Marker({
                position: location,
                map: map,
                title: 'Arrivée',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#e74c3c',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2
                }
            });
        }
    }
    
    // Center map on the place
    map.setCenter(location);
    
    // Update route if both addresses are set
    const departure = document.getElementById('departure').value.trim();
    const arrival = document.getElementById('arrival').value.trim();
    
    if (departure && arrival) {
        calculateRoute();
    }
}

// Calculate route with Google Maps
function calculateRoute() {
    if (!directionsService || !directionsRenderer) return;
    
    const departure = document.getElementById('departure').value.trim();
    const arrival = document.getElementById('arrival').value.trim();
    
    if (!departure || !arrival) return;
    
    directionsService.route({
        origin: departure,
        destination: arrival,
        travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
        if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
            
            // Extract distance and duration
            const route = result.routes[0];
            const leg = route.legs[0];
            
            const distance = Math.round(leg.distance.value / 1000); // km
            const duration = leg.duration.text;
            
            bookingData.distance = distance;
            
            // Update UI
            const distanceValue = document.getElementById('distanceValue');
            const durationValue = document.getElementById('durationValue');
            const distanceInfo = document.getElementById('distanceInfo');
            
            if (distanceValue) distanceValue.textContent = distance;
            if (durationValue) durationValue.textContent = duration;
            if (distanceInfo) distanceInfo.style.display = 'block';
            
            // Update price if vehicle is selected
            const vehicleSelect = document.getElementById('vehicle');
            if (vehicleSelect && vehicleSelect.value) {
                updatePrice();
            }
        }
    });
}

// Calculate distance with Google Maps
function calculateDistanceWithGoogleMaps() {
    const departure = document.getElementById('departure').value.trim();
    const arrival = document.getElementById('arrival').value.trim();
    
    if (!departure || !arrival) return;
    
    if (typeof google !== 'undefined' && google.maps && directionsService) {
        calculateRoute();
    } else {
        // Fallback to manual calculation
        const distance = Math.floor(Math.random() * 50) + 10;
        bookingData.distance = distance;
        
        const distanceInfo = document.getElementById('distanceInfo');
        const distanceValue = document.getElementById('distanceValue');
        if (distanceInfo && distanceValue) {
            distanceValue.textContent = distance;
            distanceInfo.style.display = 'block';
        }
    }
}

// Fallback distance calculation
function calculateDistance() {
    const departure = document.getElementById('departure')?.value.trim();
    const arrival = document.getElementById('arrival')?.value.trim();
    
    if (!departure || !arrival) return;
    
    const distance = Math.floor(Math.random() * 50) + 10;
    bookingData.distance = distance;
    
    const distanceInfo = document.getElementById('distanceInfo');
    const distanceValue = document.getElementById('distanceValue');
    if (distanceInfo && distanceValue) {
        distanceValue.textContent = distance;
        distanceInfo.style.display = 'block';
    }
}

function goToStep(step) {
    const step1 = document.querySelector('.step[data-step="1"]');
    const step2 = document.querySelector('.step[data-step="2"]');
    
    if (step === 1) {
        if (step1) step1.classList.add('active');
        if (step2) step2.classList.remove('active');
    } else {
        if (step1) step1.classList.remove('active');
        if (step2) step2.classList.add('active');
    }
    
    currentStep = step;
}

function updatePrice() {
    const vehicleSelect = document.getElementById('vehicle');
    if (!vehicleSelect || !vehicleSelect.value || !bookingData.distance) return;
    
    const vehicle = vehicles.find(v => v.id === vehicleSelect.value);
    if (!vehicle) return;
    
    const price = Math.max(vehicle.minPrice, Math.round(vehicle.basePrice * bookingData.distance));
    
    const totalPrice = document.getElementById('totalPrice');
    const priceSummary = document.getElementById('priceSummary');
    
    if (totalPrice) totalPrice.textContent = price;
    if (priceSummary) priceSummary.style.display = 'block';
    
    const summaryDistance = document.getElementById('summaryDistance');
    const summaryVehicle = document.getElementById('summaryVehicle');
    if (summaryDistance) summaryDistance.textContent = bookingData.distance;
    if (summaryVehicle) summaryVehicle.textContent = vehicle.name;
}

// Get location and convert to address
function getLocationAndConvert(inputId, buttonId, statusId) {
    console.log('getLocationAndConvert called with:', inputId, buttonId, statusId);
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    const status = document.getElementById(statusId);
    
    console.log('Elements found:', { input: !!input, button: !!button, status: !!status });
    
    if (!navigator || !navigator.geolocation) {
        console.error('Geolocation not supported');
        if (status) {
            status.textContent = '❌ Géolocalisation non supportée par votre navigateur';
            status.style.color = '#e74c3c';
            status.style.display = 'block';
        }
        return;
    }
    
    console.log('Geolocation is available, requesting position...');
    
    // Show loading
    if (button) {
        button.disabled = true;
        button.textContent = '⏳...';
        button.classList.add('loading');
    }
    if (status) {
        status.textContent = 'Recherche de votre position...';
        status.style.color = '#666';
        status.style.display = 'block';
    }
    
    // Use high accuracy for better address precision
    const options = {
        enableHighAccuracy: true, // More accurate position
        timeout: 8000, // 8 seconds max
        maximumAge: 0 // Don't use cached position, get fresh one
    };
    
    let timeoutId = setTimeout(() => {
        if (status) {
            status.textContent = '⏳ Recherche en cours, veuillez patienter...';
        }
    }, 2000);
    
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            clearTimeout(timeoutId);
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            
            console.log('Position obtenue:', lat, lng);
            
            if (status) {
                status.textContent = '📍 Conversion de l\'adresse...';
            }
            
            // Try to convert coordinates to address
            convertCoordinatesToAddress(lat, lng, input, button, status);
        },
        (err) => {
            clearTimeout(timeoutId);
            console.error('Erreur géolocalisation:', err);
            console.error('Error code:', err.code, 'Error message:', err.message);
            
            let errorMsg = 'Erreur de géolocalisation';
            // Handle both constant values and error code numbers
            const errorCode = err.code || (err.PERMISSION_DENIED ? 1 : err.POSITION_UNAVAILABLE ? 2 : err.TIMEOUT ? 3 : 0);
            
            switch(errorCode) {
                case 1: // PERMISSION_DENIED
                case err.PERMISSION_DENIED:
                    errorMsg = 'Permission refusée. Cliquez sur l\'icône de cadenas dans la barre d\'adresse et autorisez l\'accès à votre position.';
                    console.error('Permission denied - user needs to allow location access');
                    break;
                case 2: // POSITION_UNAVAILABLE
                case err.POSITION_UNAVAILABLE:
                    errorMsg = 'Position indisponible. Vérifiez votre connexion GPS/WiFi et réessayez.';
                    console.error('Position unavailable');
                    break;
                case 3: // TIMEOUT
                case err.TIMEOUT:
                    errorMsg = 'Délai dépassé. Réessayez ou entrez l\'adresse manuellement.';
                    console.error('Timeout - location request took too long');
                    break;
                default:
                    errorMsg = 'Erreur de géolocalisation. Code: ' + errorCode;
                    console.error('Unknown geolocation error:', errorCode);
            }
            
            if (status) {
                status.textContent = '❌ ' + errorMsg;
                status.style.color = '#e74c3c';
                status.style.display = 'block';
            }
            if (button) {
                button.disabled = false;
                button.textContent = '📍 Localiser';
                button.classList.remove('loading');
            }
        },
        options
    );
}

// Convert coordinates to address using reverse geocoding with multiple precision levels
function convertCoordinatesToAddress(lat, lng, input, button, status) {
    if (status) {
        status.textContent = '📍 Recherche précise de l\'adresse...';
    }
    
    // Try multiple methods simultaneously for best accuracy
    const promises = [];
    
    // Method 1: Google Maps (if available)
    if (typeof google !== 'undefined' && google.maps) {
        promises.push(new Promise((resolve) => {
            try {
                const geocoder = new google.maps.Geocoder();
                // Reverse geocode coordinates to address
                geocoder.geocode({ 
                    location: { lat, lng }
                }, (results, geocodeStatus) => {
                    if (geocodeStatus === 'OK' && results && results.length > 0) {
                        // Find the most precise result (prefer street_address, then premise, then others)
                        let bestResult = results.find(r => 
                            r.types && (r.types.includes('street_address') || r.types.includes('premise'))
                        ) || results[0];
                        
                        resolve({
                            source: 'google',
                            address: formatGoogleAddress(bestResult),
                            precision: (bestResult.types && bestResult.types.includes('street_address')) ? 'high' : 'medium'
                        });
                    } else {
                        console.warn('Google Geocoding failed:', geocodeStatus);
                        resolve(null);
                    }
                });
            } catch (error) {
                console.error('Error in Google Geocoding:', error);
                resolve(null);
            }
        }));
    }
    
    // Method 2: OpenStreetMap with high precision
    promises.push(
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`, {
            headers: { 'User-Agent': 'HS-Centrale-Driver/1.0' }
        })
        .then(r => r.json())
        .then(data => {
            if (data && data.address) {
                return {
                    source: 'osm_high',
                    address: formatOSMAddress(data.address),
                    precision: data.address.house_number ? 'high' : 'medium'
                };
            }
            return null;
        })
        .catch(() => null)
    );
    
    // Method 3: OpenStreetMap with medium precision (backup)
    promises.push(
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`, {
            headers: { 'User-Agent': 'HS-Centrale-Driver/1.0' }
        })
        .then(r => r.json())
        .then(data => {
            if (data && data.address) {
                return {
                    source: 'osm_medium',
                    address: formatOSMAddress(data.address),
                    precision: 'medium'
                };
            }
            return null;
        })
        .catch(() => null)
    );
    
    // Method 4: Try searching nearby addresses for better match
    promises.push(
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${lat},${lng}&limit=5&addressdetails=1`, {
            headers: { 'User-Agent': 'HS-Centrale-Driver/1.0' }
        })
        .then(r => r.json())
        .then(data => {
            if (data && data.length > 0) {
                // Find closest match
                let closest = data[0];
                let minDist = Infinity;
                
                data.forEach(item => {
                    if (item.lat && item.lon) {
                        const dist = Math.sqrt(
                            Math.pow(parseFloat(item.lat) - lat, 2) + 
                            Math.pow(parseFloat(item.lon) - lng, 2)
                        );
                        if (dist < minDist) {
                            minDist = dist;
                            closest = item;
                        }
                    }
                });
                
                if (closest.address) {
                    return {
                        source: 'osm_search',
                        address: formatOSMAddress(closest.address),
                        precision: closest.address.house_number ? 'high' : 'medium'
                    };
                }
            }
            return null;
        })
        .catch(() => null)
    );
    
    // Wait for all methods and choose the best result
    Promise.all(promises).then(results => {
        const validResults = results.filter(r => r && r.address && r.address.length > 5);
        
        if (validResults.length === 0) {
            // Fallback to coordinates
            if (input) {
                input.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                
                // Try to update map with coordinates if Google Maps is available
                if (typeof google !== 'undefined' && google.maps && map) {
                    try {
                        const location = new google.maps.LatLng(lat, lng);
                        const inputId = input.id;
                        
                        if (inputId === 'departure' && departureMarker) {
                            departureMarker.setPosition(location);
                        } else if (inputId === 'departure') {
                            departureMarker = new google.maps.Marker({
                                position: location,
                                map: map,
                                title: 'Départ',
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 8,
                                    fillColor: '#27ae60',
                                    fillOpacity: 1,
                                    strokeColor: '#fff',
                                    strokeWeight: 2
                                }
                            });
                        } else if (inputId === 'arrival' && arrivalMarker) {
                            arrivalMarker.setPosition(location);
                        } else if (inputId === 'arrival') {
                            arrivalMarker = new google.maps.Marker({
                                position: location,
                                map: map,
                                title: 'Arrivée',
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 8,
                                    fillColor: '#e74c3c',
                                    fillOpacity: 1,
                                    strokeColor: '#fff',
                                    strokeWeight: 2
                                }
                            });
                        }
                        
                        map.setCenter(location);
                        
                        // Calculate route if both addresses are set
                        const departure = document.getElementById('departure')?.value.trim();
                        const arrival = document.getElementById('arrival')?.value.trim();
                        if (departure && arrival) {
                            setTimeout(() => {
                                calculateDistanceWithGoogleMaps();
                            }, 300);
                        }
                    } catch (error) {
                        console.error('Error updating map with coordinates:', error);
                    }
                }
            }
            if (status) {
                status.textContent = '⚠️ Adresse non trouvée, coordonnées utilisées';
                status.style.color = '#f39c12';
                status.style.display = 'block';
            }
            if (button) {
                button.disabled = false;
                button.textContent = '📍 Localiser';
                button.classList.remove('loading');
            }
            return;
        }
        
        // Choose best result: prefer high precision, then Google, then OSM
        let bestResult = validResults.find(r => r.precision === 'high');
        if (!bestResult) {
            bestResult = validResults.find(r => r.source === 'google');
        }
        if (!bestResult) {
            bestResult = validResults[0];
        }
        
        // If we have multiple results, verify consistency
        if (validResults.length > 1) {
            // Check if addresses are similar (same street)
            const addresses = validResults.map(r => r.address.toLowerCase());
            const streetNames = addresses.map(addr => {
                const match = addr.match(/(\d+\s+)?([^,]+)/);
                return match ? match[2].trim() : '';
            });
            
            // If streets are different, prefer the one with house number
            const withNumber = validResults.find(r => 
                r.address.match(/^\d+/) || r.precision === 'high'
            );
            if (withNumber) {
                bestResult = withNumber;
            }
        }
        
        const finalAddress = bestResult.address;
        
        if (input) {
            input.value = finalAddress;
            
            // Trigger input event to update autocomplete if available
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            // If Google Maps is available, try to update the map and calculate distance
            if (typeof google !== 'undefined' && google.maps && map) {
                // Use the geocoder to get place details and update map
                try {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address: finalAddress }, (results, geocodeStatus) => {
                        if (geocodeStatus === 'OK' && results && results[0] && results[0].geometry) {
                            const place = {
                                geometry: {
                                    location: results[0].geometry.location
                                },
                                formatted_address: finalAddress
                            };
                            
                            // Determine which input was updated
                            const inputId = input.id;
                            if (inputId === 'departure') {
                                updateMapWithPlace(place, 'departure');
                            } else if (inputId === 'arrival') {
                                updateMapWithPlace(place, 'arrival');
                            }
                            
                            // Calculate distance if both fields are filled
                            const departure = document.getElementById('departure')?.value.trim();
                            const arrival = document.getElementById('arrival')?.value.trim();
                            if (departure && arrival) {
                                setTimeout(() => {
                                    calculateDistanceWithGoogleMaps();
                                }, 300);
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error updating map after geocoding:', error);
                }
            }
        }
        if (status) {
            status.textContent = '✅ Adresse précise détectée';
            status.style.color = '#27ae60';
            status.style.display = 'block';
        }
        if (button) {
            button.disabled = false;
            button.textContent = '📍 Localiser';
            button.classList.remove('loading');
        }
        
        console.log('Adresse sélectionnée:', finalAddress, 'Source:', bestResult.source);
    });
}

// Format Google Maps address
function formatGoogleAddress(result) {
    // Google Maps geocoding results already have formatted_address
    if (result && result.formatted_address) {
        return result.formatted_address;
    }
    // Fallback: construct from address_components if formatted_address is missing
    if (result && result.address_components) {
        const components = result.address_components;
        const streetNumber = components.find(c => c.types.includes('street_number'));
        const route = components.find(c => c.types.includes('route'));
        const city = components.find(c => c.types.includes('locality') || c.types.includes('administrative_area_level_2'));
        const postalCode = components.find(c => c.types.includes('postal_code'));
        const country = components.find(c => c.types.includes('country'));
        
        const addressParts = [];
        if (streetNumber) addressParts.push(streetNumber.long_name);
        if (route) addressParts.push(route.long_name);
        const street = addressParts.join(' ');
        
        const locationParts = [];
        if (postalCode) locationParts.push(postalCode.long_name);
        if (city) locationParts.push(city.long_name);
        const location = locationParts.join(' ');
        
        return [street, location].filter(Boolean).join(', ');
    }
    return '';
}

// Format OpenStreetMap address
function formatOSMAddress(addr) {
    const addressParts = [];
    
    // House/building number
    if (addr.house_number) {
        addressParts.push(addr.house_number);
    }
    
    // Street name - clean it up
    let streetName = '';
    if (addr.road) {
        streetName = addr.road;
    } else if (addr.pedestrian) {
        streetName = addr.pedestrian;
    } else if (addr.path) {
        streetName = addr.path;
    } else if (addr.footway) {
        streetName = addr.footway;
    }
    
    // Remove common prefixes that might cause confusion
    if (streetName) {
        // Don't add "Rue" prefix if it's already in the name
        if (!streetName.toLowerCase().startsWith('rue ') && 
            !streetName.toLowerCase().startsWith('avenue ') &&
            !streetName.toLowerCase().startsWith('boulevard ') &&
            !streetName.toLowerCase().startsWith('place ')) {
            // Keep as is
        }
        addressParts.push(streetName);
    }
    
    let address = addressParts.length > 0 ? addressParts.join(' ') : '';
    
    // Add city/postal code
    const cityParts = [];
    if (addr.postcode) cityParts.push(addr.postcode);
    if (addr.city) {
        cityParts.push(addr.city);
    } else if (addr.town) {
        cityParts.push(addr.town);
    } else if (addr.village) {
        cityParts.push(addr.village);
    } else if (addr.municipality) {
        cityParts.push(addr.municipality);
    } else if (addr.suburb) {
        cityParts.push(addr.suburb);
    }
    
    if (cityParts.length > 0) {
        if (address) {
            address += ', ' + cityParts.join(' ');
        } else {
            address = cityParts.join(' ');
        }
    }
    
    return address;
}

function setCoordinatesAsAddress(lat, lng, input, status) {
    // Try to get at least a city name from coordinates
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
        headers: {
            'User-Agent': 'HS-Centrale-Driver/1.0'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.address) {
            const addr = data.address;
            let locationName = '';
            if (addr.city) locationName = addr.city;
            else if (addr.town) locationName = addr.town;
            else if (addr.village) locationName = addr.village;
            else if (addr.municipality) locationName = addr.municipality;
            
            if (locationName) {
                if (input) {
                    input.value = locationName + ' (coordonnées: ' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')';
                }
                if (status) {
                    status.textContent = '✅ Localisation: ' + locationName;
                    status.style.color = '#f39c12';
                    status.style.display = 'block';
                }
            } else {
                if (input) {
                    input.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }
                if (status) {
                    status.textContent = '✅ Coordonnées obtenues';
                    status.style.color = '#f39c12';
                    status.style.display = 'block';
                }
            }
        } else {
            if (input) {
                input.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }
            if (status) {
                status.textContent = '✅ Coordonnées obtenues';
                status.style.color = '#f39c12';
                status.style.display = 'block';
            }
        }
    })
    .catch(() => {
        // Final fallback
        if (input) {
            input.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        if (status) {
            status.textContent = '✅ Coordonnées obtenues';
            status.style.color = '#f39c12';
            status.style.display = 'block';
        }
    });
}

function submitBooking() {
    // Collect data
    bookingData.fullName = document.getElementById('fullName')?.value.trim() || '';
    bookingData.phone = document.getElementById('phone')?.value.trim() || '';
    bookingData.email = document.getElementById('email')?.value.trim() || '';
    bookingData.departureDate = document.getElementById('departureDate')?.value || '';
    bookingData.departureTime = document.getElementById('departureTime')?.value || '';
    bookingData.passengers = parseInt(document.getElementById('passengers')?.value) || 1;
    bookingData.luggage = parseInt(document.getElementById('luggage')?.value) || 0;
    bookingData.notes = document.getElementById('notes')?.value.trim() || '';
    
    const vehicleSelect = document.getElementById('vehicle');
    if (vehicleSelect) {
        bookingData.vehicle = vehicles.find(v => v.id === vehicleSelect.value);
    }
    
    // Validate
    if (!bookingData.fullName || !bookingData.phone || !bookingData.email || !bookingData.vehicle) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Save to localStorage
    let bookings = JSON.parse(localStorage.getItem('hsBookings') || '[]');
    bookingData.id = Date.now().toString();
    bookingData.price = Math.max(bookingData.vehicle.minPrice, Math.round(bookingData.vehicle.basePrice * bookingData.distance));
    bookings.push(bookingData);
    localStorage.setItem('hsBookings', JSON.stringify(bookings));
    
    // Show success
    const messageEl = document.getElementById('bookingMessage');
    if (messageEl) {
        messageEl.textContent = 'Réservation confirmée ! Votre réservation a été enregistrée avec succès.';
        messageEl.className = 'booking-message success';
        messageEl.style.display = 'block';
    }
    
    // Reset after 3 seconds
    setTimeout(() => {
        if (messageEl) messageEl.style.display = 'none';
        document.getElementById('bookingForm')?.reset();
        goToStep(1);
        bookingData = {
            departure: '', arrival: '', distance: 0, vehicle: null,
            fullName: '', phone: '', email: '', departureDate: '',
            departureTime: '', passengers: 1, luggage: 0, notes: ''
        };
    }, 3000);
}

