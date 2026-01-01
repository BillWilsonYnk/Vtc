// Google Maps variables
let map;
let departureMarker;
let arrivalMarker;
let directionsService;
let directionsRenderer;
let geocoder;
let searchTimeout = null;

// Setup address input with geocoding suggestions
function setupAddressInputMain(inputElement, type) {
    const container = inputElement.parentElement;
    let suggestionsDiv = container.querySelector('.address-suggestions');
    
    if (!suggestionsDiv) {
        suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'address-suggestions';
        suggestionsDiv.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #1a1a1a;
            border: 1px solid rgba(201, 169, 98, 0.3);
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        container.style.position = 'relative';
        container.appendChild(suggestionsDiv);
    }
    
    inputElement.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (searchTimeout) clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchAddressMain(query, suggestionsDiv, inputElement, type);
        }, 300);
    });
    
    inputElement.addEventListener('blur', () => {
        setTimeout(() => { suggestionsDiv.style.display = 'none'; }, 200);
    });
    
    inputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            suggestionsDiv.style.display = 'none';
        }
    });
}

function searchAddressMain(query, suggestionsDiv, inputElement, type) {
    if (!geocoder) return;
    
    geocoder.geocode({ 
        address: `${query}, France`,
        componentRestrictions: { country: 'fr' }
    }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
            suggestionsDiv.innerHTML = '';
            
            results.slice(0, 5).forEach((result) => {
                const item = document.createElement('div');
                item.style.cssText = `padding: 12px 15px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;`;
                item.textContent = result.formatted_address;
                
                item.addEventListener('mouseenter', () => { item.style.background = 'rgba(201, 169, 98, 0.2)'; });
                item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
                
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    inputElement.value = result.formatted_address;
                    suggestionsDiv.style.display = 'none';
                    updateMap();
                    calculateDistanceWithGoogleMaps();
                });
                
                suggestionsDiv.appendChild(item);
            });
            
            suggestionsDiv.style.display = 'block';
        } else {
            suggestionsDiv.style.display = 'none';
        }
    });
}

// Initialize Google Maps
function initializeGoogleMaps() {
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
        console.warn('Google Maps API not loaded. Using fallback distance calculation.');
        return false;
    }

    try {
        // Initialize map
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return false;

        map = new google.maps.Map(mapContainer, {
            center: { lat: 48.8566, lng: 2.3522 }, // Paris center
            zoom: 11,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false
        });

        // Initialize services
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: false
        });
        geocoder = new google.maps.Geocoder();

        // Initialize address inputs with geocoding
        const departureInput = document.getElementById('departure');
        if (departureInput) {
            setupAddressInputMain(departureInput, 'departure');
        }

        const arrivalInput = document.getElementById('arrival');
        if (arrivalInput) {
            setupAddressInputMain(arrivalInput, 'arrival');
        }

        return true;
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        return false;
    }
}

// Update map with markers
function updateMap() {
    if (!map || !geocoder || !directionsService || !directionsRenderer) {
        return;
    }

    const departureInput = document.getElementById('departure');
    const arrivalInput = document.getElementById('arrival');
    
    if (!departureInput || !arrivalInput) return;
    
    const departure = departureInput.value.trim();
    const arrival = arrivalInput.value.trim();

    if (!departure || !arrival) {
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) mapContainer.style.display = 'none';
        return;
    }

    // Geocode both addresses
    Promise.all([
        geocodeAddress(departure),
        geocodeAddress(arrival)
    ]).then(([depLocation, arrLocation]) => {
        if (depLocation && arrLocation) {
            // Show map
            const mapContainer = document.getElementById('mapContainer');
            if (mapContainer) mapContainer.style.display = 'block';

            // Calculate and display route
            calculateRoute(depLocation, arrLocation);
        }
    }).catch(error => {
        console.error('Error updating map:', error);
        // Hide map on error
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) mapContainer.style.display = 'none';
    });
}

// Geocode an address
function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        if (!geocoder) {
            reject('Geocoder not initialized');
            return;
        }

        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                resolve(results[0].geometry.location);
            } else {
                reject(`Geocoding failed: ${status}`);
            }
        });
    });
}

// Calculate route with Google Maps
function calculateRoute(departure, arrival) {
    if (!directionsService || !directionsRenderer || typeof google === 'undefined' || !google.maps) {
        return;
    }

    try {
        directionsService.route({
            origin: departure,
            destination: arrival,
            travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
            if (status === 'OK' && result && result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
                directionsRenderer.setDirections(result);
                
                // Extract distance and duration
                const route = result.routes[0];
                const leg = route.legs[0];
                
                const distance = Math.round(leg.distance.value / 1000); // Convert to km
                const duration = leg.duration ? leg.duration.text : 'N/A';

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
            } else {
                console.warn('Directions request failed:', status);
            }
        });
    } catch (error) {
        console.error('Error calculating route:', error);
    }
}

// Calculate distance with Google Maps Distance Matrix API
function calculateDistanceWithGoogleMaps() {
    const departure = document.getElementById('departure');
    const arrival = document.getElementById('arrival');
    
    if (!departure || !arrival) return;
    
    const departureValue = departure.value.trim();
    const arrivalValue = arrival.value.trim();

    if (!departureValue || !arrivalValue) {
        const distanceInfo = document.getElementById('distanceInfo');
        const mapContainer = document.getElementById('mapContainer');
        if (distanceInfo) distanceInfo.style.display = 'none';
        if (mapContainer) mapContainer.style.display = 'none';
        return;
    }

    // Show loading
    const distanceInfo = document.getElementById('distanceInfo');
    const distanceValue = document.getElementById('distanceValue');
    const durationValue = document.getElementById('durationValue');
    
    if (distanceInfo && distanceValue) {
        distanceValue.textContent = 'Calcul en cours...';
        if (durationValue) durationValue.textContent = '...';
        distanceInfo.style.display = 'block';
    }

    // Use Distance Matrix API if available, otherwise use Directions API
    if (typeof google !== 'undefined' && google.maps && google.maps.DistanceMatrixService) {
        try {
            const service = new google.maps.DistanceMatrixService();
            
            service.getDistanceMatrix({
                origins: [departureValue],
                destinations: [arrivalValue],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            }, (response, status) => {
                if (status === 'OK' && response.rows && response.rows[0] && response.rows[0].elements && response.rows[0].elements[0] && response.rows[0].elements[0].status === 'OK') {
                    const element = response.rows[0].elements[0];
                    const distance = Math.round(element.distance.value / 1000); // Convert to km
                    const duration = element.duration ? element.duration.text : 'N/A';

                    bookingData.distance = distance;
                    bookingData.departure = departureValue;
                    bookingData.arrival = arrivalValue;

                    if (distanceInfo && distanceValue) {
                        distanceValue.textContent = distance;
                        if (durationValue) durationValue.textContent = duration;
                        distanceInfo.style.display = 'block';
                    }

                    // Update map
                    if (map && geocoder) {
                        updateMap();
                    }

                    // Update price if vehicle is selected
                    const vehicleSelect = document.getElementById('vehicle');
                    if (vehicleSelect && vehicleSelect.value) {
                        updatePrice();
                    }
                } else {
                    console.warn('Distance Matrix request failed:', status);
                    // Fallback to manual calculation
                    calculateDistance();
                }
            });
        } catch (error) {
            console.error('Error with Google Maps API:', error);
            // Fallback to manual calculation
            calculateDistance();
        }
    } else {
        // Fallback to manual calculation
        calculateDistance();
    }
}

// Vehicle data
const vehicles = [
    {
        id: 'berline',
        name: 'Berline',
        description: 'Confort et élégance pour vos déplacements professionnels',
        basePrice: 1.5, // per km
        minPrice: 30,
        capacity: 4,
        icon: '🚗'
    },
    {
        id: 'eco',
        name: 'Éco',
        description: 'Véhicule économique et écologique',
        basePrice: 1.2,
        minPrice: 25,
        capacity: 4,
        icon: '🚙'
    },
    {
        id: 'van',
        name: 'Van',
        description: 'Idéal pour les groupes et les bagages volumineux',
        basePrice: 2.0,
        minPrice: 40,
        capacity: 8,
        icon: '🚐'
    }
];

// State management
let currentStep = 1;
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

// Initialize - with error handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing...');
    
    try {
        initializeNavigation();
        console.log('Navigation initialized');
    } catch (error) {
        console.error('Error initializing navigation:', error);
    }
    
    try {
        initializeDateInput();
        console.log('Date input initialized');
    } catch (error) {
        console.error('Error initializing date input:', error);
    }
    
    try {
        setCurrentYear();
        console.log('Current year set');
    } catch (error) {
        console.error('Error setting current year:', error);
    }
    
    try {
        initializeAdminPanel();
        console.log('Admin panel initialized');
    } catch (error) {
        console.error('Error initializing admin panel:', error);
    }
    
    try {
        // Initialize booking form first
        initializeBookingForm();
        console.log('Booking form initialized');
    } catch (error) {
        console.error('Error initializing booking form:', error);
    }
    
    // Try to initialize Google Maps (with delay to ensure API is loaded)
    setTimeout(() => {
        try {
            const mapsInitialized = initializeGoogleMaps();
            if (!mapsInitialized) {
                console.log('Google Maps not available, using fallback calculation');
            } else {
                console.log('Google Maps initialized');
            }
        } catch (error) {
            console.warn('Google Maps initialization failed:', error);
            console.log('Using fallback distance calculation');
        }
    }, 500);
    
    console.log('All initialization complete');
});

// Admin panel for viewing bookings
function initializeAdminPanel() {
    // Add admin button (hidden by default, accessible via console or URL parameter)
    if (window.location.search.includes('admin=true')) {
        createAdminPanel();
    }
}

function createAdminPanel() {
    const adminBtn = document.createElement('button');
    adminBtn.textContent = '📋 Voir les réservations';
    adminBtn.className = 'btn btn-secondary';
    adminBtn.style.position = 'fixed';
    adminBtn.style.bottom = '20px';
    adminBtn.style.right = '20px';
    adminBtn.style.zIndex = '9999';
    adminBtn.onclick = showBookingsPanel;
    document.body.appendChild(adminBtn);
}

function showBookingsPanel() {
    const bookings = getAllBookings();
    
    let html = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; padding: 20px; overflow-y: auto;">
            <div style="background: white; max-width: 900px; margin: 0 auto; padding: 30px; border-radius: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Réservations (${bookings.length})</h2>
                    <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Fermer</button>
                </div>
    `;
    
    if (bookings.length === 0) {
        html += '<p>Aucune réservation pour le moment.</p>';
    } else {
        html += '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: #f8f9fa;"><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">ID</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Client</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Trajet</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Date/Heure</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Véhicule</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Prix</th></tr></thead><tbody>';
        
        bookings.reverse().forEach(booking => {
            const date = new Date(booking.departureDate + 'T' + booking.departureTime);
            html += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">#${booking.id.slice(-6)}</td>
                    <td style="padding: 10px;">${booking.fullName}<br><small>${booking.phone}<br>${booking.email}</small></td>
                    <td style="padding: 10px;">${booking.departure}<br>→ ${booking.arrival}<br><small>${booking.distance} km</small></td>
                    <td style="padding: 10px;">${date.toLocaleDateString('fr-FR')}<br><small>${booking.departureTime}</small></td>
                    <td style="padding: 10px;">${booking.vehicle?.icon || ''} ${booking.vehicle?.name || 'N/A'}<br><small>${booking.passengers} passagers</small></td>
                    <td style="padding: 10px;"><strong>${booking.price || 'N/A'} €</strong></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
        html += `<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;"><strong>Chiffre d'affaires total: ${totalRevenue} €</strong></div>`;
        
        html += `<button onclick="exportBookings()" style="margin-top: 15px; background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">📥 Exporter en JSON</button>`;
    }
    
    html += '</div></div>';
    
    document.body.insertAdjacentHTML('beforeend', html);
}

window.exportBookings = function() {
    const bookings = getAllBookings();
    const dataStr = JSON.stringify(bookings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservations-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
};

// Navigation
function initializeNavigation() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Real-time validation
function addRealTimeValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passengersInput = document.getElementById('passengers');
    
    // Email validation
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                this.style.borderColor = '#e74c3c';
                showFieldError(this, 'Email invalide');
            } else {
                this.style.borderColor = '';
                hideFieldError(this);
            }
        });
        
        emailInput.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(231, 76, 60)') {
                const email = this.value.trim();
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    this.style.borderColor = '';
                    hideFieldError(this);
                }
            }
        });
    }
    
    // Phone validation
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            const phone = this.value.trim();
            if (phone && !/^[0-9+\s()-]{10,}$/.test(phone)) {
                this.style.borderColor = '#e74c3c';
                showFieldError(this, 'Téléphone invalide (minimum 10 chiffres)');
            } else {
                this.style.borderColor = '';
                hideFieldError(this);
            }
        });
        
        phoneInput.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(231, 76, 60)') {
                const phone = this.value.trim();
                if (/^[0-9+\s()-]{10,}$/.test(phone)) {
                    this.style.borderColor = '';
                    hideFieldError(this);
                }
            }
        });
    }
    
    // Passengers validation
    if (passengersInput) {
        passengersInput.addEventListener('change', function() {
            const passengers = parseInt(this.value);
            if (passengers < 1 || passengers > 8) {
                this.style.borderColor = '#e74c3c';
                showFieldError(this, 'Nombre de passagers invalide (1-8)');
            } else {
                this.style.borderColor = '';
                hideFieldError(this);
            }
        });
    }
}

function showFieldError(input, message) {
    hideFieldError(input);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    input.parentNode.appendChild(errorDiv);
}

function hideFieldError(input) {
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Booking Form
function initializeBookingForm() {
    console.log('Initializing booking form...');
    
    const nextStep1Btn = document.getElementById('nextStep1');
    const prevStep2Btn = document.getElementById('prevStep2');
    const confirmBookingBtn = document.getElementById('confirmBooking');
    const departureInput = document.getElementById('departure');
    const arrivalInput = document.getElementById('arrival');
    const vehicleSelect = document.getElementById('vehicle');
    const passengersInput = document.getElementById('passengers');

    if (!nextStep1Btn) {
        console.error('nextStep1Btn not found');
        return;
    }
    if (!departureInput) {
        console.error('departureInput not found');
        return;
    }
    if (!arrivalInput) {
        console.error('arrivalInput not found');
        return;
    }

    console.log('All form elements found');

    // Load vehicles
    try {
        loadVehicles();
        console.log('Vehicles loaded');
    } catch (error) {
        console.error('Error loading vehicles:', error);
    }
    
    // Add real-time validation
    try {
        addRealTimeValidation();
        console.log('Real-time validation added');
    } catch (error) {
        console.error('Error adding real-time validation:', error);
    }

    // Location button
    const getLocationBtn = document.getElementById('getLocationBtn');
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            try {
                getCurrentLocation();
            } catch (error) {
                console.error('Error in getLocationBtn click handler:', error);
                showLocationError('Erreur lors de la localisation');
            }
        });
    }

    // Step 1: Calculate distance
    if (departureInput && arrivalInput) {
        let distanceTimeout;
        [departureInput, arrivalInput].forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(distanceTimeout);
                distanceTimeout = setTimeout(() => {
                    // Try Google Maps first, fallback to manual calculation
                    if (typeof google !== 'undefined' && google.maps) {
                        calculateDistanceWithGoogleMaps();
                    } else {
                        calculateDistance();
                    }
                }, 1000);
            });
        });
    }

    // Next step 1
    if (nextStep1Btn) {
        nextStep1Btn.addEventListener('click', () => {
            if (validateStep1()) {
                goToStep(2);
                updateVehicleOptions();
            }
        });
    }

    // Previous step 2
    if (prevStep2Btn) {
        prevStep2Btn.addEventListener('click', () => {
            goToStep(1);
        });
    }

    // Update price when vehicle or passengers change
    if (vehicleSelect) {
        vehicleSelect.addEventListener('change', () => {
            updatePrice();
        });
    }

    if (passengersInput) {
        passengersInput.addEventListener('change', () => {
            updateVehicleOptions();
            updatePrice();
        });
    }

    // Confirm booking
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateStep2()) {
                submitBooking();
            }
        });
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'tarifs') {
                document.getElementById('tarifs').scrollIntoView({ behavior: 'smooth' });
            }
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Load vehicles into select
function loadVehicles() {
    const vehicleSelect = document.getElementById('vehicle');
    if (!vehicleSelect) return;

    vehicleSelect.innerHTML = '<option value="">Sélectionnez un véhicule</option>';
    
    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.icon} ${vehicle.name} - ${vehicle.capacity} places`;
        vehicleSelect.appendChild(option);
    });
}

// Known locations for better distance calculation
const knownLocations = {
    'aéroport charles de gaulle': { lat: 49.0097, lon: 2.5479, name: 'Aéroport Charles de Gaulle' },
    'cdg': { lat: 49.0097, lon: 2.5479, name: 'Aéroport Charles de Gaulle' },
    'roissy': { lat: 49.0097, lon: 2.5479, name: 'Aéroport Charles de Gaulle' },
    'aéroport orly': { lat: 48.7233, lon: 2.3794, name: 'Aéroport d\'Orly' },
    'orly': { lat: 48.7233, lon: 2.3794, name: 'Aéroport d\'Orly' },
    'gare du nord': { lat: 48.8809, lon: 2.3553, name: 'Gare du Nord' },
    'gare de lyon': { lat: 48.8446, lon: 2.3732, name: 'Gare de Lyon' },
    'gare montparnasse': { lat: 48.8412, lon: 2.3216, name: 'Gare Montparnasse' },
    'gare saint-lazare': { lat: 48.8762, lon: 2.3264, name: 'Gare Saint-Lazare' },
    'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris Centre' },
    'champs-élysées': { lat: 48.8698, lon: 2.3081, name: 'Champs-Élysées' },
    'tour eiffel': { lat: 48.8584, lon: 2.2945, name: 'Tour Eiffel' },
    'louvre': { lat: 48.8606, lon: 2.3376, name: 'Louvre' },
    'notre-dame': { lat: 48.8530, lon: 2.3499, name: 'Notre-Dame' }
};

// Calculate distance using Haversine formula (approximate)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1.3); // Add 30% for road distance
}

// Find location coordinates
function findLocationCoordinates(address) {
    const addressLower = address.toLowerCase().trim();
    
    // Check known locations
    for (const [key, location] of Object.entries(knownLocations)) {
        if (addressLower.includes(key)) {
            return location;
        }
    }
    
    // Default: assume Paris center if not found
    return { lat: 48.8566, lon: 2.3522, name: 'Paris' };
}

// Calculate distance (improved version - fallback)
function calculateDistance() {
    const departureInput = document.getElementById('departure');
    const arrivalInput = document.getElementById('arrival');
    
    if (!departureInput || !arrivalInput) return;
    
    const departure = departureInput.value.trim();
    const arrival = arrivalInput.value.trim();

    if (!departure || !arrival) {
        const distanceInfo = document.getElementById('distanceInfo');
        if (distanceInfo) distanceInfo.style.display = 'none';
        return;
    }

    // Show loading
    const distanceInfo = document.getElementById('distanceInfo');
    const distanceValue = document.getElementById('distanceValue');
    const durationValue = document.getElementById('durationValue');
    
    if (distanceInfo && distanceValue) {
        distanceValue.textContent = 'Calcul en cours...';
        if (durationValue) durationValue.textContent = '...';
        distanceInfo.style.display = 'block';
    }

    // Simulate API delay
    setTimeout(() => {
        try {
            const depLocation = findLocationCoordinates(departure);
            const arrLocation = findLocationCoordinates(arrival);
            
            let distance;
            
            if (depLocation.name === arrLocation.name && depLocation.name !== 'Paris') {
                // Same location
                distance = 0;
            } else {
                // Calculate distance
                distance = calculateHaversineDistance(
                    depLocation.lat, depLocation.lon,
                    arrLocation.lat, arrLocation.lon
                );
                
                // Minimum distance of 5km for any trip
                if (distance < 5) {
                    distance = Math.floor(Math.random() * 15) + 5; // 5-20 km for local trips
                }
            }
            
            // Estimate duration (average 30 km/h in city)
            const estimatedDuration = Math.round((distance / 30) * 60); // in minutes
            const durationText = estimatedDuration < 60 
                ? `${estimatedDuration} min` 
                : `${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60} min`;
            
            bookingData.distance = distance;
            bookingData.departure = departure;
            bookingData.arrival = arrival;

            if (distanceInfo && distanceValue) {
                distanceValue.textContent = distance;
                if (durationValue) durationValue.textContent = durationText;
                distanceInfo.style.display = 'block';
                
                // Update price if vehicle is already selected
                const vehicleSelect = document.getElementById('vehicle');
                if (vehicleSelect && vehicleSelect.value) {
                    updatePrice();
                }
            }
        } catch (error) {
            console.error('Error calculating distance:', error);
            if (distanceInfo && distanceValue) {
                distanceValue.textContent = 'Erreur';
                distanceInfo.style.display = 'block';
            }
        }
    }, 800);
}

// Update vehicle options based on passengers
function updateVehicleOptions() {
    const passengers = parseInt(document.getElementById('passengers').value) || 1;
    const vehicleSelect = document.getElementById('vehicle');
    
    if (!vehicleSelect) return;

    const options = vehicleSelect.querySelectorAll('option');
    options.forEach((option, index) => {
        if (index === 0) return; // Skip first option (placeholder)
        
        const vehicle = vehicles[index - 1];
        if (vehicle.capacity < passengers) {
            option.disabled = true;
            option.textContent = `${vehicle.icon} ${vehicle.name} - ${vehicle.capacity} places (Capacité insuffisante)`;
        } else {
            option.disabled = false;
            option.textContent = `${vehicle.icon} ${vehicle.name} - ${vehicle.capacity} places`;
        }
    });
}

// Update price
function updatePrice() {
    const vehicleSelect = document.getElementById('vehicle');
    if (!vehicleSelect) return;
    
    const vehicleId = vehicleSelect.value;
    
    if (!vehicleId || !bookingData.distance) {
        const priceSummary = document.getElementById('priceSummary');
        if (priceSummary) priceSummary.style.display = 'none';
        return;
    }

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    bookingData.vehicle = vehicle;

    const price = Math.max(
        vehicle.minPrice,
        Math.round(vehicle.basePrice * bookingData.distance)
    );

    // Show vehicle info
    const vehicleInfo = document.getElementById('vehicleInfo');
    if (vehicleInfo) {
        vehicleInfo.innerHTML = `
            <strong>${vehicle.icon} ${vehicle.name}</strong>
            <p>${vehicle.description}</p>
            <p>Capacité: ${vehicle.capacity} passagers</p>
        `;
        vehicleInfo.style.display = 'block';
    }

    // Update summary
    const summaryDistance = document.getElementById('summaryDistance');
    const summaryVehicle = document.getElementById('summaryVehicle');
    const totalPrice = document.getElementById('totalPrice');
    const priceSummary = document.getElementById('priceSummary');
    
    if (summaryDistance) summaryDistance.textContent = bookingData.distance;
    if (summaryVehicle) summaryVehicle.textContent = vehicle.name;
    if (totalPrice) totalPrice.textContent = price;
    if (priceSummary) priceSummary.style.display = 'block';
}

// Step navigation
function goToStep(step) {
    const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    const nextStepEl = document.querySelector(`.step[data-step="${step}"]`);

    if (currentStepEl) {
        currentStepEl.classList.remove('active');
    }
    if (nextStepEl) {
        nextStepEl.classList.add('active');
    }

    currentStep = step;
}

// Validation
function validateStep1() {
    const departure = document.getElementById('departure').value.trim();
    const arrival = document.getElementById('arrival').value.trim();

    if (!departure || !arrival) {
        showMessage('Veuillez remplir les deux adresses', 'error');
        return false;
    }

    if (!bookingData.distance || bookingData.distance === 0) {
        showMessage('Veuillez attendre le calcul de la distance', 'error');
        return false;
    }

    return true;
}

function validateStep2() {
    const requiredFields = [
        { id: 'vehicle', name: 'Véhicule' },
        { id: 'fullName', name: 'Nom complet' },
        { id: 'phone', name: 'Téléphone' },
        { id: 'email', name: 'Email' },
        { id: 'departureDate', name: 'Date de départ' },
        { id: 'departureTime', name: 'Heure de départ' },
        { id: 'passengers', name: 'Passagers' }
    ];

    for (const field of requiredFields) {
        const input = document.getElementById(field.id);
        if (!input || !input.value.trim()) {
            showMessage(`Le champ "${field.name}" est requis`, 'error');
            input?.focus();
            return false;
        }
    }

    // Validate email
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Veuillez entrer une adresse email valide', 'error');
        return false;
    }

    // Validate phone
    const phone = document.getElementById('phone').value;
    const phoneRegex = /^[0-9+\s()-]{10,}$/;
    if (!phoneRegex.test(phone)) {
        showMessage('Veuillez entrer un numéro de téléphone valide', 'error');
        return false;
    }

    // Validate passengers vs vehicle capacity
    const passengers = parseInt(document.getElementById('passengers').value);
    const vehicleId = document.getElementById('vehicle').value;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (vehicle && passengers > vehicle.capacity) {
        showMessage(`Ce véhicule ne peut accueillir que ${vehicle.capacity} passagers maximum`, 'error');
        return false;
    }

    return true;
}

// Save booking to localStorage
function saveBooking(booking) {
    let bookings = JSON.parse(localStorage.getItem('hsBookings') || '[]');
    booking.id = Date.now().toString();
    booking.createdAt = new Date().toISOString();
    booking.status = 'confirmed';
    bookings.push(booking);
    localStorage.setItem('hsBookings', JSON.stringify(bookings));
    return booking.id;
}

// Get all bookings
function getAllBookings() {
    return JSON.parse(localStorage.getItem('hsBookings') || '[]');
}

// Submit booking
function submitBooking() {
    // Collect all data
    bookingData.fullName = document.getElementById('fullName').value.trim();
    bookingData.phone = document.getElementById('phone').value.trim();
    bookingData.email = document.getElementById('email').value.trim();
    bookingData.departureDate = document.getElementById('departureDate').value;
    bookingData.departureTime = document.getElementById('departureTime').value;
    bookingData.passengers = parseInt(document.getElementById('passengers').value);
    bookingData.luggage = parseInt(document.getElementById('luggage').value) || 0;
    bookingData.notes = document.getElementById('notes').value.trim();
    bookingData.vehicle = vehicles.find(v => v.id === document.getElementById('vehicle').value);

    // Calculate final price
    const price = Math.max(
        bookingData.vehicle.minPrice,
        Math.round(bookingData.vehicle.basePrice * bookingData.distance)
    );
    
    bookingData.price = price;

    // Show loading
    const confirmBtn = document.getElementById('confirmBooking');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Enregistrement...';
    confirmBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        try {
            // Save to localStorage
            const bookingId = saveBooking({ ...bookingData });
            
            console.log('Booking saved:', bookingId);
            console.log('Booking data:', bookingData);
            console.log('Price:', price);

            // Show success message with booking ID
            showMessage(`Réservation confirmée ! Votre réservation #${bookingId.slice(-6)} a été enregistrée avec succès. Vous allez recevoir un email de confirmation.`, 'success');

            // Reset form after delay
            setTimeout(() => {
                resetForm();
                confirmBtn.textContent = originalText;
                confirmBtn.disabled = false;
            }, 4000);
        } catch (error) {
            console.error('Error saving booking:', error);
            showMessage('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.', 'error');
            confirmBtn.textContent = originalText;
            confirmBtn.disabled = false;
        }
    }, 1500);
}

// Show message
function showMessage(message, type) {
    const messageEl = document.getElementById('bookingMessage');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `booking-message ${type}`;
    messageEl.style.display = 'block';

    // Scroll to message
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto hide after 5 seconds for success
    if (type === 'success') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

// Reset form
function resetForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.reset();
    }
    
    bookingData = {
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
    
    const distanceInfo = document.getElementById('distanceInfo');
    const vehicleInfo = document.getElementById('vehicleInfo');
    const priceSummary = document.getElementById('priceSummary');
    const bookingMessage = document.getElementById('bookingMessage');
    const mapContainer = document.getElementById('mapContainer');
    
    if (distanceInfo) distanceInfo.style.display = 'none';
    if (vehicleInfo) vehicleInfo.style.display = 'none';
    if (priceSummary) priceSummary.style.display = 'none';
    if (bookingMessage) bookingMessage.style.display = 'none';
    if (mapContainer) mapContainer.style.display = 'none';
    
    goToStep(1);
    loadVehicles();
}

// Initialize date input (set min date to today)
function initializeDateInput() {
    const dateInput = document.getElementById('departureDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
}

// Set current year in footer
function setCurrentYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

// Get current location using Geolocation API
function getCurrentLocation() {
    try {
        const locationBtn = document.getElementById('getLocationBtn');
        const locationStatus = document.getElementById('locationStatus');
        const departureInput = document.getElementById('departure');
        
        if (!navigator || !navigator.geolocation) {
            showLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
            return;
        }
        
        if (!departureInput) {
            console.error('Departure input not found');
            return;
        }
    
    // Show loading state
    if (locationBtn) {
        locationBtn.disabled = true;
        locationBtn.classList.add('loading');
        locationBtn.textContent = '📍 Localisation...';
    }
    
    if (locationStatus) {
        locationStatus.style.display = 'block';
        locationStatus.textContent = 'Recherche de votre position...';
        locationStatus.style.color = '#666';
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            try {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                console.log('Position obtenue:', lat, lng);
            
            // Try to reverse geocode with Google Maps if available
            if (typeof google !== 'undefined' && google.maps) {
                try {
                    // Initialize geocoder if not already done
                    if (!geocoder) {
                        geocoder = new google.maps.Geocoder();
                    }
                    
                    if (geocoder) {
                        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                            if (status === 'OK' && results && results[0]) {
                                const address = results[0].formatted_address;
                                if (departureInput) {
                                    departureInput.value = address;
                                    if (locationStatus) {
                                        locationStatus.textContent = '✅ Position détectée';
                                        locationStatus.style.color = '#27ae60';
                                    }
                                    
                                    // Trigger distance calculation
                                    setTimeout(() => {
                                        if (typeof google !== 'undefined' && google.maps) {
                                            calculateDistanceWithGoogleMaps();
                                        } else {
                                            calculateDistance();
                                        }
                                    }, 500);
                                }
                            } else {
                                // Fallback: use coordinates
                                if (departureInput) {
                                    departureInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                                }
                                if (locationStatus) {
                                    locationStatus.textContent = '✅ Coordonnées obtenues';
                                    locationStatus.style.color = '#27ae60';
                                }
                                
                                // Trigger distance calculation
                                setTimeout(() => {
                                    calculateDistance();
                                }, 500);
                            }
                            
                            // Reset button
                            if (locationBtn) {
                                locationBtn.disabled = false;
                                locationBtn.classList.remove('loading');
                                locationBtn.textContent = '📍 Localiser';
                            }
                        });
                    } else {
                        // Geocoder not available, use coordinates
                        if (departureInput) {
                            departureInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        }
                        if (locationStatus) {
                            locationStatus.textContent = '✅ Coordonnées obtenues';
                            locationStatus.style.color = '#27ae60';
                        }
                        if (locationBtn) {
                            locationBtn.disabled = false;
                            locationBtn.classList.remove('loading');
                            locationBtn.textContent = '📍 Localiser';
                        }
                        
                        // Trigger distance calculation
                        setTimeout(() => {
                            calculateDistance();
                        }, 500);
                    }
                } catch (error) {
                    console.error('Error reverse geocoding:', error);
                    // Fallback: use coordinates
                    if (departureInput) {
                        departureInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    }
                    if (locationStatus) {
                        locationStatus.textContent = '✅ Coordonnées obtenues';
                        locationStatus.style.color = '#27ae60';
                    }
                    if (locationBtn) {
                        locationBtn.disabled = false;
                        locationBtn.classList.remove('loading');
                        locationBtn.textContent = '📍 Localiser';
                    }
                    
                    // Trigger distance calculation
                    setTimeout(() => {
                        calculateDistance();
                    }, 500);
                }
            } else {
                // Fallback: use coordinates directly
                if (departureInput) {
                    departureInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }
                if (locationStatus) {
                    locationStatus.textContent = '✅ Coordonnées obtenues';
                    locationStatus.style.color = '#27ae60';
                }
                
                // Trigger distance calculation
                setTimeout(() => {
                    calculateDistance();
                }, 500);
                
                // Reset button
                if (locationBtn) {
                    locationBtn.disabled = false;
                    locationBtn.classList.remove('loading');
                    locationBtn.textContent = '📍 Localiser';
                }
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Erreur de géolocalisation';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Permission refusée. Veuillez autoriser l\'accès à votre position.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Position indisponible.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Délai d\'attente dépassé.';
                    break;
            }
            
            showLocationError(errorMessage);
            
            // Reset button
            if (locationBtn) {
                locationBtn.disabled = false;
                locationBtn.classList.remove('loading');
                locationBtn.textContent = '📍 Localiser';
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function showLocationError(message) {
    try {
        const locationStatus = document.getElementById('locationStatus');
        const locationBtn = document.getElementById('getLocationBtn');
        
        if (locationStatus) {
            locationStatus.style.display = 'block';
            locationStatus.textContent = '❌ ' + message;
            locationStatus.style.color = '#e74c3c';
            
            // Hide error after 5 seconds
            setTimeout(() => {
                if (locationStatus) {
                    locationStatus.style.display = 'none';
                }
            }, 5000);
        }
        
        // Reset button state
        if (locationBtn) {
            locationBtn.disabled = false;
            locationBtn.classList.remove('loading');
            locationBtn.textContent = '📍 Localiser';
        }
    } catch (error) {
        console.error('Error in showLocationError:', error);
    }
}

