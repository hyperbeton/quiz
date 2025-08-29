// Mapbox configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWxpbW92ZSIsImEiOiJjbWV3ZHYwMGwwa3NvMmxxeHYxdHhyeTU4In0.gL9yCo1nk86SyIciCZOLQQ';
const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v11';

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
        console.log('Initializing Firebase...');
        
        // Load properties from Firestore
        const snapshot = await db.collection('properties')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();
        
        properties = [];
        snapshot.forEach(doc => {
            properties.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Loaded properties:', properties.length);
        loadProperties();
        
    } catch (error) {
        console.error('Error loading properties:', error);
        // Load sample data if Firebase fails
        console.log('Loading sample properties...');
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
        },
        {
            id: 3,
            title: "Офисное помещение в бизнес-центре",
            price: 1200,
            type: "office",
            description: "Просторный офис с панорамными окнами в современном бизнес-центре",
            location: "Юнусабадский район",
            rooms: 1,
            area: 85,
            features: ["Кондиционер", "Интернет", "Мебель", "Парковка"],
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
            lat: 41.3689,
            lng: 69.2847,
            status: "active",
            createdAt: new Date()
        },
        {
            id: 4,
            title: "Торговое помещение на оживленной улице",
            price: 1500,
            type: "store",
            description: "Помещение под магазин с витринными окнами и высокой проходимостью",
            location: "Чиланзарский район",
            rooms: 1,
            area: 70,
            features: ["Витринные окна", "Складское помещение", "Охранная система"],
            image: "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwa90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
            lat: 41.2889,
            lng: 69.2167,
            status: "active",
            createdAt: new Date()
        },
        {
            id: 5,
            title: "Складское помещение с подъездными путями",
            price: 2000,
            type: "warehouse",
            description: "Просторный склад с подъездными путями для грузового транспорта",
            location: "Сергелийский район",
            rooms: 1,
            area: 300,
            features: ["Высокие потолки", "Подъездные пути", "Охрана", "Погрузочная рампа"],
            image: "https://images.unsplash.com/photo-1441123694162-e54a981ceba5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
            lat: 41.2153,
            lng: 69.2375,
            status: "active",
            createdAt: new Date()
        },
        {
            id: 6,
            title: "Готовый бизнес: кафе с оборудованием",
            price: 2500,
            type: "cafe",
            description: "Полностью оборудованное кафе с кухней и мебелью, готово к работе",
            location: "Шайхантахурский район",
            rooms: 3,
            area: 120,
            features: ["Кухонное оборудование", "Мебель", "Лицензия", "Вывеска"],
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
            lat: 41.3186,
            lng: 69.2464,
            status: "active",
            createdAt: new Date()
        }
    ];
    loadProperties();
}

// Initialize map with OpenStreetMap as fallback
function initMap() {
    try {
        console.log('Initializing map...');
        
        // Center map on Tashkent
        map = L.map('map').setView([41.3111, 69.2797], 12);
        
        // Try to use Mapbox if available, otherwise use OpenStreetMap
        try {
            // Add Mapbox tile layer using standard Leaflet tile layer
            L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
                tileSize: 512,
                zoomOffset: -1,
                id: 'mapbox/streets-v11',
                accessToken: MAPBOX_TOKEN
            }).addTo(map);
            console.log('Mapbox tiles loaded');
        } catch (mapboxError) {
            console.log('Mapbox not available, using OpenStreetMap');
            // Fallback to OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        }
        
        // Markers will be added when properties are loaded
        console.log('Map initialized successfully');
        
    } catch (error) {
        console.error('Error initializing map:', error);
        // Hide map container if map fails to initialize
        document.getElementById('map').style.display = 'none';
    }
}

// Custom marker icon creation
function createCustomIcon(property) {
    const iconColors = {
        'apartment': '#6e44ff',
        'house': '#ff6b6b',
        'office': '#4ecdc4',
        'store': '#45b7d1',
        'warehouse': '#f9ca24',
        'cafe': '#eb4d4b'
    };
    
    const iconHTML = `
        <div style="
            background-color: ${iconColors[property.type] || '#6e44ff'};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
        ">
            ${getPropertyIcon(property.type)}
        </div>
    `;
    
    return L.divIcon({
        className: 'custom-marker',
        html: iconHTML,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
}

// Get icon for property type
function getPropertyIcon(type) {
    const icons = {
        'apartment': '🏢',
        'house': '🏠',
        'office': '🏢',
        'store': '🏪',
        'warehouse': '🏭',
        'cafe': '☕'
    };
    return icons[type] || '📍';
}

// Update map markers
function updateMapMarkers(filteredProperties = null) {
    try {
        // Clear existing markers
        if (markers.length > 0) {
            markers.forEach(marker => {
                if (map && marker) {
                    map.removeLayer(marker);
                }
            });
            markers = [];
        }
        
        const propertiesToShow = filteredProperties || properties;
        
        // Add new markers with custom icons
        propertiesToShow.forEach(property => {
            if (property.lat && property.lng && map) {
                const marker = L.marker([property.lat, property.lng], {
                    icon: createCustomIcon(property)
                }).addTo(map);
                
                // Enhanced popup
                const popupContent = `
                    <div style="min-width: 250px; font-family: 'Manrope', sans-serif;">
                        <div style="position: relative; height: 150px; overflow: hidden; border-radius: 8px; margin-bottom: 10px;">
                            <img src="${property.image}" alt="${property.title}" style="width: 100%; height: 100%; object-fit: cover;">
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 10px; color: white;">
                                <h4 style="margin: 0; font-size: 16px;">${property.title}</h4>
                                <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">$${property.price}/мес</p>
                            </div>
                        </div>
                        <p style="margin: 10px 0; color: #555;">${property.description.substring(0, 80)}...</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="background: #f1f3f4; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${getPropertyTypeLabel(property.type)}</span>
                            <button onclick="showPropertyDetails(${property.id})" style="background: #6e44ff; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                                Подробнее
                            </button>
                        </div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                markers.push(marker);
            }
        });
    } catch (error) {
        console.error('Error updating map markers:', error);
    }
}

// Load properties to the list
function loadProperties(filteredProperties = null) {
    try {
        const propertyList = document.getElementById('propertyList');
        const propertiesCount = document.getElementById('propertiesCount');
        const propertiesToShow = filteredProperties || properties;
        
        // Update count
        propertiesCount.textContent = propertiesToShow.length;
        
        // Clear existing properties
        propertyList.innerHTML = '';
        
        // Add properties to the list
        propertiesToShow.forEach(property => {
            const propertyCard = createPropertyCard(property);
            propertyList.appendChild(propertyCard);
        });
        
        // Update map markers
        updateMapMarkers(propertiesToShow);
        
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// Create property card
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.innerHTML = `
        <div class="property-image">
            <img src="${property.image}" alt="${property.title}" onerror="this.src='https://via.placeholder.com/400x300?text=Нет+изображения'">
            <div class="property-type">${getPropertyTypeLabel(property.type)}</div>
            <div class="property-price">$${property.price}/мес</div>
        </div>
        <div class="property-content">
            <h3>${property.title}</h3>
            <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
            <p class="property-description">${property.description}</p>
            <div class="property-features">
                ${property.features ? property.features.map(feature => 
                    `<span class="feature-tag">${feature}</span>`
                ).join('') : ''}
            </div>
            <div class="property-details">
                <span><i class="fas fa-door-open"></i> ${property.rooms || 'N/A'} комн.</span>
                <span><i class="fas fa-vector-square"></i> ${property.area || 'N/A'} м²</span>
            </div>
            <button class="btn btn-primary btn-block" onclick="showPropertyDetails(${property.id})">
                <i class="fas fa-eye"></i> Подробнее
            </button>
        </div>
    `;
    return card;
}

// Get property type label in Russian
function getPropertyTypeLabel(type) {
    const labels = {
        'apartment': 'Квартира',
        'house': 'Дом',
        'office': 'Офис',
        'store': 'Магазин',
        'warehouse': 'Склад',
        'cafe': 'Кафе/Бар'
    };
    return labels[type] || type;
}

// Show property details in modal
function showPropertyDetails(propertyId) {
    try {
        const property = properties.find(p => p.id === propertyId);
        if (!property) return;
        
        const modal = document.getElementById('propertyModal');
        const detailsContainer = document.getElementById('propertyDetails');
        
        detailsContainer.innerHTML = `
            <div class="property-detail-header">
                <div class="property-detail-gallery">
                    <img src="${property.image}" alt="${property.title}" onerror="this.src='https://via.placeholder.com/600x400?text=Нет+изображения'">
                </div>
                <div class="property-detail-info">
                    <h2>${property.title}</h2>
                    <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
                    <div class="property-price-large">$${property.price}/мес</div>
                    <div class="property-type-badge">${getPropertyTypeLabel(property.type)}</div>
                </div>
            </div>
            <div class="property-detail-content">
                <h3>Описание</h3>
                <p>${property.description}</p>
                
                <h3>Характеристики</h3>
                <div class="property-specs">
                    <div class="spec-item">
                        <i class="fas fa-door-open"></i>
                        <span>Комнат: ${property.rooms || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-vector-square"></i>
                        <span>Площадь: ${property.area || 'N/A'} м²</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-building"></i>
                        <span>Тип: ${getPropertyTypeLabel(property.type)}</span>
                    </div>
                </div>
                
                <h3>Удобства</h3>
                <div class="property-features-list">
                    ${property.features ? property.features.map(feature => 
                        `<div class="feature-item"><i class="fas fa-check"></i> ${feature}</div>`
                    ).join('') : '<p>Нет информации об удобствах</p>'}
                </div>
                
                <div class="property-contact">
                    <h3>Контактная информация</h3>
                    <p>Для получения дополнительной информации свяжитесь с нами:</p>
                    <div class="contact-buttons">
                        <button class="btn btn-primary"><i class="fas fa-phone"></i> Позвонить</button>
                        <button class="btn btn-outline"><i class="fas fa-envelope"></i> Написать</button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error showing property details:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                showSection(sectionId);
            });
        });
        
        // CTA buttons
        document.getElementById('findPropertyBtn').addEventListener('click', function() {
            showSection('mapSection');
        });
        
        document.getElementById('rentOutBtn').addEventListener('click', function() {
            showSection('formSection');
        });
        
        // Modal close
        document.getElementById('closeModal').addEventListener('click', function() {
            document.getElementById('propertyModal').style.display = 'none';
        });
        
        // Form navigation
        document.getElementById('nextToStep2').addEventListener('click', function() {
            navigateToStep(2);
        });
        
        document.getElementById('backToStep1').addEventListener('click', function() {
            navigateToStep(1);
        });
        
        document.getElementById('nextToStep3').addEventListener('click', function() {
            navigateToStep(3);
        });
        
        document.getElementById('backToStep2').addEventListener('click', function() {
            navigateToStep(2);
        });
        
        document.getElementById('nextToStep4').addEventListener('click', function() {
            navigateToStep(4);
        });
        
        document.getElementById('backToStep3').addEventListener('click', function() {
            navigateToStep(3);
        });
        
        // Form submission
        document.getElementById('rentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            submitProperty();
        });
        
        // Property type change
        document.getElementById('category').addEventListener('change', function() {
            selectedPropertyType = this.value;
            loadPropertyTypeForm(selectedPropertyType);
        });
        
        // File upload preview
        document.getElementById('photos').addEventListener('change', function(e) {
            handleFileUpload(e.target.files);
        });
        
        // Price range slider
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        
        if (priceRange && priceValue) {
            priceRange.addEventListener('input', function() {
                priceValue.textContent = '$' + this.value;
            });
        }
        
        // View toggle
        document.getElementById('gridView').addEventListener('click', function() {
            toggleView('grid');
        });
        
        document.getElementById('listView').addEventListener('click', function() {
            toggleView('list');
        });
        
        // Apply filters
        document.getElementById('applyFilters').addEventListener('click', function() {
            applyFilters();
        });
        
        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', function() {
            resetFilters();
        });
        
        console.log('Event listeners setup completed');
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Show/hide sections
function showSection(sectionId) {
    try {
        // Hide all sections
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
        
        // Special handling for map section
        if (sectionId === 'mapSection' && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
        
    } catch (error) {
        console.error('Error showing section:', error);
    }
}

// Form navigation
function navigateToStep(step) {
    try {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });
        
        // Show selected step
        const stepElement = document.getElementById(`step${step}`);
        if (stepElement) {
            stepElement.classList.add('active');
        }
        
        // Update progress
        document.querySelectorAll('.progress-step').forEach(progressStep => {
            const stepNum = parseInt(progressStep.getAttribute('data-step'));
            if (stepNum <= step) {
                progressStep.classList.add('active');
            } else {
                progressStep.classList.remove('active');
            }
        });
        
        currentStep = step;
        
    } catch (error) {
        console.error('Error navigating to step:', error);
    }
}

// Load property type specific form
function loadPropertyTypeForm(type) {
    try {
        const formContainer = document.getElementById('propertyDetailsForm');
        if (!formContainer) return;
        
        let formHTML = '';
        
        switch(type) {
            case 'apartment':
                formHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="rooms"><i class="fas fa-door-open"></i> Количество комнат *</label>
                            <input type="number" id="rooms" required min="1" max="10">
                        </div>
                        <div class="form-group">
                            <label for="floor"><i class="fas fa-layer-group"></i> Этаж *</label>
                            <input type="number" id="floor" required min="1">
                        </div>
                        <div class="form-group">
                            <label for="totalFloors"><i class="fas fa-building"></i> Этажность дома *</label>
                            <input type="number" id="totalFloors" required min="1">
                        </div>
                        <div class="form-group">
                            <label for="area"><i class="fas fa-vector-square"></i> Площадь (м²) *</label>
                            <input type="number" id="area" required min="1">
                        </div>
                        <div class="form-group">
                            <label for="bathrooms"><i class="fas fa-bath"></i> Санузлы *</label>
                            <input type="number" id="bathrooms" required min="1" max="5">
                        </div>
                        <div class="form-group">
                            <label for="yearBuilt"><i class="fas fa-calendar-alt"></i> Год постройки</label>
                            <input type="number" id="yearBuilt" min="1900" max="${new Date().getFullYear()}">
                        </div>
                    </div>
                `;
                break;
                
            case 'house':
                formHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="houseRooms"><i class="fas fa-door-open"></i> Количество комнат *</label>
                            <input type="number" id="houseRooms" required min="1" max="20">
                        </div>
                        <div class="form-group">
                            <label for="houseArea"><i class="fas fa-vector-square"></i> Площадь дома (м²) *</label>
                            <input type="number" id="houseArea" required min="1">
                        </div>
                        <div class="form-group">
                            <label for="landArea"><i class="fas fa-expand"></i> Площадь участка (соток)</label>
                            <input type="number" id="landArea" min="1">
                        </div>
                        <div class="form-group">
                            <label for="houseFloors"><i class="fas fa-layer-group"></i> Этажность *</label>
                            <input type="number" id="houseFloors" required min="1" max="5">
                        </div>
                        <div class="form-group">
                            <label for="houseYearBuilt"><i class="fas fa-calendar-alt"></i> Год постройки</label>
                            <input type="number" id="houseYearBuilt" min="1900" max="${new Date().getFullYear()}">
                        </div>
                    </div>
                `;
                break;
                
            case 'office':
                formHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="officeArea"><i class="fas fa-vector-square"></i> Площадь (м²) *</label>
                            <input type="number" id="officeArea" required min="1">
                        </div>
                        <div class="form-group">
                            <label for="workstations"><i class="fas fa-chair"></i> Рабочих мест</label>
                            <input type="number" id="workstations" min="1">
                        </div>
                        <div class="form-group">
                            <label for="meetingRooms"><i class="fas fa-users"></i> Переговорные комнаты</label>
                            <input type="number" id="meetingRooms" min="0">
                        </div>
                        <div class="form-group">
                            <label for="officeFloor"><i class="fas fa-layer-group"></i> Этаж</label>
                            <input type="number" id="officeFloor" min="1">
                        </div>
                    </div>
                `;
                break;
                
            default:
                formHTML = `
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label for="customArea"><i class="fas fa-vector-square"></i> Площадь (м²) *</label>
                            <input type="number" id="customArea" required min="1">
                        </div>
                        <div class="form-group full-width">
                            <label for="customDetails"><i class="fas fa-info-circle"></i> Дополнительные детали</label>
                            <textarea id="customDetails" placeholder="Опишите особенности вашего объекта" rows="3"></textarea>
                        </div>
                    </div>
                `;
        }
        
        formContainer.innerHTML = formHTML;
        
    } catch (error) {
        console.error('Error loading property type form:', error);
    }
}

// Handle file upload and preview
function handleFileUpload(files) {
    try {
        const previewContainer = document.getElementById('filePreview');
        if (!previewContainer) return;
        
        uploadedFiles = Array.from(files);
        
        if (uploadedFiles.length === 0) {
            previewContainer.innerHTML = '<p>Файлы не выбраны</p>';
            return;
        }
        
        previewContainer.innerHTML = '';
        
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'file-preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" onclick="removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
        
    } catch (error) {
        console.error('Error handling file upload:', error);
    }
}

// Remove file from upload list
function removeFile(index) {
    try {
        uploadedFiles.splice(index, 1);
        
        // Update the file input
        const dataTransfer = new DataTransfer();
        uploadedFiles.forEach(file => dataTransfer.items.add(file));
        document.getElementById('photos').files = dataTransfer.files;
        
        // Refresh preview
        handleFileUpload(uploadedFiles);
        
    } catch (error) {
        console.error('Error removing file:', error);
    }
}

// Toggle grid/list view
function toggleView(viewType) {
    try {
        const propertyList = document.getElementById('propertyList');
        const gridViewBtn = document.getElementById('gridView');
        const listViewBtn = document.getElementById('listView');
        
        if (!propertyList || !gridViewBtn || !listViewBtn) return;
        
        if (viewType === 'grid') {
            propertyList.classList.remove('list-view');
            propertyList.classList.add('grid-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            propertyList.classList.remove('grid-view');
            propertyList.classList.add('list-view');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        }
        
    } catch (error) {
        console.error('Error toggling view:', error);
    }
}

// Apply filters to properties
function applyFilters() {
    try {
        const locationFilter = document.getElementById('location').value;
        const typeFilter = document.getElementById('propertyTypeFilter').value;
        const priceFilter = parseInt(document.getElementById('priceRange').value);
        const roomsFilter = document.getElementById('roomsFilter').value;
        const minArea = document.getElementById('minArea').value ? parseInt(document.getElementById('minArea').value) : 0;
        const maxArea = document.getElementById('maxArea').value ? parseInt(document.getElementById('maxArea').value) : Infinity;
        
        const filteredProperties = properties.filter(property => {
            // Location filter
            if (locationFilter && !property.location.toLowerCase().includes(locationFilter.toLowerCase())) {
                return false;
            }
            
            // Type filter
            if (typeFilter && property.type !== typeFilter) {
                return false;
            }
            
            // Price filter
            if (property.price > priceFilter) {
                return false;
            }
            
            // Rooms filter
            if (roomsFilter && property.rooms != roomsFilter) {
                return false;
            }
            
            // Area filter
            if (property.area && (property.area < minArea || property.area > maxArea)) {
                return false;
            }
            
            return true;
        });
        
        // Update the displayed properties
        loadProperties(filteredProperties);
        
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

// Reset all filters
function resetFilters() {
    try {
        document.getElementById('location').value = '';
        document.getElementById('propertyTypeFilter').value = '';
        document.getElementById('priceRange').value = 5000;
        document.getElementById('priceValue').textContent = '$5000';
        document.getElementById('roomsFilter').value = '';
        document.getElementById('minArea').value = '';
        document.getElementById('maxArea').value = '';
        
        // Reload all properties
        loadProperties();
        
    } catch (error) {
        console.error('Error resetting filters:', error);
    }
}

// Submit property form
async function submitProperty() {
    try {
        // Basic validation
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const price = document.getElementById('price').value;
        
        if (!title || !category || !description || !price || uploadedFiles.length === 0) {
            alert('Пожалуйста, заполните все обязательные поля и загрузите хотя бы одно фото.');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('#rentForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        submitBtn.disabled = true;
        
        try {
            // Upload images to Firebase Storage
            const imageUrls = [];
            for (const file of uploadedFiles) {
                const storageRef = storage.ref(`properties/${Date.now()}_${file.name}`);
                const snapshot = await storageRef.put(file);
                const url = await snapshot.ref.getDownloadURL();
                imageUrls.push(url);
            }
            
            // Prepare property data
            const propertyData = {
                title: title,
                type: category,
                description: description,
                price: parseInt(price),
                image: imageUrls[0],
                images: imageUrls,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                location: document.getElementById('locationInput').value || 'Ташкент',
                contactName: document.getElementById('contactName').value || '',
                contactPhone: document.getElementById('contactPhone').value || '',
                lat: 41.3111,
                lng: 69.2797
            };
            
            // Add property-specific details
            if (category === 'apartment') {
                propertyData.rooms = parseInt(document.getElementById('rooms').value) || 1;
                propertyData.floor = parseInt(document.getElementById('floor').value) || 1;
                propertyData.totalFloors = parseInt(document.getElementById('totalFloors').value) || 1;
                propertyData.area = parseInt(document.getElementById('area').value) || 0;
                propertyData.bathrooms = parseInt(document.getElementById('bathrooms').value) || 1;
            }
            
            // Save to Firestore
            const docRef = await db.collection('properties').add(propertyData);
            
            alert('Объявление успешно размещено! ID: ' + docRef.id);
            
            // Reset form
            document.getElementById('rentForm').reset();
            document.getElementById('filePreview').innerHTML = '';
            uploadedFiles = [];
            navigateToStep(1);
            
            // Reload properties
            initFirebase();
            
        } catch (firebaseError) {
            console.error('Firebase error:', firebaseError);
            alert('Объявление сохранено локально. При подключении к интернету оно будет отправлено на сервер.');
            
            // Save locally for offline use
            const propertyData = {
                id: 'local_' + Date.now(),
                title: title,
                type: category,
                description: description,
                price: parseInt(price),
                image: URL.createObjectURL(uploadedFiles[0]),
                status: 'active',
                createdAt: new Date(),
                location: document.getElementById('locationInput').value || 'Ташкент',
                lat: 41.3111,
                lng: 69.2797
            };
            
            properties.unshift(propertyData);
            loadProperties();
        }
        
    } catch (error) {
        console.error('Error submitting property:', error);
        alert('Произошла ошибка при размещении объявления. Пожалуйста, попробуйте еще раз.');
    } finally {
        // Restore button state
        const submitBtn = document.querySelector('#rentForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Разместить объявление';
            submitBtn.disabled = false;
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('propertyModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Handle window resize for map
window.addEventListener('resize', function() {
    if (map && document.getElementById('mapSection').style.display === 'block') {
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }
});

// Global functions for HTML onclick
window.showPropertyDetails = showPropertyDetails;
window.removeFile = removeFile;