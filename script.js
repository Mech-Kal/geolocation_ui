const API_KEY = 'ba21c27259f34e269f1c706280cbcb49'; 

// --- DOM Elements ---
const currentTzData = document.getElementById('current-timezone-data');
const addressForm = document.getElementById('address-form');
const addressInput = document.getElementById('address-input');
const addressResultTitle = document.getElementById('address-result-title');
const addressTzData = document.getElementById('address-timezone-data');
const errorMessage = document.getElementById('error-message');

// --- Utility Functions ---

/**
 * Updates the display elements with fetched timezone data.
 * @param {object} data - The timezone result object from Geoapify.
 * @param {string} prefix - The ID prefix ('current-tz-' or 'address-tz-').
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {string} country - Country name.
 * @param {string} postcode - Postcode.
 * @param {string} city - City name.
 */
function updateTimezoneDisplay(data, prefix, lat, lon, country, postcode, city) {
    document.getElementById(`${prefix}name`).textContent = data.name || 'N/A';
    document.getElementById(`${prefix}lat`).textContent = lat ? lat.toFixed(6) : 'N/A';
    document.getElementById(`${prefix}lon`).textContent = lon ? lon.toFixed(6) : 'N/A';
    document.getElementById(`${prefix}offset-std`).textContent = data.offset_STD || 'N/A';
    document.getElementById(`${prefix}offset-std-sec`).textContent = data.offset_STD_seconds || 'N/A';
    document.getElementById(`${prefix}offset-dst`).textContent = data.offset_DST || 'N/A';
    document.getElementById(`${prefix}offset-dst-sec`).textContent = data.offset_DST_seconds || 'N/A';
    document.getElementById(`${prefix}country`).textContent = country || 'N/A';
    document.getElementById(`${prefix}postcode`).textContent = postcode || 'N/A';
    document.getElementById(`${prefix}city`).textContent = city || 'N/A';
}

/**
 * Clears the address result display and hides the result panel.
 */
function clearAddressResult() {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    addressResultTitle.style.display = 'none';
    addressTzData.style.display = 'none';
    // Clear the result spans
    updateTimezoneDisplay({}, 'address-tz-', null, null, null, null, null);
}

// --- Main Fetch Functions ---

/**
 * Fetches timezone information using Geoapify's API.
 * @param {string} url - The full API URL (reverse or geocoding).
 * @param {string} prefix - The ID prefix for display update.
 */
async function fetchTimezone(url, prefix) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        // Check if a feature (result) was found
        const feature = result.features && result.features.length > 0 ? result.features[0].properties : null;
        
        if (feature && feature.timezone) {
            const tz = feature.timezone;
            const lat = feature.lat;
            const lon = feature.lon;
            const country = feature.country;
            const postcode = feature.postcode;
            const city = feature.city || feature.county || feature.street || feature.formatted; // Use best available location info

            updateTimezoneDisplay(tz, prefix, lat, lon, country, postcode, city);

            if (prefix === 'address-tz-') {
                addressResultTitle.style.display = 'block';
                addressTzData.style.display = 'block';
                errorMessage.style.display = 'none'; // Hide error if successful
            }
        } else {
             // Specific error for address search failure
            if (prefix === 'address-tz-') {
                showAddressError("Timezone or location could not be found for the entered address!");
            } else {
                 // Error for current location failure
                console.error("No timezone data found for current location.");
            }
        }
    } catch (error) {
        console.error('API Fetch Error:', error);
        if (prefix === 'address-tz-') {
            showAddressError("An error occurred during the API request.");
        } else {
            document.getElementById('current-tz-name').textContent = 'Error fetching data.';
        }
    }
}

/**
 * Displays the error message in the address result section.
 * @param {string} message - The error message to display.
 */
function showAddressError(message) {
    // Hide the data display as per the image's requirement for error
    addressResultTitle.style.display = 'none';
    addressTzData.style.display = 'none';
    
    errorMessage.textContent = message;
    errorMessage.style.display = 'block'; // Show error text
}


// --- Step 3: Fetch User's Current Timezone ---
function getCurrentTimezone() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Use Reverse Geocoding for current location coordinates
                const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${API_KEY}`;
                fetchTimezone(url, 'current-tz-');
            },
            (error) => {
                // Error getting geolocation (user denied, etc.)
                document.getElementById('current-tz-name').textContent = 'Geolocation Denied/Unavailable.';
                console.error('Geolocation Error:', error);
            }
        );
    } else {
        // Browser doesn't support Geolocation
        document.getElementById('current-tz-name').textContent = 'Geolocation not supported by this browser.';
    }
}

// --- Step 4: Retrieve Timezone by Address ---
addressForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent form submission and page reload
    
    clearAddressResult(); // Clear previous result/error before starting new search

    const address = addressInput.value.trim();

    // Basic Validation
    if (!address) {
        showAddressError("Please enter an address!");
        return;
    }

    // Use Geocoding for address text
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedAddress}&format=json&apiKey=${API_KEY}`;

    fetchTimezone(url, 'address-tz-');
});


// --- Initialization ---
// Fetch current timezone when the page loads
getCurrentTimezone();