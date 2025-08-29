// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD_dZ3uPra32WQGDIZZ2vyFwCdNgWCBPEM",
  authDomain: "apprent-e0f19.firebaseapp.com",
  projectId: "apprent-e0f19",
  storageBucket: "apprent-e0f19.firebasestorage.app",
  messagingSenderId: "840126144107",
  appId: "1:840126144107:web:3e55aa942a46fdeec8db2e",
  measurementId: "G-7WG51CLWKQ"
};










// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Global variables
let currentStep = 1;
let map, markers = [];
let selectedPropertyType = '';
let uploadedFiles = [];
let properties = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initFirebase();
    initMap();
    setupEventListeners();
    showSection('homeSection');
});

// Initialize Firebase and load properties
async function initFirebase() {
    try {
        // Load properties from Firestore
        const snapshot = await db.collection('properties')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();
        
        properties = [];
        snapshot.forEach(doc => {
            properties.push({ id: doc.id, ...doc.data() });
        });
        
        loadProperties();
        
    } catch (error) {
        console.error('Error loading properties:', error);
        // Load sample data if Firebase fails
        loadSampleProperties();
    }
}

// Load sample properties (fallback)
function loadSampleProperties() {
    properties = [
        {
            id: 1,
            title: "Современная 2-комнатная квартира",
            price: 450,
            type: "apartment",
            description: "Просторная квартира с современным ремонтом в центре города",
            location: "Мирзо-Улугбекский район",
            rooms: 2,
            area: 65,
            features: ["Кондиционер", "Меблирована", "Интернет"],
            image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
            lat: 41.3111,
            lng: 69.2797,
            status: "active",
            createdAt: new Date()
        },
        {
            id: 2,
            title: "Уютный дом с садом",
            price: 800,
            type: "house",
            description: "Частный дом с большим садом и гаражом в тихом районе",
            location: "Яшнабадский район",
            rooms: 4,
            area: 120,
            features: ["Сад", "Гараж", "Меблирована", "Кухонная техника"],
            image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
            lat: 41.2811,
            lng: 69.3581,
            status: "active",
            createdAt: new Date()
        }
    ];
    loadProperties();
}

// Initialize map
function initMap() {
    // Center map on Tashkent
    map = L.map('map').setView([41.3111, 69.2797], 12);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Markers will be added when properties are loaded
}

// Update map markers
function updateMapMarkers() {
    // Clear existing markers
    if (markers.length > 0) {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
    }
    
    // Add new markers
    properties.forEach(property => {
        if (property.lat && property.lng) {
            const marker = L.marker([property.lat, property.lng]).addTo(map);
            
            // Custom popup without "Подробнее" button
            marker.bindPopup(`
                <div class="map-popup" style="min-width: 200px;">
                    <img src="${property.image}" alt="${property.title}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;">
                    <h4 style="margin:10px 0 5px; font-size:16px;">${property.title}</h4>
                    <p style="margin:0; color:#6e44ff; font-weight:bold;">${property.price}$ / мес</p>
                    <p style="margin:5px 0; font-size:14px;">${property.location}</p>
                    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:8px;">
                        ${property.features.map(feature => `<span style="background:rgba(110, 68, 255, 0.15); padding:3px 8px; border-radius:12px; font-size:11px; color:#6e44ff;">${feature}</span>`).join('')}
                    </div>
                </div>
            `);
            
            markers.push(marker);
        }
    });
}

// Load properties into the list
function loadProperties(filteredProperties = null) {
    const propertyList = document.getElementById('propertyList');
    const propertiesToShow = filteredProperties || properties;
    
    propertyList.innerHTML = '';
    
    // Update properties count
    document.getElementById('propertiesCount').textContent = propertiesToShow.length;
    
    // Update map markers
    updateMapMarkers();
    
    propertiesToShow.forEach(property => {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'property-card';
        propertyCard.innerHTML = `
            <img src="${property.image}" alt="${property.title}" class="property-image">
            <div class="property-details">
                <h3 class="property-title">${property.title}</h3>
                <div class="property-price">${property.price}$ / мес</div>
                <p class="property-description">${property.description}</p>
                <div class="property-features">
                    ${property.features.map(feature => `<span class="property-feature">${feature}</span>`).join('')}
                </div>
                <div class="property-location">
                    <i class="fas fa-map-marker-alt"></i> ${property.location}
                </div>
                <button class="btn btn-primary btn-block view-details" data-id="${property.id}">
                    <i class="fas fa-eye"></i> Подробнее
                </button>
            </div>
        `;
        propertyList.appendChild(propertyCard);
    });
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            showPropertyDetails(id);
        });
    });
}

// Show property details in modal
function showPropertyDetails(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;
    
    const propertyDetails = document.getElementById('propertyDetails');
    propertyDetails.innerHTML = `
        <div class="property-details-modal">
            <img src="${property.image}" alt="${property.title}" style="width:100%; height:250px; object-fit:cover; border-radius:12px; margin-bottom:20px;">
            <h3>${property.title}</h3>
            <div style="font-size:24px; font-weight:700; color:var(--primary-light); margin:10px 0;">${property.price}$ / мес</div>
            <p>${property.description}</p>
            <div style="display:flex; align-items:center; gap:8px; margin:15px 0;">
                <i class="fas fa-map-marker-alt" style="color:var(--gray);"></i>
                <span>${property.location}</span>
            </div>
            <div style="display:flex; gap:10px; margin:15px 0;">
                <div style="background:var(--glass-bg); padding:8px 16px; border-radius:8px;">
                    <div style="font-size:12px; color:var(--gray);">Комнат</div>
                    <div style="font-weight:600;">${property.rooms}</div>
                </div>
                <div style="background:var(--glass-bg); padding:8px 16px; border-radius:8px;">
                    <div style="font-size:12px; color:var(--gray);">Площадь</div>
                    <div style="font-weight:600;">${property.area} м²</div>
                </div>
                <div style="background:var(--glass-bg); padding:8px 16px; border-radius:8px;">
                    <div style="font-size:12px; color:var(--gray);">Тип</div>
                    <div style="font-weight:600;">${getPropertyTypeName(property.type)}</div>
                </div>
            </div>
            <h4 style="margin:20px 0 10px;">Удобства</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;">
                ${property.features.map(feature => `<span style="background:rgba(110, 68, 255, 0.15); padding:5px 12px; border-radius:20px; font-size:12px; color:var(--primary-light);">${feature}</span>`).join('')}
            </div>
            <button class="btn btn-primary btn-large contact-owner" data-phone="${property.contactPhone || ''}" style="width:100%;">
                <i class="fas fa-phone"></i> Связаться с арендодателем
            </button>
        </div>
    `;
    
    // Add contact functionality
    const contactBtn = propertyDetails.querySelector('.contact-owner');
    if (contactBtn) {
        contactBtn.addEventListener('click', function() {
            const phone = this.getAttribute('data-phone');
            if (phone) {
                window.open(`tel:${phone}`, '_blank');
            } else {
                alert('Контактный телефон не указан');
            }
        });
    }
    
    document.getElementById('propertyModal').style.display = 'flex';
}

// Get property type name
function getPropertyTypeName(type) {
    const types = {
        'apartment': 'Квартира',
        'house': 'Дом',
        'office': 'Офис',
        'store': 'Магазин',
        'warehouse': 'Склад',
        'cafe': 'Кафе/Бар'
    };
    return types[type] || type;
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // CTA buttons
    document.getElementById('findPropertyBtn').addEventListener('click', function() {
        showSection('mapSection');
    });
    
    document.getElementById('rentOutBtn').addEventListener('click', function() {
        showSection('formSection');
        resetForm();
    });
    
    // Form navigation
    document.getElementById('nextToStep2').addEventListener('click', function() {
        if (validateStep(1)) {
            selectedPropertyType = document.getElementById('category').value;
            loadPropertyTypeForm(selectedPropertyType);
            goToStep(2);
        }
    });
    
    document.getElementById('backToStep1').addEventListener('click', function() {
        goToStep(1);
    });
    
    document.getElementById('nextToStep3').addEventListener('click', function() {
        if (validateStep(2)) {
            goToStep(3);
        }
    });
    
    document.getElementById('backToStep2').addEventListener('click', function() {
        goToStep(2);
    });
    
    document.getElementById('nextToStep4').addEventListener('click', function() {
        if (validateStep(3)) {
            goToStep(4);
        }
    });
    
    document.getElementById('backToStep3').addEventListener('click', function() {
        goToStep(3);
    });
    
    // Form submission
    document.getElementById('rentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateStep(4)) {
            submitForm();
        }
    });
    
    // Modal close
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('propertyModal').style.display = 'none';
    });
    
    // Price range slider
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    
    priceRange.addEventListener('input', function() {
        priceValue.textContent = '$' + this.value;
    });
    
    // View toggle
    document.getElementById('gridView').addEventListener('click', function() {
        document.getElementById('propertyList').className = 'property-list grid-view';
        this.classList.add('active');
        document.getElementById('listView').classList.remove('active');
    });
    
    document.getElementById('listView').addEventListener('click', function() {
        document.getElementById('propertyList').className = 'property-list list-view';
        this.classList.add('active');
        document.getElementById('gridView').classList.remove('active');
    });
    
    // Apply filters
    document.getElementById('applyFilters').addEventListener('click', function() {
        applyFilters();
    });
    
    // Reset filters
    document.getElementById('resetFilters').addEventListener('click', function() {
        document.getElementById('location').value = '';
        document.getElementById('propertyTypeFilter').value = '';
        document.getElementById('priceRange').value = 5000;
        document.getElementById('priceValue').textContent = '$5000';
        document.getElementById('roomsFilter').value = '';
        document.getElementById('minArea').value = '';
        document.getElementById('maxArea').value = '';
        loadProperties();
    });
    
    // File upload preview
    document.getElementById('photos').addEventListener('change', function(e) {
        const filePreview = document.getElementById('filePreview');
        filePreview.innerHTML = '';
        uploadedFiles = [];
        
        if (this.files && this.files.length > 0) {
            Array.from(this.files).forEach(file => {
                uploadedFiles.push(file);
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'file-preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="${file.name}">
                        <button type="button"><i class="fas fa-times"></i></button>
                    `;
                    
                    previewItem.querySelector('button').addEventListener('click', function() {
                        const index = uploadedFiles.findIndex(f => f.name === file.name);
                        if (index !== -1) {
                            uploadedFiles.splice(index, 1);
                        }
                        previewItem.remove();
                    });
                    
                    filePreview.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });
        }
    });
}

// Apply filters to properties
function applyFilters() {
    const locationFilter = document.getElementById('location').value;
    const typeFilter = document.getElementById('propertyTypeFilter').value;
    const priceFilter = parseInt(document.getElementById('priceRange').value);
    const roomsFilter = document.getElementById('roomsFilter').value;
    const minArea = document.getElementById('minArea').value ? parseInt(document.getElementById('minArea').value) : 0;
    const maxArea = document.getElementById('maxArea').value ? parseInt(document.getElementById('maxArea').value) : Infinity;
    
    const filteredProperties = properties.filter(property => {
        // Location filter
        if (locationFilter && property.location !== locationFilter) return false;
        
        // Type filter
        if (typeFilter && property.type !== typeFilter) return false;
        
        // Price filter
        if (property.price > priceFilter) return false;
        
        // Rooms filter
        if (roomsFilter && property.rooms) {
            if (roomsFilter === '4' && property.rooms < 4) return false;
            if (roomsFilter !== '4' && property.rooms != roomsFilter) return false;
        }
        
        // Area filter
        if (property.area < minArea || property.area > maxArea) return false;
        
        return true;
    });
    
    loadProperties(filteredProperties);
}

// Show/hide sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the requested section
    document.getElementById(sectionId).style.display = 'block';
    
    // Special handling for map section
    if (sectionId === 'mapSection') {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

// Form navigation functions
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show the current step
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach(progressStep => {
        const stepNum = parseInt(progressStep.getAttribute('data-step'));
        if (stepNum === step) {
            progressStep.classList.add('active');
        } else if (stepNum < step) {
            progressStep.classList.add('completed');
        } else {
            progressStep.classList.remove('active', 'completed');
        }
    });
    
    currentStep = step;
}

// Validate form step
function validateStep(step) {
    let isValid = true;
    
    if (step === 1) {
        const title = document.getElementById('title');
        const category = document.getElementById('category');
        const photos = document.getElementById('photos');
        const description = document.getElementById('description');
        const price = document.getElementById('price');
        const ownerType = document.getElementById('ownerType');
        
        if (!title.value.trim()) {
            highlightError(title);
            isValid = false;
        }
        
        if (!category.value) {
            highlightError(category);
            isValid = false;
        }
        
        if (uploadedFiles.length === 0) {
            highlightError(photos);
            isValid = false;
        }
        
        if (!description.value.trim()) {
            highlightError(description);
            isValid = false;
        }
        
        if (!price.value || price.value <= 0) {
            highlightError(price);
            isValid = false;
        }
        
        if (!ownerType.value) {
            highlightError(ownerType);
            isValid = false;
        }
    }
    
    // Add validation for other steps as needed
    
    return isValid;
}

// Highlight field with error
function highlightError(field) {
    field.style.borderColor = 'red';
    setTimeout(() => {
        field.style.borderColor = '';
    }, 3000);
}

// Load property type specific form
function loadPropertyTypeForm(type) {
    const formContainer = document.getElementById('propertyDetailsForm');
    
    let formHTML = '';
    
    switch(type) {
        case 'apartment':
            formHTML = `
                <div class="form-grid">
                    <div class="form-group">
                        <label for="rooms"><i class="fas fa-door-open"></i> Количество комнат *</label>
                        <select id="rooms" required>
                            <option value="">Выберите количество</option>
                            <option value="1">1 комната</option>
                            <option value="2">2 комнаты</option>
                            <option value="3">3 комнаты</option>
                            <option value="4">4+ комнаты</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="floor"><i class="fas fa-layer-group"></i> Этаж *</label>
                        <input type="number" id="floor" required min="1">
                    </div>
                    <div class="form-group">
                        <label for="totalFloors"><i class="fas fa-building"></i> Всего этажей в доме *</label>
                        <input type="number" id="totalFloors" required min="1">
                    </div>
                    <div class="form-group">
                        <label for="area"><i class="fas fa-vector-square"></i> Площадь (м²) *</label>
                        <input type="number" id="area" required min="1">
                    </div>
                    <div class="form-group">
                        <label for="yearBuilt"><i class="fas fa-calendar-alt"></i> Год постройки</label>
                        <input type="number" id="yearBuilt" min="1900" max="2023">
                    </div>
                    <div class="form-group">
                        <label for="bathrooms"><i class="fas fa-bath"></i> Санузлы *</label>
                        <select id="bathrooms" required>
                            <option value="">Выберите количество</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3+</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        case 'house':
            formHTML = `
                <div class="form-grid">
                    <div class="form-group">
                        <label for="houseRooms"><i class="fas fa-door-open"></i> Количество комнат *</label>
                        <select id="houseRooms" required>
                            <option value="">Выберите количество</option>
                            <option value="1">1 комната</option>
                            <option value="2">2 комнаты</option>
                            <option value="3">3 комнаты</option>
                            <option value="4">4 комнаты</option>
                            <option value="5">5+ комнат</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="houseArea"><i class="fas fa-vector-square"></i> Площадь дома (м²) *</label>
                        <input type="number" id="houseArea" required min="1">
                    </div>
                    <div class="form-group">
                        <label for="landArea"><i class="fas fa-vector-square"></i> Площадь участка (соток)</label>
                        <input type="number" id="landArea" min="1">
                    </div>
                    <div class="form-group">
                        <label for="houseFloors"><i class="fas fa-layer-group"></i> Этажность *</label>
                        <input type="number" id="houseFloors" required min="1" value="1">
                    </div>
                    <div class="form-group">
                        <label for="houseYearBuilt"><i class="fas fa-calendar-alt"></i> Год постройки</label>
                        <input type="number" id="houseYearBuilt" min="1900" max="2023">
                    </div>
                    <div class="form-group">
                        <label for="houseBathrooms"><i class="fas fa-bath"></i> Санузлы *</label>
                        <select id="houseBathrooms" required>
                            <option value="">Выберите количество</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3+</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        default:
            formHTML = `
                <div class="form-grid">
                    <div class="form-group">
                        <label for="propertyArea"><i class="fas fa-vector-square"></i> Площадь (м²) *</label>
                        <input type="number" id="propertyArea" required min="1">
                    </div>
                    <div class="form-group">
                        <label for="propertyFloors"><i class="fas fa-layer-group"></i> Этаж</label>
                        <input type="number" id="propertyFloors" min="0">
                    </div>
                    <div class="form-group">
                        <label for="propertyYearBuilt"><i class="fas fa-calendar-alt"></i> Год постройки/ремонта</label>
                        <input type="number" id="propertyYearBuilt" min="1900" max="2023">
                    </div>
                    <div class="form-group full-width">
                        <label for="additionalInfo"><i class="fas fa-info-circle"></i> Дополнительная информация</label>
                        <textarea id="additionalInfo" placeholder="Особенности помещения, планировка и т.д."></textarea>
                    </div>
                </div>
            `;
    }
    
    formContainer.innerHTML = formHTML;
}

// Upload image to Firebase Storage
async function uploadImage(file) {
    try {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`properties/${Date.now()}_${file.name}`);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Submit form to Firebase
async function submitForm() {
    try {
        // Show loading state
        const submitBtn = document.querySelector('#rentForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        submitBtn.disabled = true;

        // Upload images
        const imageUrls = [];
        for (const file of uploadedFiles) {
            try {
                const url = await uploadImage(file);
                imageUrls.push(url);
            } catch (error) {
                console.error('Failed to upload image:', error);
            }
        }

        // Collect form data
        const formData = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            description: document.getElementById('description').value,
            price: parseInt(document.getElementById('price').value),
            ownerType: document.getElementById('ownerType').value,
            location: document.getElementById('locationInput').value,
            contactName: document.getElementById('contactName').value,
            contactPhone: document.getElementById('contactPhone').value,
            contactEmail: document.getElementById('contactEmail').value || '',
            images: imageUrls,
            status: 'pending', // pending, active, rejected
            createdAt: new Date(),
            views: 0
        };

        // Get amenities
        const amenities = [];
        document.querySelectorAll('input[name="amenities"]:checked').forEach(checkbox => {
            amenities.push(checkbox.value);
        });
        
        // Get nearby facilities
        const nearby = [];
        document.querySelectorAll('input[name="nearby"]:checked').forEach(checkbox => {
            nearby.push(checkbox.value);
        });
        
        formData.amenities = amenities;
        formData.nearby = nearby;

        // Get property-specific details
        if (selectedPropertyType === 'apartment') {
            formData.rooms = parseInt(document.getElementById('rooms').value);
            formData.floor = parseInt(document.getElementById('floor').value);
            formData.totalFloors = parseInt(document.getElementById('totalFloors').value);
            formData.area = parseInt(document.getElementById('area').value);
            formData.yearBuilt = document.getElementById('yearBuilt').value ? parseInt(document.getElementById('yearBuilt').value) : null;
            formData.bathrooms = parseInt(document.getElementById('bathrooms').value);
        } else if (selectedPropertyType === 'house') {
            formData.rooms = parseInt(document.getElementById('houseRooms').value);
            formData.area = parseInt(document.getElementById('houseArea').value);
            formData.landArea = document.getElementById('landArea').value ? parseInt(document.getElementById('landArea').value) : null;
            formData.floors = parseInt(document.getElementById('houseFloors').value);
            formData.yearBuilt = document.getElementById('houseYearBuilt').value ? parseInt(document.getElementById('houseYearBuilt').value) : null;
            formData.bathrooms = parseInt(document.getElementById('houseBathrooms').value);
        } else {
            formData.area = parseInt(document.getElementById('propertyArea').value);
            formData.floor = document.getElementById('propertyFloors').value ? parseInt(document.getElementById('propertyFloors').value) : null;
            formData.yearBuilt = document.getElementById('propertyYearBuilt').value ? parseInt(document.getElementById('propertyYearBuilt').value) : null;
            formData.additionalInfo = document.getElementById('additionalInfo').value;
        }

        // Save to Firestore
        const docRef = await db.collection('properties').add(formData);

        // Also send to Telegram for notification
        await sendToTelegram(formData);

        alert('✅ Ваше объявление успешно отправлено на модерацию! Мы свяжемся с вами после проверки.');
        resetForm();
        showSection('homeSection');

    } catch (error) {
        console.error('Error submitting form:', error);
        alert('❌ Произошла ошибка при отправке объявления. Пожалуйста, попробуйте еще раз.');
    } finally {
        // Restore button state
        const submitBtn = document.querySelector('#rentForm button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Разместить объявление';
        submitBtn.disabled = false;
    }
}

// Send notification to Telegram
async function sendToTelegram(formData) {
    try {
        const token = '7966741167:AAHSGufTD93Dew1P4jEMJsQcXZZs_WEfjfQ';
        const chatId = '-1002334913768';
        
        let message = `🏠 *НОВОЕ ОБЪЯВЛЕНИЕ ОБ АРЕНДЕ* 🏠\n\n`;
        message += `*Название:* ${formData.title}\n`;
        message += `*Тип недвижимости:* ${getPropertyTypeName(formData.category)}\n`;
        message += `*Цена:* $${formData.price} / мес\n`;
        message += `*Описание:* ${formData.description}\n\n`;
        
        message += `*Детали объекта:*\n`;
        if (formData.rooms) message += `• Комнат: ${formData.rooms}\n`;
        if (formData.area) message += `• Площадь: ${formData.area} м²\n`;
        if (formData.floor) message += `• Этаж: ${formData.floor}\n`;
        if (formData.totalFloors) message += `• Этажность дома: ${formData.totalFloors}\n`;
        if (formData.yearBuilt) message += `• Год постройки: ${formData.yearBuilt}\n`;
        if (formData.bathrooms) message += `• Санузлы: ${formData.bathrooms}\n\n`;
        
        if (formData.amenities.length > 0) {
            message += `*Удобства:* ${formData.amenities.join(', ')}\n`;
        }
        
        if (formData.nearby.length > 0) {
            message += `*Рядом есть:* ${formData.nearby.join(', ')}\n`;
        }
        
        message += `\n*Контактная информация:*\n`;
        message += `• Имя: ${formData.contactName}\n`;
        message += `• Телефон: ${formData.contactPhone}\n`;
        if (formData.contactEmail) message += `• Email: ${formData.contactEmail}\n`;
        message += `• Местоположение: ${formData.location}\n`;
        message += `• Тип арендодателя: ${formData.ownerType === 'private' ? 'Частное лицо' : 'Бизнес'}\n`;
        
        message += `\n*Количество фото:* ${formData.images.length}`;

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        return false;
    }
}

// Reset form to initial state
function resetForm() {
    document.getElementById('rentForm').reset();
    document.getElementById('filePreview').innerHTML = '';
    uploadedFiles = [];
    goToStep(1);
}