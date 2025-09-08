// Mapbox configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWxpbW92ZSIsImEiOiJjbWV3ZHYwMGwwa3NvMmxxeHYxdHhyeTU4In0.gL9yCo1nk86SyIciCZOLQQ';

// Global variables
let currentStep = 1;
let map, markers = [];
let selectedPropertyType = '';
let uploadedFiles = [];
let properties = [];
let isOnline = navigator.onLine;
let selectionMap, selectionMarker;
let selectedLocation = null;

// Sample properties data
const sampleProperties = [
    {
        id: 1,
        title: "Современная 2-комнатная квартира",
        price: 450,
        type: "apartment",
        description: "Просторная квартира с современным ремонтом в центре города. Большие окна, высокие потолки, современная кухня и санузел.",
        location: "Мирзо-Улугбекский район",
        rooms: 2,
        area: 65,
        features: ["Кондиционер", "Меблирована", "Интернет", "Телевизор", "Холодильник"],
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        lat: 41.3111,
        lng: 69.2797,
        contactPhone: "+998901234567",
        contactName: "Алишер"
    },
    {
        id: 2,
        title: "Уютный дом с садом",
        price: 800,
        type: "house",
        description: "Частный дом с большим садом и гаражом в тихом районе. Идеально для семьи с детьми.",
        location: "Яшнабадский район",
        rooms: 4,
        area: 120,
        features: ["Сад", "Гараж", "Меблирована", "Кухонная техника", "Стиральная машина"],
        image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        lat: 41.2811,
        lng: 69.3581,
        contactPhone: "+998902345678",
        contactName: "Дилорам"
    },
    {
        id: 3,
        title: "Офисное помещение в бизнес-центре",
        price: 1200,
        type: "office",
        description: "Просторный офис с панорамными окнами в современном бизнес-центре. Готов к работе.",
        location: "Юнусабадский район",
        rooms: 1,
        area: 85,
        features: ["Кондиционер", "Интернет", "Мебель", "Парковка", "Ресепшен"],
        image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        lat: 41.3689,
        lng: 69.2847,
        contactPhone: "+998903456789",
        contactName: "Бизнес-центр 'Плаза'"
    },
    {
        id: 4,
        title: "Торговое помещение на оживленной улице",
        price: 1500,
        type: "store",
        description: "Помещение под магазин с витринными окнами и высокой проходимостью. Отличное расположение.",
        location: "Чиланзарский район",
        rooms: 1,
        area: 70,
        features: ["Витринные окна", "Складское помещение", "Охранная система", "Кондиционер"],
        image: "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        lat: 41.2889,
        lng: 69.2167,
        contactPhone: "+998904567890",
        contactName: "Коммерческая недвижимость"
    },
    {
        id: 5,
        title: "Современная 3-комнатная квартира",
        price: 600,
        type: "apartment",
        description: "Новая квартира с евроремонтом в спальном районе. Тихий двор, детская площадка.",
        location: "Чиланзарский район",
        rooms: 3,
        area: 80,
        features: ["Новый ремонт", "Лоджия", "Встроенная кухня", "Санузел раздельный"],
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        lat: 41.2750,
        lng: 69.2250,
        contactPhone: "+998905678901",
        contactName: "Марина"
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
    loadProperties();
    showSection('homeSection');
    
    // Check if we have saved properties in localStorage
    const savedProperties = localStorage.getItem('rentuz_properties');
    if (savedProperties) {
        try {
            const parsedProperties = JSON.parse(savedProperties);
            // Combine sample properties with saved ones
            properties = [...sampleProperties, ...parsedProperties];
            loadProperties();
        } catch (e) {
            console.error('Error loading saved properties:', e);
            properties = sampleProperties;
        }
    } else {
        properties = sampleProperties;
    }
});

// Initialize map
function initMap() {
    try {
        console.log('Initializing map...');
        
        // Center map on Tashkent
        map = L.map('map').setView([41.3111, 69.2797], 12);
        
        // Use Mapbox tiles with your token
        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
            attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: MAPBOX_TOKEN
        }).addTo(map);
        
        console.log('Map initialized successfully');
        
    } catch (error) {
        console.error('Error initializing map:', error);
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Карта временно недоступна</div>';
        }
    }
}

// Initialize selection map for location picking
function initSelectionMap() {
    try {
        // Center map on Tashkent
        selectionMap = L.map('selectionMap').setView([41.3111, 69.2797], 12);
        
        // Use Mapbox tiles with your token
        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
            attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: MAPBOX_TOKEN
        }).addTo(selectionMap);
        
        // Add click event to set location
        selectionMap.on('click', function(e) {
            setSelectionMarker(e.latlng);
        });
        
        console.log('Selection map initialized successfully');
        
    } catch (error) {
        console.error('Error initializing selection map:', error);
    }
}

// Set marker on selection map
function setSelectionMarker(latlng) {
    // Remove existing marker
    if (selectionMarker) {
        selectionMap.removeLayer(selectionMarker);
    }
    
    // Add new marker
    selectionMarker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #6e44ff; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })
    }).addTo(selectionMap);
    
    // Update selected location
    selectedLocation = latlng;
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
        'office': '💼',
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
                        <div style="position: relative; height: 120px; overflow: hidden; border-radius: 8px; margin-bottom: 10px;">
                            <img src="${property.image}" alt="${property.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/300x200?text=Фото'">
                        </div>
                        <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #2d3436;">${property.title}</h4>
                        <div style="color: #6e44ff; font-size: 18px; font-weight: bold; margin-bottom: 8px;">$${property.price}/мес</div>
                        <p style="margin: 0 0 10px 0; color: #636e72; font-size: 14px;">${property.description.substring(0, 60)}...</p>
                        <button onclick="showPropertyDetails(${property.id})" style="background: #6e44ff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; width: 100%;">
                            Подробнее
                        </button>
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
        if (propertiesCount) {
            propertiesCount.textContent = propertiesToShow.length;
        }
        
        // Clear existing properties
        if (propertyList) {
            propertyList.innerHTML = '';
        }
        
        // Add properties to the list
        propertiesToShow.forEach(property => {
            const propertyCard = createPropertyCard(property);
            if (propertyList) {
                propertyList.appendChild(propertyCard);
            }
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
            <img src="${property.image}" alt="${property.title}" onerror="this.src='https://via.placeholder.com/400x300?text=Фото+недвижимости'">
            <div class="property-type">${getPropertyTypeLabel(property.type)}</div>
            <div class="property-price">$${property.price}/мес</div>
        </div>
        <div class="property-content">
            <h3>${property.title}</h3>
            <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
            <p class="property-description">${property.description.substring(0, 100)}...</p>
            <div class="property-features">
                ${property.features ? property.features.slice(0, 3).map(feature => 
                    `<span class="feature-tag">${feature}</span>`
                ).join('') : ''}
                ${property.features && property.features.length > 3 ? 
                    `<span class="feature-tag">+${property.features.length - 3} еще</span>` : ''}
            </div>
            <div class="property-details">
                <span><i class="fas fa-door-open"></i> ${property.rooms || '-'} комн.</span>
                <span><i class="fas fa-vector-square"></i> ${property.area || '-'} м²</span>
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
        
        if (!modal || !detailsContainer) return;
        
        detailsContainer.innerHTML = `
            <div class="property-detail-header">
                <div class="property-detail-gallery">
                    <img src="${property.image}" alt="${property.title}" onerror="this.src='https://via.placeholder.com/600x400?text=Фото+недвижимости'">
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
                        <span>Комнат: ${property.rooms || '-'}</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-vector-square"></i>
                        <span>Площадь: ${property.area || '-'} м²</span>
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
                    <div class="contact-info">
                        <p><i class="fas fa-user"></i> ${property.contactName || 'Не указано'}</p>
                        <p><i class="fas fa-phone"></i> ${property.contactPhone || 'Не указано'}</p>
                    </div>
                    <div class="contact-buttons">
                        ${property.contactPhone ? `
                            <button class="btn btn-primary" onclick="callNumber('${property.contactPhone}')">
                                <i class="fas fa-phone"></i> Позвонить
                            </button>
                        ` : ''}
                        <button class="btn btn-outline" onclick="sendMessage(${property.id})">
                            <i class="fas fa-envelope"></i> Написать
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error showing property details:', error);
    }
}

// Call phone number
function callNumber(phoneNumber) {
    if (phoneNumber) {
        window.open(`tel:${phoneNumber}`, '_self');
    }
}

// Send message (simulated)
function sendMessage(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
        const message = `Здравствуйте! Интересует недвижимость: ${property.title} за $${property.price}/мес`;
        alert(`Сообщение отправлено:\n${message}\n\n(Это демонстрационная функция)`);
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
        const findPropertyBtn = document.getElementById('findPropertyBtn');
        const rentOutBtn = document.getElementById('rentOutBtn');
        
        if (findPropertyBtn) {
            findPropertyBtn.addEventListener('click', function() {
                showSection('mapSection');
            });
        }
        
        if (rentOutBtn) {
            rentOutBtn.addEventListener('click', function() {
                showSection('formSection');
            });
        }
        
        // Modal close
        const closeModalBtn = document.getElementById('closeModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                const modal = document.getElementById('propertyModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Map controls
        const toggleMapBtn = document.getElementById('toggleMapBtn');
        const resetMapBtn = document.getElementById('resetMapBtn');
        
        if (toggleMapBtn) {
            toggleMapBtn.addEventListener('click', function() {
                toggleMapVisibility();
            });
        }
        
        if (resetMapBtn) {
            resetMapBtn.addEventListener('click', function() {
                resetMapView();
            });
        }
        
        // Map selection modal
        const mapSelectionModal = document.getElementById('mapSelectionModal');
        const closeMapModal = document.getElementById('closeMapModal');
        const selectOnMapBtn = document.getElementById('selectOnMapBtn');
        const cancelMapSelection = document.getElementById('cancelMapSelection');
        const confirmLocation = document.getElementById('confirmLocation');
        
        if (selectOnMapBtn) {
            selectOnMapBtn.addEventListener('click', function() {
                if (!selectionMap) {
                    initSelectionMap();
                }
                mapSelectionModal.style.display = 'flex';
            });
        }
        
        if (closeMapModal) {
            closeMapModal.addEventListener('click', function() {
                mapSelectionModal.style.display = 'none';
            });
        }
        
        if (cancelMapSelection) {
            cancelMapSelection.addEventListener('click', function() {
                mapSelectionModal.style.display = 'none';
            });
        }
        
        if (confirmLocation) {
            confirmLocation.addEventListener('click', function() {
                if (selectedLocation) {
                    document.getElementById('selectedLocationText').textContent = 
                        `Выбрано: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
                    mapSelectionModal.style.display = 'none';
                } else {
                    alert('Пожалуйста, выберите местоположение на карте');
                }
            });
        }
        
        // Form navigation
        const nextToStep2 = document.getElementById('nextToStep2');
        const backToStep1 = document.getElementById('backToStep1');
        const nextToStep3 = document.getElementById('nextToStep3');
        const backToStep2 = document.getElementById('backToStep2');
        const nextToStep4 = document.getElementById('nextToStep4');
        const backToStep3 = document.getElementById('backToStep3');
        
        if (nextToStep2) nextToStep2.addEventListener('click', () => navigateToStep(2));
        if (backToStep1) backToStep1.addEventListener('click', () => navigateToStep(1));
        if (nextToStep3) nextToStep3.addEventListener('click', () => navigateToStep(3));
        if (backToStep2) backToStep2.addEventListener('click', () => navigateToStep(2));
        if (nextToStep4) nextToStep4.addEventListener('click', () => navigateToStep(4));
        if (backToStep3) backToStep3.addEventListener('click', () => navigateToStep(3));
        
        // Form submission
        const rentForm = document.getElementById('rentForm');
        if (rentForm) {
            rentForm.addEventListener('submit', function(e) {
                e.preventDefault();
                submitProperty();
            });
        }
        
        // Property type change
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.addEventListener('change', function() {
                selectedPropertyType = this.value;
                loadPropertyTypeForm(selectedPropertyType);
            });
        }
        
        // File upload preview
        const photosInput = document.getElementById('photos');
        if (photosInput) {
            photosInput.addEventListener('change', function(e) {
                handleFileUpload(e.target.files);
            });
        }
        
        // Price range slider
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        
        if (priceRange && priceValue) {
            priceRange.addEventListener('input', function() {
                priceValue.textContent = '$' + this.value;
            });
        }
        
        // View toggle
        const gridViewBtn = document.getElementById('gridView');
        const listViewBtn = document.getElementById('listView');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', function() {
                toggleView('grid');
            });
        }
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', function() {
                toggleView('list');
            });
        }
        
        // Apply filters
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                applyFilters();
            });
        }
        
        // Reset filters
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                resetFilters();
            });
        }
        
        console.log('Event listeners setup completed');
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Toggle map visibility
function toggleMapVisibility() {
    const mapContainer = document.getElementById('map');
    const toggleBtn = document.getElementById('toggleMapBtn');
    
    if (mapContainer.classList.contains('visible')) {
        mapContainer.classList.remove('visible');
        mapContainer.classList.add('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Показать карту';
    } else {
        mapContainer.classList.remove('hidden');
        mapContainer.classList.add('visible');
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Скрыть карту';
        
        // Update map size after showing
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);
    }
}

// Reset map view
function resetMapView() {
    if (map) {
        map.setView([41.3111, 69.2797], 12);
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
                if (map) map.invalidateSize();
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
        const photosInput = document.getElementById('photos');
        if (photosInput) {
            photosInput.files = dataTransfer.files;
        }
        
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
function submitProperty() {
    try {
        // Basic validation
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const price = document.getElementById('price').value;
        const contactName = document.getElementById('contactName').value;
        const contactPhone = document.getElementById('contactPhone').value;
        const locationInput = document.getElementById('locationInput').value;
        
        if (!title || !category || !description || !price || !contactName || !contactPhone || !locationInput) {
            alert('Пожалуйста, заполните все обязательные поля.');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('#rentForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
        submitBtn.disabled = true;
        
        // Prepare property data
        const propertyData = {
            id: Date.now(), // Use timestamp as ID
            title: title,
            type: category,
            description: description,
            price: parseInt(price),
            image: uploadedFiles.length > 0 ? URL.createObjectURL(uploadedFiles[0]) : 'https://via.placeholder.com/600x400?text=Нет+фото',
            status: 'active',
            createdAt: new Date(),
            location: locationInput,
            contactName: contactName,
            contactPhone: contactPhone,
            lat: selectedLocation ? selectedLocation.lat : (41.3111 + (Math.random() - 0.5) * 0.1),
            lng: selectedLocation ? selectedLocation.lng : (69.2797 + (Math.random() - 0.5) * 0.1)
        };
        
        // Add property-specific details
        if (category === 'apartment') {
            propertyData.rooms = parseInt(document.getElementById('rooms').value) || 1;
            propertyData.floor = parseInt(document.getElementById('floor').value) || 1;
            propertyData.totalFloors = parseInt(document.getElementById('totalFloors').value) || 1;
            propertyData.area = parseInt(document.getElementById('area').value) || 0;
            propertyData.bathrooms = parseInt(document.getElementById('bathrooms').value) || 1;
            propertyData.features = getSelectedAmenities();
        }
        
        // Add to properties array
        properties.unshift(propertyData);
        
        // Save to localStorage
        const userProperties = properties.filter(p => p.id > 1000); // Filter out sample properties
        localStorage.setItem('rentuz_properties', JSON.stringify(userProperties));
        
        alert('Объявление успешно размещено!');
        
        // Reset form
        document.getElementById('rentForm').reset();
        document.getElementById('filePreview').innerHTML = '';
        document.getElementById('selectedLocationText').textContent = 'Местоположение не выбрано';
        uploadedFiles = [];
        selectedLocation = null;
        navigateToStep(1);
        
        // Reload properties
        loadProperties();
        
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

// Get selected amenities
function getSelectedAmenities() {
    const amenities = [];
    const checkboxes = document.querySelectorAll('input[name="amenities"]:checked');
    checkboxes.forEach(checkbox => {
        amenities.push(checkbox.value);
    });
    return amenities;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('propertyModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
    
    const mapModal = document.getElementById('mapSelectionModal');
    if (event.target === mapModal) {
        mapModal.style.display = 'none';
    }
};

// Handle window resize for map
window.addEventListener('resize', function() {
    if (map && document.getElementById('mapSection').style.display === 'block') {
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);
    }
    
    if (selectionMap && document.getElementById('mapSelectionModal').style.display === 'flex') {
        setTimeout(() => {
            if (selectionMap) selectionMap.invalidateSize();
        }, 300);
    }
});

// Global functions for HTML onclick
window.showPropertyDetails = showPropertyDetails;
window.removeFile = removeFile;
window.callNumber = callNumber;
window.sendMessage = sendMessage;