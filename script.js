// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD_dZ3uPra32WQGDIZZ2vyFwCdNgWCBPEM",
    authDomain: "apprent-e0f19.firebaseapp.com",
    databaseURL: "https://apprent-e0f19-default-rtdb.firebaseio.com",
    projectId: "apprent-e0f19",
    storageBucket: "apprent-e0f19.firebasestorage.app",
    messagingSenderId: "840126144107",
    appId: "1:840126144107:web:3e55aa942a46fdeec8db2e",
    measurementId: "G-7WG51CLWKQ"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

const database = firebase.database();
const auth = firebase.auth();

// Telegram Web App instance
let tg = null;
try {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        console.log("Telegram Web App initialized");
    }
} catch (error) {
    console.log("Telegram Web App not available:", error);
}

// Current state
let currentUser = null;
let allEquipment = [];
let allRoutes = [];
let allUsers = [];
let currentStep = 1;
let userEquipment = [];
let editingEquipmentId = null;
let currentEquipmentDetails = null;
let selectedFeatures = [];
let uploadedImages = [];
let adminUsers = ['543221724'];
let currentAdminTab = 'equipment';
let currentOrderTab = 'active';
let revenueChart = null;

// Equipment categories with icons and details
const equipmentCategories = [
    { id: 'tonar', name: 'Тонары', icon: 'truck', color: 'blue' },
    { id: 'samosval', name: 'Самосвалы', icon: 'truck', color: 'orange' },
    { id: 'mixer', name: 'Автомиксеры', icon: 'mixer', color: 'purple' },
    { id: 'crane', name: 'Краны', icon: 'crane', color: 'red' },
    { id: 'excavator', name: 'Экскаваторы', icon: 'excavator', color: 'yellow' },
    { id: 'bulldozer', name: 'Бульдозеры', icon: 'tractor', color: 'green' },
    { id: 'loader', name: 'Погрузчики', icon: 'loader', color: 'pink' },
    { id: 'pump', name: 'Бетононасосы', icon: 'gauge', color: 'indigo' },
    { id: 'compressor', name: 'Компрессоры', icon: 'wind', color: 'teal' },
    { id: 'generator', name: 'Генераторы', icon: 'zap', color: 'amber' },
    { id: 'trailer', name: 'Прицепы', icon: 'trailer', color: 'gray' }
];

// Equipment specifications by category
const equipmentSpecs = {
    'tonar': {
        capacityUnit: 'тонн',
        fields: [
            { id: 'engine', label: 'Двигатель', type: 'text', placeholder: 'Модель двигателя' },
            { id: 'power', label: 'Мощность', type: 'number', suffix: 'л.с.' },
            { id: 'volume', label: 'Объем кузова', type: 'number', suffix: 'м³' },
            { id: 'length', label: 'Длина кузова', type: 'number', suffix: 'м' },
            { id: 'width', label: 'Ширина кузова', type: 'number', suffix: 'м' },
            { id: 'height', label: 'Высота кузова', type: 'number', suffix: 'м' },
            { id: 'axles', label: 'Количество осей', type: 'number' },
            { id: 'fuel', label: 'Тип топлива', type: 'select', options: ['Дизель', 'Бензин', 'Газ', 'Электричество'] },
            { id: 'transmission', label: 'Коробка передач', type: 'select', options: ['Механическая', 'Автоматическая', 'Роботизированная'] }
        ]
    },
    'samosval': {
        capacityUnit: 'тонн',
        fields: [
            { id: 'engine', label: 'Двигатель', type: 'text', placeholder: 'Модель двигателя' },
            { id: 'power', label: 'Мощность', type: 'number', suffix: 'л.с.' },
            { id: 'volume', label: 'Объем кузова', type: 'number', suffix: 'м³' },
            { id: 'body_type', label: 'Тип кузова', type: 'select', options: ['Самосвальный', 'С принудительной разгрузкой', 'Бортовой'] },
            { id: 'unloading_angle', label: 'Угол разгрузки', type: 'number', suffix: '°' },
            { id: 'axles', label: 'Количество осей', type: 'number' },
            { id: 'fuel', label: 'Тип топлива', type: 'select', options: ['Дизель', 'Бензин', 'Газ'] }
        ]
    },
    'mixer': {
        capacityUnit: 'м³',
        fields: [
            { id: 'mixer_volume', label: 'Объем миксера', type: 'number', suffix: 'м³' },
            { id: 'engine_power', label: 'Мощность двигателя', type: 'number', suffix: 'л.с.' },
            { id: 'drum_speed', label: 'Скорость вращения барабана', type: 'number', suffix: 'об/мин' },
            { id: 'unloading_time', label: 'Время разгрузки', type: 'number', suffix: 'мин' },
            { id: 'water_tank', label: 'Объем бака для воды', type: 'number', suffix: 'л' }
        ]
    },
    'crane': {
        capacityUnit: 'тонн',
        fields: [
            { id: 'lifting_capacity', label: 'Грузоподъемность', type: 'number', suffix: 'т' },
            { id: 'boom_length', label: 'Длина стрелы', type: 'number', suffix: 'м' },
            { id: 'max_height', label: 'Максимальная высота', type: 'number', suffix: 'м' },
            { id: 'engine_power', label: 'Мощность двигателя', type: 'number', suffix: 'л.с.' },
            { id: 'crane_type', label: 'Тип крана', type: 'select', options: ['Автокран', 'Гусеничный', 'Башенный', 'Портальный'] }
        ]
    },
    'excavator': {
        capacityUnit: 'м³',
        fields: [
            { id: 'bucket_capacity', label: 'Объем ковша', type: 'number', suffix: 'м³' },
            { id: 'engine_power', label: 'Мощность двигателя', type: 'number', suffix: 'л.с.' },
            { id: 'operating_weight', label: 'Эксплуатационная масса', type: 'number', suffix: 'т' },
            { id: 'max_depth', label: 'Максимальная глубина копания', type: 'number', suffix: 'м' },
            { id: 'max_reach', label: 'Максимальный вылет', type: 'number', suffix: 'м' },
            { id: 'excavator_type', label: 'Тип экскаватора', type: 'select', options: ['Гусеничный', 'Колесный', 'Мини'] }
        ]
    },
    'pump': {
        capacityUnit: 'м³/час',
        fields: [
            { id: 'output', label: 'Производительность', type: 'number', suffix: 'м³/час' },
            { id: 'pressure', label: 'Давление', type: 'number', suffix: 'бар' },
            { id: 'max_height', label: 'Максимальная высота подачи', type: 'number', suffix: 'м' },
            { id: 'max_distance', label: 'Максимальная дальность подачи', type: 'number', suffix: 'м' },
            { id: 'engine_power', label: 'Мощность двигателя', type: 'number', suffix: 'л.с.' },
            { id: 'pipe_diameter', label: 'Диаметр трубопровода', type: 'number', suffix: 'мм' }
        ]
    }
};

// Initialize the application
async function init() {
    try {
        console.log('🚀 Initializing BuildRent application...');
        
        // Initialize icons safely
        setTimeout(() => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }, 100);
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize categories
        initCategories();
        
        // Check authentication
        await checkAuth();
        
        // Set default date
        setDefaultDate();
        
        // Load initial data
        loadAllData();
        
        // Hide loading screen after 1 second
        setTimeout(() => {
            hideLoadingScreen();
            console.log('✅ BuildRent initialized successfully');
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Ошибка загрузки приложения', 'error');
        
        // Still show main content
        setTimeout(() => {
            hideLoadingScreen();
        }, 1500);
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Search input
    const searchInput = document.getElementById('main-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const term = e.target.value.trim();
            if (term.length >= 2) {
                performSearch(term);
            } else if (term.length === 0) {
                clearSearchResults();
            }
        }, 300));
    }
    
    // Clear search
    window.clearSearch = function() {
        const searchInput = document.getElementById('main-search');
        const clearBtn = document.querySelector('.clear-search');
        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.classList.add('hidden');
        clearSearchResults();
    };
    
    // Photo upload
    const photoUpload = document.getElementById('photo-upload');
    const uploadArea = document.getElementById('upload-area');
    
    if (photoUpload && uploadArea) {
        uploadArea.addEventListener('click', () => photoUpload.click());
        photoUpload.addEventListener('change', (e) => handleImageUpload(e.target.files));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
            uploadArea.style.background = 'rgba(59, 130, 246, 0.05)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border)';
            uploadArea.style.background = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border)';
            uploadArea.style.background = '';
            handleImageUpload(e.dataTransfer.files);
        });
    }
    
    // Feature input
    const featureInput = document.getElementById('feature-input');
    if (featureInput) {
        featureInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addFeature();
            }
        });
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize categories
function initCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Add "All" category
    const allCategory = document.createElement('div');
    allCategory.className = 'category-pill active';
    allCategory.innerHTML = `
        <i data-lucide="grid"></i>
        <span>Все</span>
    `;
    allCategory.onclick = () => filterEquipmentByCategory('all');
    container.appendChild(allCategory);
    
    // Add equipment categories
    equipmentCategories.forEach(category => {
        const pill = document.createElement('div');
        pill.className = 'category-pill';
        pill.dataset.category = category.id;
        pill.innerHTML = `
            <i data-lucide="${category.icon}"></i>
            <span>${category.name}</span>
        `;
        pill.onclick = () => filterEquipmentByCategory(category.id);
        container.appendChild(pill);
    });
}

// Check authentication
async function checkAuth() {
    try {
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            await loadUserFromTelegram();
        } else {
            await createFallbackUser();
        }
        
        updateUIForAuthenticatedUser();
        
    } catch (error) {
        console.error('Auth error:', error);
        await createFallbackUser();
        updateUIForAuthenticatedUser();
    }
}

// Create fallback user
async function createFallbackUser() {
    currentUser = {
        uid: 'fallback_' + Date.now(),
        firstName: 'Иван',
        lastName: 'Петров',
        username: 'ivanpetrov',
        phone: '+998 90 123 45 67',
        photoUrl: '',
        isPremium: false,
        role: 'user',
        telegramId: '543221724'
    };
    
    // Check if user is admin
    if (adminUsers.includes(currentUser.telegramId) || adminUsers.includes(currentUser.uid)) {
        currentUser.role = 'admin';
    }
    
    console.log('Fallback user created:', currentUser);
    return currentUser;
}

// Load user from Telegram
async function loadUserFromTelegram() {
    try {
        const initData = tg.initDataUnsafe;
        if (initData && initData.user) {
            const tgUser = initData.user;
            currentUser = {
                uid: tgUser.id.toString(),
                firstName: tgUser.first_name,
                lastName: tgUser.last_name || '',
                username: tgUser.username || '',
                photoUrl: tgUser.photo_url || '',
                phone: '',
                isPremium: tgUser.is_premium || false,
                role: 'user',
                telegramId: tgUser.id.toString()
            };
            
            // Check if user is admin
            if (adminUsers.includes(currentUser.telegramId)) {
                currentUser.role = 'admin';
                console.log('Admin user detected');
            }
            
            console.log('Telegram user loaded:', currentUser);
        }
    } catch (error) {
        console.error('Error loading Telegram user:', error);
        await createFallbackUser();
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    if (!currentUser) return;
    
    const profileName = document.getElementById('profile-name');
    const userGreeting = document.getElementById('user-greeting-text');
    
    const displayName = `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`;
    const greeting = getTimeBasedGreeting();
    
    if (profileName) profileName.textContent = displayName;
    if (userGreeting) userGreeting.textContent = `${greeting}, ${currentUser.firstName}`;
    
    // Show admin menu if user is admin
    const adminMenuItem = document.getElementById('admin-menu-item');
    if (adminMenuItem && currentUser.role === 'admin') {
        adminMenuItem.style.display = 'flex';
        console.log('Admin menu item shown');
    }
}

// Get time-based greeting
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
}

// Set default date
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const routeDate = document.getElementById('route-date');
    if (routeDate) {
        routeDate.value = today;
        routeDate.min = today;
    }
    
    const rentalDate = document.getElementById('rental-start-date');
    if (rentalDate) {
        rentalDate.value = today;
        rentalDate.min = today;
    }
}

// Load all data
function loadAllData() {
    loadEquipmentData();
    loadRoutesData();
    loadUsersData();
    loadStats();
}

// Load equipment data
function loadEquipmentData() {
    try {
        const equipmentRef = database.ref('equipment');
        
        equipmentRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const equipmentData = snapshot.val();
                allEquipment = Object.entries(equipmentData || {}).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                
                console.log(`Loaded ${allEquipment.length} equipment items`);
                
                // Update UI
                updateEquipmentUI();
                updateStats();
                
            } else {
                allEquipment = [];
                console.log('No equipment data found');
            }
        });
        
    } catch (error) {
        console.error('Error loading equipment:', error);
        allEquipment = [];
    }
}

// Load routes data
function loadRoutesData() {
    try {
        const routesRef = database.ref('routes');
        
        routesRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const routesData = snapshot.val();
                allRoutes = Object.entries(routesData || {}).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                
                console.log(`Loaded ${allRoutes.length} routes`);
                updateStats();
                
            } else {
                allRoutes = [];
            }
        });
        
    } catch (error) {
        console.error('Error loading routes:', error);
        allRoutes = [];
    }
}

// Load users data
function loadUsersData() {
    try {
        const usersRef = database.ref('users');
        
        usersRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                allUsers = Object.entries(usersData || {}).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                
                console.log(`Loaded ${allUsers.length} users`);
                updateStats();
                
            } else {
                allUsers = [];
            }
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        allUsers = [];
    }
}

// Update equipment UI
function updateEquipmentUI() {
    if (document.getElementById('home-page').classList.contains('active')) {
        loadFeaturedEquipment();
        loadFeaturedRoutes();
    }
    
    if (document.getElementById('my-equipment-page').classList.contains('active')) {
        loadUserEquipment();
    }
    
    if (document.getElementById('admin-page').classList.contains('active')) {
        loadAdminEquipment();
    }
}

// Load featured equipment
function loadFeaturedEquipment() {
    const featuredGrid = document.getElementById('featured-equipment');
    if (!featuredGrid) return;
    
    // Get approved and available equipment
    const featured = allEquipment
        .filter(item => item.status === 'approved' && item.available)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 6);
    
    if (featured.length === 0) {
        featuredGrid.innerHTML = `
            <div class="no-results">
                <i data-lucide="construction"></i>
                <p>Популярной техники пока нет</p>
                <button class="btn-secondary" onclick="navigateTo('add-equipment-page')">
                    <i data-lucide="plus"></i>
                    <span>Добавить технику</span>
                </button>
            </div>
        `;
        return;
    }
    
    featuredGrid.innerHTML = '';
    featured.forEach(equipment => {
        const card = createEquipmentCard(equipment);
        featuredGrid.appendChild(card);
    });
    
    if (lucide) lucide.createIcons();
}

// Load featured routes
function loadFeaturedRoutes() {
    const routesGrid = document.getElementById('featured-routes');
    if (!routesGrid) return;
    
    const featuredRoutes = allRoutes
        .filter(route => route.status === 'active')
        .slice(0, 4);
    
    if (featuredRoutes.length === 0) {
        routesGrid.innerHTML = '';
        return;
    }
    
    routesGrid.innerHTML = '';
    featuredRoutes.forEach(route => {
        const card = createRouteCard(route);
        routesGrid.appendChild(card);
    });
    
    if (lucide) lucide.createIcons();
}

// Create equipment card
function createEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = 'equipment-card';
    
    const category = equipmentCategories.find(c => c.id === equipment.category) || equipmentCategories[0];
    const price = formatPriceForCard(equipment);
    
    div.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${category.icon}"></i>
            ${equipment.featured ? '<div class="equipment-badge">TOP</div>' : ''}
        </div>
        <div class="equipment-content">
            <h3 class="equipment-title">${equipment.name || 'Без названия'}</h3>
            <p class="equipment-specs">${category.name} • ${formatCapacity(equipment)} • ${equipment.location || 'Не указано'}</p>
            <div class="equipment-footer">
                <div class="equipment-price">${price}</div>
                <div class="equipment-rating">
                    <i data-lucide="star"></i>
                    <span>${equipment.owner?.rating || '5.0'}</span>
                </div>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        showEquipmentDetails(equipment);
    });
    
    return div;
}

// Create route card
function createRouteCard(route) {
    const div = document.createElement('div');
    div.className = 'route-card';
    
    div.innerHTML = `
        <div class="route-icon">
            <i data-lucide="route"></i>
        </div>
        <div class="route-content">
            <h3>${route.from} → ${route.to}</h3>
            <p class="route-cargo">${route.cargo || 'Груз не указан'}</p>
            <div class="route-footer">
                <span class="route-distance">${route.distance || '?'} км</span>
                <span class="route-price">${formatPrice(route.price)}</span>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        showRouteDetails(route);
    });
    
    return div;
}

// Filter equipment by category
function filterEquipmentByCategory(categoryId) {
    // Update active category
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.classList.remove('active');
    });
    
    const activePill = document.querySelector(`.category-pill[data-category="${categoryId}"]`) || 
                      document.querySelector('.category-pill:first-child');
    if (activePill) activePill.classList.add('active');
    
    const featuredGrid = document.getElementById('featured-equipment');
    if (!featuredGrid) return;
    
    let filtered = [];
    
    if (categoryId === 'all') {
        filtered = allEquipment
            .filter(item => item.status === 'approved' && item.available)
            .slice(0, 6);
    } else {
        filtered = allEquipment
            .filter(item => 
                item.status === 'approved' && 
                item.available && 
                item.category === categoryId
            )
            .slice(0, 6);
    }
    
    if (filtered.length === 0) {
        featuredGrid.innerHTML = `
            <div class="no-results">
                <i data-lucide="construction"></i>
                <p>Техника не найдена</p>
                <button class="btn-secondary" onclick="navigateTo('add-equipment-page')">
                    <i data-lucide="plus"></i>
                    <span>Добавить технику</span>
                </button>
            </div>
        `;
        return;
    }
    
    featuredGrid.innerHTML = '';
    filtered.forEach(equipment => {
        const card = createEquipmentCard(equipment);
        featuredGrid.appendChild(card);
    });
    
    if (lucide) lucide.createIcons();
}

// Show all equipment
function showAllEquipment() {
    navigateTo('search-page');
}

// Show all routes
function showAllRoutes() {
    // Implement route listing page
    showNotification('Страница маршрутов в разработке', 'info');
}

// Update equipment fields based on category
function updateEquipmentFields() {
    const category = document.getElementById('equipment-category').value;
    const capacityUnit = document.getElementById('capacity-unit');
    const technicalFields = document.getElementById('technical-fields');
    const pricingFields = document.getElementById('pricing-fields');
    
    if (!category) return;
    
    // Update capacity unit
    const specs = equipmentSpecs[category];
    if (specs && capacityUnit) {
        capacityUnit.textContent = specs.capacityUnit || 'тонн';
    }
    
    // Update technical fields
    if (technicalFields) {
        if (specs && specs.fields) {
            let fieldsHTML = '';
            specs.fields.forEach(field => {
                if (field.type === 'select') {
                    fieldsHTML += `
                        <div class="form-group">
                            <label class="form-label">${field.label}</label>
                            <select id="spec-${field.id}" class="modern-select">
                                <option value="">Выберите...</option>
                                ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                            </select>
                        </div>
                    `;
                } else {
                    fieldsHTML += `
                        <div class="form-group">
                            <label class="form-label">${field.label}</label>
                            <div class="input-with-suffix">
                                <input type="${field.type}" id="spec-${field.id}" 
                                       placeholder="${field.placeholder || field.label}" 
                                       class="modern-input">
                                ${field.suffix ? `<span class="input-suffix">${field.suffix}</span>` : ''}
                            </div>
                        </div>
                    `;
                }
            });
            technicalFields.innerHTML = fieldsHTML;
        } else {
            technicalFields.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Мощность двигателя</label>
                    <div class="input-with-suffix">
                        <input type="number" id="spec-power" placeholder="Мощность" class="modern-input">
                        <span class="input-suffix">л.с.</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Тип топлива</label>
                    <select id="spec-fuel" class="modern-select">
                        <option value="">Выберите...</option>
                        <option value="diesel">Дизель</option>
                        <option value="petrol">Бензин</option>
                        <option value="gas">Газ</option>
                        <option value="electric">Электричество</option>
                    </select>
                </div>
            `;
        }
    }
    
    // Update pricing fields
    if (pricingFields) {
        let pricingHTML = '';
        
        switch(category) {
            case 'mixer':
                pricingHTML = `
                    <div class="price-input">
                        <label>Цена за 1 м³ (до 20 км)</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">сум</span>
                            <input type="number" id="price-per-unit" placeholder="70000" class="modern-input" min="1000">
                        </div>
                    </div>
                    <div class="price-input">
                        <label>Цена за 1 км сверх 20 км</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">сум</span>
                            <input type="number" id="price-per-km" placeholder="1000" class="modern-input" min="100">
                        </div>
                    </div>
                `;
                break;
                
            case 'pump':
                pricingHTML = `
                    <div class="price-input">
                        <label>Цена за час работы</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">сум</span>
                            <input type="number" id="price-per-hour" placeholder="50000" class="modern-input" min="1000">
                        </div>
                    </div>
                    <div class="price-input">
                        <label>Мин. часов аренды</label>
                        <div class="input-with-suffix">
                            <input type="number" id="min-hours" placeholder="4" class="modern-input" min="1">
                            <span class="input-suffix">часов</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'tonar':
            case 'samosval':
                pricingHTML = `
                    <div class="price-input">
                        <label>Цена за 1 м³/тонну</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">сум</span>
                            <input type="number" id="price-per-unit" placeholder="15000" class="modern-input" min="1000">
                        </div>
                    </div>
                    <div class="price-input">
                        <label>Цена за 1 км</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">сум</span>
                            <input type="number" id="price-per-km" placeholder="500" class="modern-input" min="100">
                        </div>
                    </div>
                `;
                break;
                
            default:
                pricingHTML = `
                    <div class="price-input">
                        <label>Цена за час работы</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">сум</span>
                            <input type="number" id="price-per-hour" placeholder="30000" class="modern-input" min="1000">
                        </div>
                    </div>
                    <div class="price-input">
                        <label>Цена за смену (8ч)</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">сум</span>
                            <input type="number" id="price-per-shift" placeholder="200000" class="modern-input" min="5000">
                        </div>
                    </div>
                `;
        }
        
        pricingFields.innerHTML = pricingHTML;
    }
}

// Handle image upload
function handleImageUpload(files) {
    if (!files || files.length === 0) return;
    
    const uploadArea = document.getElementById('upload-area');
    const preview = document.getElementById('upload-preview');
    
    if (!uploadArea || !preview) return;
    
    // Reset arrays
    uploadedImages = [];
    
    // Update upload area
    uploadArea.innerHTML = `
        <i data-lucide="check-circle"></i>
        <p>Загружено ${files.length} фото</p>
    `;
    
    // Create preview
    preview.innerHTML = '';
    preview.style.display = 'grid';
    preview.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    preview.style.gap = '8px';
    preview.style.marginTop = '10px';
    
    for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showNotification(`Файл ${file.name} слишком большой (макс. 5MB)`, 'error');
            continue;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '100%';
            img.style.height = '80px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = 'var(--border-radius-sm)';
            preview.appendChild(img);
            
            // Store image data
            uploadedImages.push({
                name: file.name,
                data: e.target.result,
                type: file.type
            });
        };
        
        reader.readAsDataURL(file);
    }
    
    if (lucide) lucide.createIcons();
}

// Add feature
function addFeature() {
    const featureInput = document.getElementById('feature-input');
    const preview = document.getElementById('features-preview');
    
    if (!featureInput || !preview) return;
    
    const feature = featureInput.value.trim();
    if (!feature) return;
    
    if (!selectedFeatures.includes(feature)) {
        selectedFeatures.push(feature);
        
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `
            ${feature}
            <i data-lucide="x" onclick="removeFeature('${feature}')"></i>
        `;
        preview.appendChild(tag);
        
        featureInput.value = '';
    }
    
    if (lucide) lucide.createIcons();
}

// Remove feature
function removeFeature(feature) {
    selectedFeatures = selectedFeatures.filter(f => f !== feature);
    updateFeaturesPreview();
}

// Update features preview
function updateFeaturesPreview() {
    const preview = document.getElementById('features-preview');
    if (!preview) return;
    
    preview.innerHTML = '';
    selectedFeatures.forEach(feature => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `
            ${feature}
            <i data-lucide="x" onclick="removeFeature('${feature}')"></i>
        `;
        preview.appendChild(tag);
    });
    
    if (lucide) lucide.createIcons();
}

// Add document
function addDocument(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            showNotification(`Документ "${type}" добавлен`, 'success');
        }
    };
    input.click();
}

// Form validation and navigation
function validateStep1() {
    const category = document.getElementById('equipment-category').value;
    const model = document.getElementById('equipment-model').value.trim();
    const brand = document.getElementById('equipment-brand').value.trim();
    const capacity = document.getElementById('equipment-capacity').value;
    const year = document.getElementById('equipment-year').value;
    
    if (!category) {
        showNotification('Выберите тип техники', 'error');
        return;
    }
    
    if (!model) {
        showNotification('Введите название модели', 'error');
        return;
    }
    
    if (!brand) {
        showNotification('Введите марку техники', 'error');
        return;
    }
    
    if (!capacity || capacity <= 0) {
        showNotification('Введите корректную грузоподъемность', 'error');
        return;
    }
    
    if (!year || year < 1990 || year > 2025) {
        showNotification('Введите корректный год выпуска', 'error');
        return;
    }
    
    nextStep(2);
}

function validateStep2() {
    const condition = document.getElementById('equipment-condition').value;
    
    if (!condition) {
        showNotification('Выберите состояние техники', 'error');
        return;
    }
    
    nextStep(3);
}

function validateStep3() {
    const location = document.getElementById('equipment-location').value.trim();
    const pricePerUnit = document.getElementById('price-per-unit')?.value;
    const pricePerHour = document.getElementById('price-per-hour')?.value;
    
    if (!location) {
        showNotification('Введите местоположение', 'error');
        return;
    }
    
    const category = document.getElementById('equipment-category').value;
    if (category === 'mixer' || category === 'tonar' || category === 'samosval') {
        if (!pricePerUnit || pricePerUnit <= 0) {
            showNotification('Введите корректную цену', 'error');
            return;
        }
    } else {
        if (!pricePerHour || pricePerHour <= 0) {
            showNotification('Введите корректную цену за час', 'error');
            return;
        }
    }
    
    nextStep(4);
}

function nextStep(stepNumber) {
    const currentStepEl = document.querySelector(`#step-${currentStep}`);
    const nextStepEl = document.querySelector(`#step-${stepNumber}`);
    
    if (currentStepEl) currentStepEl.classList.remove('active');
    if (nextStepEl) {
        nextStepEl.classList.add('active');
        currentStep = stepNumber;
        
        // Scroll to top of form
        nextStepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function prevStep() {
    if (currentStep > 1) {
        const currentStepEl = document.querySelector(`#step-${currentStep}`);
        const prevStepEl = document.querySelector(`#step-${currentStep - 1}`);
        
        if (currentStepEl) currentStepEl.classList.remove('active');
        if (prevStepEl) {
            prevStepEl.classList.add('active');
            currentStep--;
        }
    } else {
        goBack();
    }
}

// Save equipment
async function saveEquipment() {
    if (!currentUser) {
        showNotification('Ошибка авторизации', 'error');
        return;
    }
    
    // Get form values
    const category = document.getElementById('equipment-category').value;
    const model = document.getElementById('equipment-model').value.trim();
    const brand = document.getElementById('equipment-brand').value.trim();
    const capacity = document.getElementById('equipment-capacity').value;
    const year = document.getElementById('equipment-year').value;
    const location = document.getElementById('equipment-location').value.trim();
    const phone = document.getElementById('owner-phone').value.trim();
    const email = document.getElementById('owner-email').value.trim();
    const telegram = document.getElementById('owner-telegram').value.trim();
    const description = document.getElementById('equipment-description').value.trim();
    const condition = document.getElementById('equipment-condition').value;
    const hours = document.getElementById('equipment-hours').value;
    const minRental = document.getElementById('min-rental').value;
    
    // Payment methods
    const paymentCash = document.getElementById('payment-cash')?.checked;
    const paymentCard = document.getElementById('payment-card')?.checked;
    const paymentTransfer = document.getElementById('payment-transfer')?.checked;
    
    // Validation
    if (!category || !model || !brand || !capacity || !location || !phone) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    if (uploadedImages.length === 0) {
        showNotification('Добавьте хотя бы одно фото техники', 'error');
        return;
    }
    
    // Phone validation
    const phoneRegex = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Введите корректный номер телефона в формате: +998 90 123 45 67', 'error');
        return;
    }
    
    // Get pricing
    let pricing = {};
    const categoryValue = document.getElementById('equipment-category').value;
    
    switch(categoryValue) {
        case 'mixer':
            pricing = {
                pricePerUnit: parseInt(document.getElementById('price-per-unit').value) || 70000,
                pricePerKm: parseInt(document.getElementById('price-per-km').value) || 1000,
                baseDistance: 20,
                unit: 'м³'
            };
            break;
            
        case 'pump':
            pricing = {
                pricePerHour: parseInt(document.getElementById('price-per-hour').value) || 50000,
                minHours: parseInt(document.getElementById('min-hours').value) || 4,
                unit: 'час'
            };
            break;
            
        case 'tonar':
        case 'samosval':
            pricing = {
                pricePerUnit: parseInt(document.getElementById('price-per-unit').value) || 15000,
                pricePerKm: parseInt(document.getElementById('price-per-km').value) || 500,
                unit: 'м³/т'
            };
            break;
            
        default:
            pricing = {
                pricePerHour: parseInt(document.getElementById('price-per-hour').value) || 30000,
                pricePerShift: parseInt(document.getElementById('price-per-shift').value) || 200000,
                unit: 'час'
            };
    }
    
    // Get technical specifications
    const specifications = {};
    const specsConfig = equipmentSpecs[category];
    if (specsConfig && specsConfig.fields) {
        specsConfig.fields.forEach(field => {
            const value = document.getElementById(`spec-${field.id}`)?.value;
            if (value) specifications[field.id] = value;
        });
    }
    
    try {
        // Create equipment object
        const equipmentData = {
            category: category,
            name: model,
            brand: brand,
            capacity: parseInt(capacity),
            year: parseInt(year),
            location: location,
            coordinates: {
                lat: document.getElementById('equipment-lat').value || null,
                lng: document.getElementById('equipment-lng').value || null
            },
            pricing: pricing,
            specifications: specifications,
            condition: condition,
            operatingHours: hours ? parseInt(hours) : null,
            minRental: minRental,
            paymentMethods: {
                cash: paymentCash,
                card: paymentCard,
                transfer: paymentTransfer
            },
            ownerId: currentUser.uid,
            owner: {
                name: `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`,
                phone: phone,
                email: email || null,
                telegram: telegram || null,
                rating: 5.0,
                reviews: 0
            },
            description: description || 'Описание отсутствует',
            features: selectedFeatures,
            images: uploadedImages,
            available: true,
            status: 'pending',
            views: 0,
            favorites: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        console.log('Saving equipment:', equipmentData);
        
        let equipmentRef;
        
        if (editingEquipmentId) {
            // Update existing equipment
            equipmentRef = database.ref(`equipment/${editingEquipmentId}`);
            await equipmentRef.update(equipmentData);
            showNotification('✅ Техника обновлена', 'success');
            editingEquipmentId = null;
        } else {
            // Create new equipment
            equipmentRef = database.ref('equipment').push();
            equipmentData.id = equipmentRef.key;
            await equipmentRef.set(equipmentData);
            showNotification('✅ Техника отправлена на модерацию', 'success');
        }
        
        // Reset and navigate
        setTimeout(() => {
            resetForm();
            navigateTo('my-equipment-page');
        }, 1500);
        
    } catch (error) {
        console.error('Error saving equipment:', error);
        showNotification('❌ Ошибка при сохранении: ' + error.message, 'error');
    }
}

// Load user equipment
async function loadUserEquipment() {
    if (!currentUser) return;
    
    try {
        const equipmentRef = database.ref('equipment');
        
        equipmentRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const equipmentData = snapshot.val();
                userEquipment = Object.entries(equipmentData || {})
                    .map(([key, value]) => ({
                        id: key,
                        ...value
                    }))
                    .filter(item => item.ownerId === currentUser.uid);
                
                console.log(`Loaded ${userEquipment.length} user equipment items`);
                updateUserEquipmentStats();
                displayUserEquipment();
                
            } else {
                userEquipment = [];
                updateUserEquipmentStats();
                displayUserEquipment();
            }
        });
        
    } catch (error) {
        console.error('Error loading user equipment:', error);
        userEquipment = [];
    }
}

function updateUserEquipmentStats() {
    const totalCount = userEquipment.length;
    const activeCount = userEquipment.filter(item => item.status === 'approved' && item.available).length;
    const pendingCount = userEquipment.filter(item => item.status === 'pending').length;
    const rejectedCount = userEquipment.filter(item => item.status === 'rejected').length;
    
    document.getElementById('my-equipment-count').textContent = totalCount;
    document.getElementById('my-active-count').textContent = activeCount;
    document.getElementById('my-pending-count').textContent = pendingCount;
    document.getElementById('my-rejected-count').textContent = rejectedCount;
}

function displayUserEquipment() {
    const container = document.getElementById('user-equipment-container');
    if (!container) return;
    
    if (userEquipment.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i data-lucide="truck"></i>
                <p>У вас нет добавленной техники</p>
                <button class="btn-primary gradient-btn" onclick="navigateTo('add-equipment-page')">
                    <i data-lucide="plus"></i>
                    <span>Добавить технику</span>
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    userEquipment.forEach(equipment => {
        const card = createUserEquipmentCard(equipment);
        container.appendChild(card);
    });
    
    if (lucide) lucide.createIcons();
}

function createUserEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = 'equipment-card';
    
    const category = equipmentCategories.find(c => c.id === equipment.category) || equipmentCategories[0];
    const price = formatPriceForCard(equipment);
    const statusBadge = getStatusBadge(equipment.status);
    
    div.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${category.icon}"></i>
            ${statusBadge}
        </div>
        <div class="equipment-content">
            <h3 class="equipment-title">${equipment.name || 'Без названия'}</h3>
            <p class="equipment-specs">${category.name} • ${equipment.location || 'Не указано'}</p>
            <div class="equipment-footer">
                <div class="equipment-price">${price}</div>
                <div class="equipment-actions">
                    <button class="btn-small" onclick="event.stopPropagation(); editEquipment('${equipment.id}')">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="btn-small btn-danger" onclick="event.stopPropagation(); deleteEquipment('${equipment.id}')">
                        <i data-lucide="trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        showEquipmentDetails(equipment);
    });
    
    return div;
}

// Filter my equipment
function filterMyEquipment() {
    const filterValue = document.getElementById('my-equipment-filter').value;
    const container = document.getElementById('user-equipment-container');
    
    if (!container) return;
    
    let filtered = [...userEquipment];
    
    switch(filterValue) {
        case 'active':
            filtered = filtered.filter(item => item.status === 'approved' && item.available);
            break;
        case 'pending':
            filtered = filtered.filter(item => item.status === 'pending');
            break;
        case 'rejected':
            filtered = filtered.filter(item => item.status === 'rejected');
            break;
        case 'available':
            filtered = filtered.filter(item => item.available);
            break;
        case 'unavailable':
            filtered = filtered.filter(item => !item.available);
            break;
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i data-lucide="search"></i>
                <p>Техника не найдена</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(equipment => {
        const card = createUserEquipmentCard(equipment);
        container.appendChild(card);
    });
    
    if (lucide) lucide.createIcons();
}

// Edit equipment
function editEquipment(equipmentId) {
    const equipment = userEquipment.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    editingEquipmentId = equipmentId;
    
    // Update form title
    document.getElementById('add-equipment-title').textContent = 'Редактирование техники';
    document.getElementById('save-button-text').textContent = 'Обновить технику';
    
    // Fill form step 1
    document.getElementById('equipment-category').value = equipment.category;
    document.getElementById('equipment-model').value = equipment.name;
    document.getElementById('equipment-brand').value = equipment.brand || '';
    document.getElementById('equipment-capacity').value = equipment.capacity;
    document.getElementById('equipment-year').value = equipment.year || '';
    
    // Update fields based on category
    updateEquipmentFields();
    
    // Fill form step 2 (after fields are updated)
    setTimeout(() => {
        document.getElementById('equipment-condition').value = equipment.condition || 'good';
        document.getElementById('equipment-hours').value = equipment.operatingHours || '';
        
        // Fill specifications
        if (equipment.specifications) {
            Object.entries(equipment.specifications).forEach(([key, value]) => {
                const field = document.getElementById(`spec-${key}`);
                if (field) field.value = value;
            });
        }
        
        // Fill form step 3
        document.getElementById('equipment-location').value = equipment.location;
        document.getElementById('equipment-lat').value = equipment.coordinates?.lat || '';
        document.getElementById('equipment-lng').value = equipment.coordinates?.lng || '';
        document.getElementById('min-rental').value = equipment.minRental || '8';
        
        // Payment methods
        if (equipment.paymentMethods) {
            document.getElementById('payment-cash').checked = equipment.paymentMethods.cash || false;
            document.getElementById('payment-card').checked = equipment.paymentMethods.card || false;
            document.getElementById('payment-transfer').checked = equipment.paymentMethods.transfer || false;
        }
        
        // Pricing
        if (equipment.pricing) {
            if (equipment.category === 'mixer') {
                document.getElementById('price-per-unit').value = equipment.pricing.pricePerUnit || '';
                document.getElementById('price-per-km').value = equipment.pricing.pricePerKm || '';
            } else if (equipment.category === 'pump') {
                document.getElementById('price-per-hour').value = equipment.pricing.pricePerHour || '';
                document.getElementById('min-hours').value = equipment.pricing.minHours || '';
            } else if (equipment.category === 'tonar' || equipment.category === 'samosval') {
                document.getElementById('price-per-unit').value = equipment.pricing.pricePerUnit || '';
                document.getElementById('price-per-km').value = equipment.pricing.pricePerKm || '';
            } else {
                document.getElementById('price-per-hour').value = equipment.pricing.pricePerHour || '';
                document.getElementById('price-per-shift').value = equipment.pricing.pricePerShift || '';
            }
        }
        
        // Fill form step 4
        document.getElementById('owner-phone').value = equipment.owner?.phone || '';
        document.getElementById('owner-email').value = equipment.owner?.email || '';
        document.getElementById('owner-telegram').value = equipment.owner?.telegram || '';
        document.getElementById('equipment-description').value = equipment.description || '';
        
        // Features
        selectedFeatures = equipment.features || [];
        updateFeaturesPreview();
        
        // Images
        if (equipment.images) {
            uploadedImages = equipment.images;
            updateImagePreview();
        }
        
    }, 500);
    
    navigateTo('add-equipment-page');
    showNotification('Редактирование техники', 'info');
}

// Update image preview
function updateImagePreview() {
    const preview = document.getElementById('upload-preview');
    if (!preview) return;
    
    preview.innerHTML = '';
    preview.style.display = 'grid';
    preview.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    preview.style.gap = '8px';
    preview.style.marginTop = '10px';
    
    uploadedImages.forEach((img, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = img.data;
        imgElement.style.width = '100%';
        imgElement.style.height = '80px';
        imgElement.style.objectFit = 'cover';
        imgElement.style.borderRadius = 'var(--border-radius-sm)';
        preview.appendChild(imgElement);
    });
    
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i data-lucide="check-circle"></i>
            <p>Загружено ${uploadedImages.length} фото</p>
        `;
    }
}

// Delete equipment
async function deleteEquipment(equipmentId) {
    if (!confirm('Вы уверены, что хотите удалить технику? Это действие нельзя отменить.')) return;
    
    try {
        await database.ref(`equipment/${equipmentId}`).remove();
        showNotification('✅ Техника удалена', 'success');
        loadUserEquipment();
    } catch (error) {
        console.error('Error deleting equipment:', error);
        showNotification('❌ Ошибка при удалении', 'error');
    }
}

function resetForm() {
    editingEquipmentId = null;
    currentStep = 1;
    selectedFeatures = [];
    uploadedImages = [];
    
    // Reset form title
    document.getElementById('add-equipment-title').textContent = 'Новая техника';
    document.getElementById('save-button-text').textContent = 'Опубликовать технику';
    
    // Show step 1
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step-1').classList.add('active');
    
    // Reset all form fields
    const form = document.querySelector('.form-container');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type === 'select') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });
    }
    
    // Set default values
    document.getElementById('equipment-condition').value = 'good';
    document.getElementById('min-rental').value = '8';
    document.getElementById('payment-cash').checked = true;
    document.getElementById('payment-card').checked = true;
    
    // Reset upload area
    const uploadArea = document.getElementById('upload-area');
    const preview = document.getElementById('upload-preview');
    const featuresPreview = document.getElementById('features-preview');
    
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i data-lucide="upload"></i>
            <p>Перетащите фото или нажмите для загрузки</p>
            <p class="upload-hint">Рекомендуется 3-5 фото (макс. 5MB каждое)</p>
        `;
    }
    
    if (preview) {
        preview.innerHTML = '';
        preview.style.display = 'none';
    }
    
    if (featuresPreview) {
        featuresPreview.innerHTML = '';
    }
    
    // Reset photo upload
    const photoUpload = document.getElementById('photo-upload');
    if (photoUpload) photoUpload.value = '';
}

// Show equipment details
function showEquipmentDetails(equipment) {
    currentEquipmentDetails = equipment;
    
    // Update gallery
    const gallery = document.getElementById('equipment-gallery');
    if (gallery) {
        if (equipment.images && equipment.images.length > 0) {
            gallery.innerHTML = `
                <div class="gallery-slide active">
                    <img src="${equipment.images[0].data}" alt="${equipment.name}">
                </div>
                <div class="gallery-dots">
                    ${equipment.images.map((_, i) => 
                        `<span class="dot ${i === 0 ? 'active' : ''}"></span>`
                    ).join('')}
                </div>
            `;
        } else {
            gallery.innerHTML = `
                <div class="gallery-placeholder">
                    <i data-lucide="image"></i>
                </div>
                <div class="gallery-dots">
                    <span class="dot active"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            `;
        }
    }
    
    // Update basic info
    document.getElementById('detail-equipment-name').textContent = equipment.name || 'Без названия';
    document.getElementById('detail-price').textContent = formatPriceForDetails(equipment);
    
    // Update status badge
    const statusBadge = document.getElementById('equipment-status');
    if (statusBadge) {
        statusBadge.innerHTML = getStatusBadge(equipment.status);
        statusBadge.className = `status-badge status-${equipment.status}`;
    }
    
    // Update specs
    document.getElementById('spec-capacity').textContent = formatCapacity(equipment);
    document.getElementById('spec-location').textContent = equipment.location || 'Не указано';
    document.getElementById('spec-owner').textContent = equipment.owner?.name || 'Неизвестно';
    document.getElementById('spec-rating').textContent = equipment.owner?.rating || '5.0';
    document.getElementById('spec-year').textContent = equipment.year || 'Н/Д';
    document.getElementById('spec-power').textContent = equipment.specifications?.power ? 
        `${equipment.specifications.power} л.с.` : 'Н/Д';
    document.getElementById('spec-fuel').textContent = equipment.specifications?.fuel || 'Н/Д';
    document.getElementById('spec-hours').textContent = equipment.operatingHours ? 
        `${equipment.operatingHours} часов` : 'Н/Д';
    
    // Update detailed specs
    const detailedSpecs = document.getElementById('detailed-specs');
    if (detailedSpecs && equipment.specifications) {
        let specsHTML = '';
        Object.entries(equipment.specifications).forEach(([key, value]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            specsHTML += `
                <div class="detailed-spec-item">
                    <span class="spec-label">${label}:</span>
                    <span class="spec-value">${value}</span>
                </div>
            `;
        });
        detailedSpecs.innerHTML = specsHTML;
    }
    
    // Update description
    document.getElementById('equipment-description-text').textContent = 
        equipment.description || 'Описание отсутствует';
    
    // Update features
    const featuresContainer = document.getElementById('equipment-features');
    if (featuresContainer) {
        featuresContainer.innerHTML = '';
        const features = equipment.features || [];
        features.forEach(feature => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = feature;
            featuresContainer.appendChild(tag);
        });
        
        if (features.length === 0) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = 'Особенности не указаны';
            featuresContainer.appendChild(tag);
        }
    }
    
    // Update documents
    const documentsList = document.getElementById('documents-list');
    if (documentsList) {
        documentsList.innerHTML = `
            <div class="document-item">
                <i data-lucide="file-text"></i>
                <span>Технический паспорт</span>
                <i data-lucide="download"></i>
            </div>
            <div class="document-item">
                <i data-lucide="shield"></i>
                <span>Страховой полис</span>
                <i data-lucide="download"></i>
            </div>
        `;
    }
    
    // Increment view count
    incrementViewCount(equipment.id);
    
    navigateTo('details-page');
}

// Increment view count
async function incrementViewCount(equipmentId) {
    try {
        const equipmentRef = database.ref(`equipment/${equipmentId}/views`);
        const snapshot = await equipmentRef.once('value');
        const currentViews = snapshot.val() || 0;
        await equipmentRef.set(currentViews + 1);
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
}

// Contact owner
function contactOwner() {
    const equipment = currentEquipmentDetails;
    if (!equipment || !equipment.owner || !equipment.owner.phone) {
        showNotification('Контактная информация не найдена', 'error');
        return;
    }
    
    const phoneNumber = equipment.owner.phone.replace(/\s+/g, '');
    
    const modalHTML = `
        <div class="modal-overlay active" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Связаться с владельцем</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="contact-info">
                        <div class="contact-item">
                            <i data-lucide="user"></i>
                            <span>${equipment.owner.name || 'Неизвестно'}</span>
                        </div>
                        <div class="contact-item">
                            <i data-lucide="phone"></i>
                            <span>${equipment.owner.phone}</span>
                        </div>
                        ${equipment.owner.telegram ? `
                        <div class="contact-item">
                            <i data-lucide="message-square"></i>
                            <span>${equipment.owner.telegram}</span>
                        </div>
                        ` : ''}
                        ${equipment.owner.email ? `
                        <div class="contact-item">
                            <i data-lucide="mail"></i>
                            <span>${equipment.owner.email}</span>
                        </div>
                        ` : ''}
                        <div class="contact-item">
                            <i data-lucide="truck"></i>
                            <span>${equipment.name || 'Техника'}</span>
                        </div>
                        <div class="contact-item">
                            <i data-lucide="map-pin"></i>
                            <span>${equipment.location || 'Не указано'}</span>
                        </div>
                    </div>
                    <div class="contact-actions">
                        <button class="btn-primary" onclick="window.location.href='tel:${phoneNumber}'; closeModal();">
                            <i data-lucide="phone"></i>
                            <span>Позвонить</span>
                        </button>
                        ${equipment.owner.telegram ? `
                        <button class="btn-secondary" onclick="sendTelegramMessage('${equipment.owner.telegram}')">
                            <i data-lucide="message-square"></i>
                            <span>Telegram</span>
                        </button>
                        ` : ''}
                        ${equipment.owner.email ? `
                        <button class="btn-secondary" onclick="sendEmail('${equipment.owner.email}')">
                            <i data-lucide="mail"></i>
                            <span>Email</span>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (lucide) lucide.createIcons();
}

// Send Telegram message
function sendTelegramMessage(username) {
    const equipment = currentEquipmentDetails;
    const message = `Здравствуйте! Интересует ваша техника: ${equipment.name}. Можно уточнить детали?`;
    const encodedMessage = encodeURIComponent(message);
    
    if (username.startsWith('@')) {
        username = username.substring(1);
    }
    
    window.open(`https://t.me/${username}?text=${encodedMessage}`, '_blank');
    closeModal();
}

// Send email
function sendEmail(email) {
    const equipment = currentEquipmentDetails;
    const subject = `Вопрос по технике: ${equipment.name}`;
    const body = `Здравствуйте!%0D%0A%0D%0AИнтересует ваша техника: ${equipment.name}.%0D%0AМожно уточнить детали?%0D%0A%0D%0AС уважением`;
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
    closeModal();
}

// Request rent
function requestRent() {
    const equipment = currentEquipmentDetails;
    if (!equipment) return;
    
    const modalHTML = `
        <div class="modal-overlay active" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Бронирование техники</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="rental-info">
                        <div class="rental-item">
                            <i data-lucide="truck"></i>
                            <div>
                                <strong>${equipment.name || 'Техника'}</strong>
                                <p>${formatPriceForDetails(equipment)}</p>
                            </div>
                        </div>
                        <div class="rental-item">
                            <i data-lucide="user"></i>
                            <div>
                                <strong>${equipment.owner?.name || 'Владелец'}</strong>
                                <p>${equipment.location || 'Местоположение'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Дата начала аренды *</label>
                        <input type="date" id="rental-start-date" class="modern-input" 
                               value="${new Date().toISOString().split('T')[0]}" min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Продолжительность *</label>
                        <select id="rental-duration" class="modern-select" onchange="updateRentalPrice()">
                            <option value="4">4 часа</option>
                            <option value="8" selected>Смена (8 часов)</option>
                            <option value="24">Сутки</option>
                            <option value="168">Неделя</option>
                            <option value="720">Месяц</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Количество</label>
                        <div class="input-with-suffix">
                            <input type="number" id="rental-quantity" value="1" min="1" max="10" class="modern-input">
                            <span class="input-suffix">ед.</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Дополнительные услуги</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="rental-driver" checked>
                                <span class="checkbox-custom"></span>
                                <span>С водителем</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="rental-fuel">
                                <span class="checkbox-custom"></span>
                                <span>С топливом</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="rental-operator">
                                <span class="checkbox-custom"></span>
                                <span>С оператором</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Дополнительные пожелания</label>
                        <textarea id="rental-notes" class="modern-textarea" 
                                  placeholder="Укажите дополнительные требования, адрес доставки и т.д." rows="3"></textarea>
                    </div>
                    
                    <div class="price-summary">
                        <div class="price-item">
                            <span>Стоимость аренды:</span>
                            <span id="base-price">0 сум</span>
                        </div>
                        <div class="price-item">
                            <span>Доп. услуги:</span>
                            <span id="extra-price">0 сум</span>
                        </div>
                        <div class="price-total">
                            <span>Итого:</span>
                            <span id="total-price">0 сум</span>
                        </div>
                    </div>
                    
                    <button class="btn-primary gradient-btn" onclick="submitRentalRequest()">
                        <i data-lucide="calendar"></i>
                        <span>Отправить заявку на бронирование</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (lucide) lucide.createIcons();
    
    // Calculate initial price
    updateRentalPrice();
}

// Update rental price
function updateRentalPrice() {
    const equipment = currentEquipmentDetails;
    if (!equipment || !equipment.pricing) return;
    
    const duration = parseInt(document.getElementById('rental-duration').value) || 8;
    const quantity = parseInt(document.getElementById('rental-quantity').value) || 1;
    
    let basePrice = 0;
    
    // Calculate base price based on equipment type
    if (equipment.category === 'mixer') {
        basePrice = (equipment.pricing.pricePerUnit || 70000) * quantity;
    } else if (equipment.category === 'pump') {
        const hours = duration;
        const pricePerHour = equipment.pricing.pricePerHour || 50000;
        const minHours = equipment.pricing.minHours || 4;
        basePrice = Math.max(hours, minHours) * pricePerHour * quantity;
    } else if (equipment.pricing.pricePerHour) {
        basePrice = duration * equipment.pricing.pricePerHour * quantity;
    } else if (equipment.pricing.pricePerUnit) {
        basePrice = equipment.pricing.pricePerUnit * quantity;
    }
    
    // Calculate extra services
    let extraPrice = 0;
    if (document.getElementById('rental-driver')?.checked) {
        extraPrice += 50000 * duration * quantity; // 50,000 per hour for driver
    }
    if (document.getElementById('rental-fuel')?.checked) {
        extraPrice += 20000 * duration * quantity; // 20,000 per hour for fuel
    }
    if (document.getElementById('rental-operator')?.checked) {
        extraPrice += 30000 * duration * quantity; // 30,000 per hour for operator
    }
    
    const totalPrice = basePrice + extraPrice;
    
    // Update display
    document.getElementById('base-price').textContent = basePrice.toLocaleString() + ' сум';
    document.getElementById('extra-price').textContent = extraPrice.toLocaleString() + ' сум';
    document.getElementById('total-price').textContent = totalPrice.toLocaleString() + ' сум';
}

// Submit rental request
async function submitRentalRequest() {
    const equipment = currentEquipmentDetails;
    const startDate = document.getElementById('rental-start-date').value;
    const duration = document.getElementById('rental-duration').value;
    const quantity = document.getElementById('rental-quantity').value;
    const notes = document.getElementById('rental-notes').value;
    
    if (!startDate) {
        showNotification('Выберите дату начала аренды', 'error');
        return;
    }
    
    // Calculate final price
    updateRentalPrice();
    const totalPrice = parseInt(document.getElementById('total-price').textContent.replace(/[^\d]/g, '')) || 0;
    
    try {
        const rentalRef = database.ref('rentals').push();
        const rentalData = {
            id: rentalRef.key,
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            userId: currentUser.uid,
            userName: `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`,
            startDate: startDate,
            duration: parseInt(duration),
            quantity: parseInt(quantity),
            notes: notes,
            totalPrice: totalPrice,
            status: 'pending',
            createdAt: Date.now(),
            driverIncluded: document.getElementById('rental-driver')?.checked || false,
            fuelIncluded: document.getElementById('rental-fuel')?.checked || false,
            operatorIncluded: document.getElementById('rental-operator')?.checked || false
        };
        
        await rentalRef.set(rentalData);
        
        // Send notification to equipment owner
        await sendRentalNotification(equipment.ownerId, rentalData);
        
        showNotification(`✅ Заявка на бронирование отправлена! Стоимость: ${totalPrice.toLocaleString()} сум`, 'success');
        closeModal();
        
    } catch (error) {
        console.error('Error submitting rental request:', error);
        showNotification('❌ Ошибка при отправке заявки', 'error');
    }
}

// Send rental notification
async function sendRentalNotification(ownerId, rentalData) {
    try {
        const notificationRef = database.ref('notifications').push();
        await notificationRef.set({
            id: notificationRef.key,
            userId: ownerId,
            type: 'rental_request',
            title: 'Новая заявка на аренду',
            message: `Пользователь ${rentalData.userName} хочет арендовать вашу технику "${rentalData.equipmentName}"`,
            data: rentalData,
            read: false,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// Search functionality
function performSearch(searchTerm) {
    const resultsContainer = document.getElementById('search-results-container');
    const clearSearchBtn = document.querySelector('.clear-search');
    
    if (!resultsContainer) return;
    
    if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
    
    if (!searchTerm || searchTerm.length < 2) {
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <i data-lucide="search"></i>
                <p>Введите минимум 2 символа для поиска</p>
            </div>
        `;
        return;
    }
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="loading-placeholder">
            <i data-lucide="loader" class="spin"></i>
            <p>Поиск...</p>
        </div>
    `;
    
    // Filter equipment
    setTimeout(() => {
        const filtered = allEquipment.filter(item => {
            if (item.status !== 'approved' || !item.available) return false;
            
            const searchLower = searchTerm.toLowerCase();
            return (
                (item.name && item.name.toLowerCase().includes(searchLower)) ||
                (item.brand && item.brand.toLowerCase().includes(searchLower)) ||
                (item.category && getCategoryName(item.category).toLowerCase().includes(searchLower)) ||
                (item.location && item.location.toLowerCase().includes(searchLower)) ||
                (item.description && item.description.toLowerCase().includes(searchLower)) ||
                (item.owner && item.owner.name && item.owner.name.toLowerCase().includes(searchLower))
            );
        });
        
        displaySearchResults(filtered, searchTerm);
    }, 300);
}

function filterSearch(category) {
    const searchInput = document.getElementById('main-search');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    let filtered = allEquipment.filter(item => 
        item.status === 'approved' && item.available
    );
    
    if (category !== 'all') {
        filtered = filtered.filter(item => item.category === category);
    }
    
    if (searchTerm.length >= 2) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    displaySearchResults(filtered, searchTerm);
    
    // Update filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
}

function displaySearchResults(results, searchTerm) {
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i data-lucide="search-x"></i>
                <p>Ничего не найдено${searchTerm ? ` по запросу "${searchTerm}"` : ''}</p>
                <button class="btn-primary gradient-btn" onclick="navigateTo('add-equipment-page')">
                    <i data-lucide="plus"></i>
                    <span>Добавить технику</span>
                </button>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = '';
    results.forEach(equipment => {
        const resultItem = createSearchResultItem(equipment);
        resultsContainer.appendChild(resultItem);
    });
    
    if (lucide) lucide.createIcons();
}

function createSearchResultItem(equipment) {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    
    const category = equipmentCategories.find(c => c.id === equipment.category) || equipmentCategories[0];
    const price = formatPriceForCard(equipment);
    
    div.innerHTML = `
        <div class="result-icon">
            <i data-lucide="${category.icon}"></i>
        </div>
        <div class="result-content">
            <h3>${equipment.name || 'Без названия'}</h3>
            <p class="result-location">${equipment.location || 'Не указано'}</p>
            <div class="result-meta">
                <span class="result-price">${price}</span>
                <span class="result-rating">
                    <i data-lucide="star"></i>
                    ${equipment.owner?.rating || '5.0'}
                </span>
            </div>
        </div>
        <div class="result-arrow">
            <i data-lucide="chevron-right"></i>
        </div>
    `;
    
    div.addEventListener('click', () => {
        showEquipmentDetails(equipment);
    });
    
    return div;
}

function clearSearchResults() {
    const resultsContainer = document.getElementById('search-results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <i data-lucide="search"></i>
                <p>Начните вводить название техники или города</p>
            </div>
        `;
        if (lucide) lucide.createIcons();
    }
}

// Navigation
function navigateTo(pageId) {
    console.log('Navigating to:', pageId);
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
        if (navItem) navItem.classList.add('active');
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Load page-specific content
        switch(pageId) {
            case 'home-page':
                loadFeaturedEquipment();
                loadFeaturedRoutes();
                loadStats();
                break;
            case 'search-page':
                if (document.getElementById('main-search')) {
                    document.getElementById('main-search').focus();
                }
                break;
            case 'my-equipment-page':
                loadUserEquipment();
                break;
            case 'admin-page':
                loadAdminPage();
                break;
            case 'add-equipment-page':
                if (!editingEquipmentId) {
                    resetForm();
                }
                break;
            case 'profile-page':
                updateProfileStats();
                break;
            case 'my-routes-page':
                loadUserRoutes();
                break;
            case 'orders-page':
                loadUserOrders();
                break;
            case 'favorites-page':
                loadFavorites();
                break;
        }
    }
    
    // Refresh icons
    setTimeout(() => {
        if (lucide) lucide.createIcons();
    }, 100);
}

function goBack() {
    const currentPage = document.querySelector('.page.active');
    if (!currentPage) return navigateTo('home-page');
    
    const currentPageId = currentPage.id;
    
    switch(currentPageId) {
        case 'search-page':
            const searchInput = document.getElementById('main-search');
            if (searchInput && searchInput.value.trim()) {
                searchInput.value = '';
                clearSearchResults();
            } else {
                navigateTo('home-page');
            }
            break;
        case 'details-page':
        case 'route-page':
        case 'add-equipment-page':
        case 'settings-page':
        case 'my-equipment-page':
        case 'admin-page':
        case 'my-routes-page':
        case 'orders-page':
        case 'favorites-page':
            navigateTo('home-page');
            break;
        default:
            navigateTo('home-page');
    }
}

// Admin Panel Functions
function loadAdminPage() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Доступ запрещен. Только администраторы могут просматривать эту страницу.', 'error');
        navigateTo('home-page');
        return;
    }
    
    loadAdminEquipment();
    loadAdminRoutes();
    loadAdminUsers();
    updateAdminStats();
    generateReport();
}

function switchAdminTab(tab) {
    currentAdminTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.admin-tab[onclick*="${tab}"]`)?.classList.add('active');
    
    // Show/hide sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`admin-${tab}-section`)?.classList.add('active');
}

function loadAdminEquipment() {
    const container = document.getElementById('admin-equipment-container');
    if (!container) return;
    
    const pendingEquipment = allEquipment.filter(item => item.status === 'pending');
    
    if (pendingEquipment.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i data-lucide="check-circle"></i>
                <p>Нет заявок на модерацию</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    pendingEquipment.forEach(equipment => {
        const card = createAdminEquipmentCard(equipment);
        container.appendChild(card);
    });
    
    if (lucide) lucide.createIcons();
}

function createAdminEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = 'admin-equipment-card';
    
    const category = equipmentCategories.find(c => c.id === equipment.category) || equipmentCategories[0];
    const price = formatPriceForCard(equipment);
    
    div.innerHTML = `
        <div class="admin-card-header">
            <div class="admin-card-title">
                <div class="category-icon">
                    <i data-lucide="${category.icon}"></i>
                </div>
                <div>
                    <h4>${equipment.name || 'Без названия'}</h4>
                    <p>${category.name} • ${equipment.location || 'Не указано'}</p>
                    <p class="admin-card-subtitle">Владелец: ${equipment.owner?.name || 'Неизвестно'}</p>
                </div>
            </div>
            <span class="badge-pending">На модерации</span>
        </div>
        <div class="admin-card-body">
            <p><strong>Грузоподъемность:</strong> ${formatCapacity(equipment)}</p>
            <p><strong>Год выпуска:</strong> ${equipment.year || 'Н/Д'}</p>
            <p><strong>Цена:</strong> ${price}</p>
            <p><strong>Описание:</strong> ${(equipment.description || '').substring(0, 150)}${equipment.description && equipment.description.length > 150 ? '...' : ''}</p>
            <p><strong>Контакт:</strong> ${equipment.owner?.phone || 'Не указан'}</p>
            <p><strong>Дата подачи:</strong> ${new Date(equipment.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="admin-card-actions">
            <button class="btn-success" onclick="approveEquipment('${equipment.id}')">
                <i data-lucide="check"></i>
                Одобрить
            </button>
            <button class="btn-danger" onclick="rejectEquipment('${equipment.id}')">
                <i data-lucide="x"></i>
                Отклонить
            </button>
            <button class="btn-secondary" onclick="viewEquipmentDetails('${equipment.id}')">
                <i data-lucide="eye"></i>
                Подробнее
            </button>
        </div>
    `;
    
    return div;
}

async function approveEquipment(equipmentId) {
    try {
        await database.ref(`equipment/${equipmentId}`).update({
            status: 'approved',
            approvedAt: Date.now(),
            approvedBy: currentUser.uid,
            updatedAt: Date.now()
        });
        
        showNotification('✅ Техника одобрена', 'success');
        loadAdminEquipment();
        updateAdminStats();
        
    } catch (error) {
        console.error('Error approving equipment:', error);
        showNotification('❌ Ошибка при одобрении', 'error');
    }
}

async function rejectEquipment(equipmentId) {
    const reason = prompt('Укажите причину отклонения:');
    if (reason === null) return;
    
    if (!reason.trim()) {
        showNotification('Введите причину отклонения', 'error');
        return;
    }
    
    try {
        await database.ref(`equipment/${equipmentId}`).update({
            status: 'rejected',
            rejectionReason: reason,
            rejectedAt: Date.now(),
            rejectedBy: currentUser.uid,
            updatedAt: Date.now()
        });
        
        showNotification('Техника отклонена', 'success');
        loadAdminEquipment();
        updateAdminStats();
        
    } catch (error) {
        console.error('Error rejecting equipment:', error);
        showNotification('❌ Ошибка при отклонении', 'error');
    }
}

function viewEquipmentDetails(equipmentId) {
    const equipment = allEquipment.find(item => item.id === equipmentId);
    if (equipment) {
        showEquipmentDetails(equipment);
    }
}

function loadAdminRoutes() {
    const container = document.getElementById('admin-routes-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-results">
            <i data-lucide="route"></i>
            <p>Модерация маршрутов в разработке</p>
        </div>
    `;
}

function loadAdminUsers() {
    const container = document.getElementById('admin-users-container');
    if (!container) return;
    
    const activeUsers = allUsers.filter(user => user.lastActive && (Date.now() - user.lastActive) < 30 * 24 * 60 * 60 * 1000);
    
    if (activeUsers.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i data-lucide="users"></i>
                <p>Нет активных пользователей</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    activeUsers.forEach(user => {
        const card = createAdminUserCard(user);
        container.appendChild(card);
    });
    
    if (lucide) lucide.createIcons();
}

function createAdminUserCard(user) {
    const div = document.createElement('div');
    div.className = 'admin-user-card';
    
    const equipmentCount = allEquipment.filter(e => e.ownerId === user.id).length;
    const lastActive = user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Неизвестно';
    
    div.innerHTML = `
        <div class="admin-user-header">
            <div class="admin-user-avatar">
                <i data-lucide="user"></i>
            </div>
            <div class="admin-user-info">
                <h4>${user.firstName || ''} ${user.lastName || ''}</h4>
                <p>${user.username || 'Без username'}</p>
                <p class="admin-user-subtitle">Техники: ${equipmentCount} | Активен: ${lastActive}</p>
            </div>
        </div>
        <div class="admin-user-actions">
            <button class="btn-small" onclick="viewUserProfile('${user.id}')">
                <i data-lucide="eye"></i>
            </button>
            <button class="btn-small ${user.blocked ? 'btn-success' : 'btn-danger'}" 
                    onclick="${user.blocked ? 'unblockUser' : 'blockUser'}('${user.id}')">
                <i data-lucide="${user.blocked ? 'unlock' : 'lock'}"></i>
            </button>
            <button class="btn-small" onclick="sendMessageToUser('${user.id}')">
                <i data-lucide="message-square"></i>
            </button>
        </div>
    `;
    
    return div;
}

function updateAdminStats() {
    const pendingCount = allEquipment.filter(item => item.status === 'pending').length;
    const approvedCount = allEquipment.filter(item => item.status === 'approved').length;
    const rejectedCount = allEquipment.filter(item => item.status === 'rejected').length;
    const usersCount = allUsers.length;
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('approved-count').textContent = approvedCount;
    document.getElementById('rejected-count').textContent = rejectedCount;
    document.getElementById('users-count').textContent = usersCount;
}

function refreshAdminData() {
    loadAdminEquipment();
    loadAdminRoutes();
    loadAdminUsers();
    updateAdminStats();
    generateReport();
    showNotification('Данные администратора обновлены', 'success');
}

function generateReport() {
    const period = document.getElementById('report-period')?.value || 'month';
    
    // Calculate stats based on period
    const now = Date.now();
    let startDate = now;
    
    switch(period) {
        case 'today':
            startDate = now - 24 * 60 * 60 * 1000;
            break;
        case 'week':
            startDate = now - 7 * 24 * 60 * 60 * 1000;
            break;
        case 'month':
            startDate = now - 30 * 24 * 60 * 60 * 1000;
            break;
        case 'quarter':
            startDate = now - 90 * 24 * 60 * 60 * 1000;
            break;
        case 'year':
            startDate = now - 365 * 24 * 60 * 60 * 1000;
            break;
    }
    
    // Calculate revenue (simulated)
    const totalRevenue = allEquipment.reduce((sum, item) => {
        if (item.createdAt >= startDate) {
            return sum + (item.pricing?.pricePerHour || 0) * 8 * 5; // 8 hours/day, 5 days
        }
        return sum;
    }, 0);
    
    const totalOrders = Math.floor(allEquipment.length * 0.3); // Simulated
    const activeUsers = allUsers.filter(u => u.lastActive && u.lastActive >= startDate).length;
    const equipmentAdded = allEquipment.filter(e => e.createdAt >= startDate).length;
    
    // Update display
    document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString() + ' сум';
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('active-users').textContent = activeUsers;
    document.getElementById('equipment-added').textContent = equipmentAdded;
    
    // Update chart
    updateRevenueChart(period);
}

function updateRevenueChart(period) {
    const ctx = document.getElementById('revenue-chart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    // Generate sample data based on period
    let labels = [];
    let data = [];
    
    switch(period) {
        case 'today':
            labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
            data = [10000, 15000, 25000, 30000, 20000, 15000];
            break;
        case 'week':
            labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            data = [150000, 180000, 220000, 190000, 250000, 120000, 80000];
            break;
        case 'month':
            labels = ['Неделя 1', 'Неделя 2', 'Неделя 3', 'Неделя 4'];
            data = [800000, 950000, 1100000, 850000];
            break;
        default:
            labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
            data = [3500000, 4200000, 3800000, 4500000, 5000000, 4800000];
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Выручка (сум)',
                data: data,
                borderColor: 'var(--primary)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' сум';
                        }
                    }
                }
            }
        }
    });
}

function downloadReport() {
    const reportData = {
        period: document.getElementById('report-period')?.value || 'month',
        totalRevenue: document.getElementById('total-revenue').textContent,
        totalOrders: document.getElementById('total-orders').textContent,
        activeUsers: document.getElementById('active-users').textContent,
        equipmentAdded: document.getElementById('equipment-added').textContent,
        generatedAt: new Date().toLocaleString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `report_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Отчет скачан', 'success');
}

function printReport() {
    window.print();
    showNotification('Подготовка к печати', 'info');
}

// Route calculation
function calculateRoute() {
    const from = document.getElementById('route-from')?.value.trim();
    const to = document.getElementById('route-to')?.value.trim();
    const cargo = document.getElementById('route-cargo')?.value.trim();
    const date = document.getElementById('route-date')?.value;
    const transportType = document.getElementById('transport-type')?.value;
    
    if (!from || !to) {
        showNotification('Укажите города отправления и назначения', 'error');
        return;
    }
    
    // Calculate distance (simulated)
    const distances = {
        'Ташкент-Самарканд': 350,
        'Ташкент-Бухара': 600,
        'Ташкент-Наманган': 200,
        'Самарканд-Бухара': 280
    };
    
    const routeKey = `${from}-${to}`;
    const distance = distances[routeKey] || Math.floor(Math.random() * 500) + 100;
    
    // Calculate price
    let pricePerKm = 500;
    switch(transportType) {
        case 'tonar': pricePerKm = 600; break;
        case 'samosval': pricePerKm = 550; break;
        case 'refrigerator': pricePerKm = 800; break;
        case 'container': pricePerKm = 700; break;
        case 'tent': pricePerKm = 450; break;
        case 'platform': pricePerKm = 650; break;
    }
    
    const basePrice = distance * pricePerKm;
    const insurance = document.getElementById('route-insurance')?.checked ? 25000 : 0;
    const gps = document.getElementById('route-gps')?.checked ? 15000 : 0;
    const loading = document.getElementById('route-loading')?.checked ? 50000 : 0;
    
    const totalPrice = basePrice + insurance + gps + loading;
    const availableTrucks = allEquipment.filter(item => 
        (item.category === transportType || (transportType === 'tonar' && item.category === 'tonar')) &&
        item.status === 'approved' && item.available
    ).length;
    
    // Update results
    const resultsDiv = document.getElementById('route-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <h3>Расчет стоимости перевозки</h3>
                    <div class="result-price">${totalPrice.toLocaleString()} сум</div>
                </div>
                <div class="result-details">
                    <div class="detail-item">
                        <span>Маршрут</span>
                        <span class="detail-value">${from} → ${to}</span>
                    </div>
                    <div class="detail-item">
                        <span>Расстояние</span>
                        <span class="detail-value">${distance} км</span>
                    </div>
                    <div class="detail-item">
                        <span>Время в пути</span>
                        <span class="detail-value">${Math.round(distance / 60)}-${Math.round(distance / 50)} часов</span>
                    </div>
                    <div class="detail-item">
                        <span>Тип транспорта</span>
                        <span class="detail-value">${getTransportTypeName(transportType)}</span>
                    </div>
                    <div class="detail-item">
                        <span>Страховка груза</span>
                        <span class="detail-value">${insurance ? '25,000 сум' : 'Нет'}</span>
                    </div>
                    <div class="detail-item">
                        <span>Доступные машины</span>
                        <span class="detail-value badge-success">${availableTrucks} ед.</span>
                    </div>
                </div>
                <button class="btn-secondary" onclick="showAvailableTrucks()">
                    <i data-lucide="truck"></i>
                    <span>Найти транспорт</span>
                </button>
                <button class="btn-primary gradient-btn" onclick="saveRouteCalculation()" style="margin-top: 12px;">
                    <i data-lucide="save"></i>
                    <span>Сохранить расчет</span>
                </button>
            </div>
        `;
        
        resultsDiv.classList.remove('hidden');
        setTimeout(() => {
            resultsDiv.style.opacity = '1';
            resultsDiv.style.transform = 'translateY(0)';
        }, 10);
    }
    
    showNotification('Маршрут рассчитан', 'success');
}

function getTransportTypeName(type) {
    const types = {
        'tonar': 'Тонар (20-40т)',
        'samosval': 'Самосвал (10-30т)',
        'refrigerator': 'Рефрижератор',
        'container': 'Контейнеровоз',
        'tent': 'Тентованный',
        'platform': 'Платформа'
    };
    return types[type] || type;
}

function showAvailableTrucks() {
    const from = document.getElementById('route-from')?.value.trim();
    const to = document.getElementById('route-to')?.value.trim();
    const transportType = document.getElementById('transport-type')?.value;
    
    if (!from || !to) {
        showNotification('Укажите маршрут', 'error');
        return;
    }
    
    const availableTrucks = allEquipment.filter(item => 
        (item.category === transportType || (transportType === 'tonar' && item.category === 'tonar')) &&
        item.status === 'approved' && item.available
    );
    
    if (availableTrucks.length === 0) {
        showNotification('Нет доступной техники на этом маршруте', 'info');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay active" onclick="closeModal()">
            <div class="modal-content wide-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Доступная техника на маршруте</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <p class="route-info">Маршрут: ${from} → ${to}</p>
                    <div class="trucks-list">
                        ${availableTrucks.map(truck => `
                            <div class="truck-item" onclick="selectTruckForRoute('${truck.id}')">
                                <div class="truck-icon">
                                    <i data-lucide="truck"></i>
                                </div>
                                <div class="truck-info">
                                    <h4>${truck.name || 'Без названия'}</h4>
                                    <p>${truck.location || 'Не указано'} • ${formatCapacity(truck)} • ${formatPriceForCard(truck)}</p>
                                    <p class="truck-owner">Владелец: ${truck.owner?.name || 'Неизвестно'}</p>
                                </div>
                                <button class="btn-small" onclick="event.stopPropagation(); selectTruckForRoute('${truck.id}')">
                                    Выбрать
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (lucide) lucide.createIcons();
}

function selectTruckForRoute(truckId) {
    const truck = allEquipment.find(item => item.id === truckId);
    if (truck) {
        showEquipmentDetails(truck);
        closeModal();
    }
}

async function saveRouteCalculation() {
    const from = document.getElementById('route-from')?.value.trim();
    const to = document.getElementById('route-to')?.value.trim();
    const cargo = document.getElementById('route-cargo')?.value.trim();
    const transportType = document.getElementById('transport-type')?.value;
    
    if (!from || !to) {
        showNotification('Недостаточно данных для сохранения', 'error');
        return;
    }
    
    try {
        const routeRef = database.ref('saved_routes').push();
        await routeRef.set({
            id: routeRef.key,
            userId: currentUser.uid,
            from: from,
            to: to,
            cargo: cargo,
            transportType: transportType,
            createdAt: Date.now()
        });
        
        showNotification('✅ Расчет маршрута сохранен', 'success');
        
    } catch (error) {
        console.error('Error saving route:', error);
        showNotification('❌ Ошибка при сохранении', 'error');
    }
}

// Update stats
function updateStats() {
    const onlineCount = allEquipment.filter(e => e.status === 'approved' && e.available).length;
    const renterCount = new Set(allEquipment.map(e => e.ownerId)).size;
    const routeCount = allRoutes.length;
    
    document.getElementById('online-count').textContent = onlineCount;
    document.getElementById('renter-count').textContent = renterCount;
    document.getElementById('route-count').textContent = routeCount;
}

// Utility functions
function formatPriceForCard(equipment) {
    if (!equipment.pricing) return 'Цена по запросу';
    
    if (equipment.category === 'mixer') {
        const basePrice = equipment.pricing.pricePerUnit || 70000;
        return `${basePrice.toLocaleString()} сум/м³`;
    } else if (equipment.category === 'pump') {
        const pricePerHour = equipment.pricing.pricePerHour || 0;
        return `${pricePerHour.toLocaleString()} сум/час`;
    } else if (equipment.category === 'tonar' || equipment.category === 'samosval') {
        const pricePerUnit = equipment.pricing.pricePerUnit || 0;
        return `${pricePerUnit.toLocaleString()} сум/м³`;
    } else {
        if (equipment.pricing.pricePerHour) {
            return `${equipment.pricing.pricePerHour.toLocaleString()} сум/час`;
        } else {
            return 'Цена по запросу';
        }
    }
}

function formatPriceForDetails(equipment) {
    if (!equipment.pricing) return 'Цена по запросу';
    
    let priceText = '';
    
    if (equipment.category === 'mixer') {
        const basePrice = equipment.pricing.pricePerUnit || 70000;
        const baseDistance = equipment.pricing.baseDistance || 20;
        const pricePerKm = equipment.pricing.pricePerKm || 1000;
        priceText = `${basePrice.toLocaleString()} сум/м³`;
        if (pricePerKm > 0) {
            priceText += ` (до ${baseDistance} км) + ${pricePerKm.toLocaleString()} сум/км`;
        }
    } else if (equipment.category === 'pump') {
        const pricePerHour = equipment.pricing.pricePerHour || 0;
        const minHours = equipment.pricing.minHours || 4;
        priceText = `${pricePerHour.toLocaleString()} сум/час`;
        if (minHours > 1) {
            priceText += ` (мин. ${minHours} часа)`;
        }
    } else if (equipment.category === 'tonar' || equipment.category === 'samosval') {
        const pricePerUnit = equipment.pricing.pricePerUnit || 0;
        const pricePerKm = equipment.pricing.pricePerKm || 500;
        priceText = `${pricePerUnit.toLocaleString()} сум/м³`;
        if (pricePerKm > 0) {
            priceText += ` + ${pricePerKm.toLocaleString()} сум/км`;
        }
    } else {
        if (equipment.pricing.pricePerHour && equipment.pricing.pricePerShift) {
            priceText = `${equipment.pricing.pricePerHour.toLocaleString()} сум/час`;
            priceText += ` • ${equipment.pricing.pricePerShift.toLocaleString()} сум/смена`;
        } else if (equipment.pricing.pricePerHour) {
            priceText = `${equipment.pricing.pricePerHour.toLocaleString()} сум/час`;
        } else if (equipment.pricing.pricePerShift) {
            priceText = `${equipment.pricing.pricePerShift.toLocaleString()} сум/смена`;
        } else {
            priceText = 'Цена по запросу';
        }
    }
    
    return priceText;
}

function formatCapacity(equipment) {
    if (!equipment.capacity) return 'Н/Д';
    
    const specs = equipmentSpecs[equipment.category];
    const unit = specs?.capacityUnit || 'т';
    
    return `${equipment.capacity} ${unit}`;
}

function getCategoryName(categoryId) {
    const category = equipmentCategories.find(c => c.id === categoryId);
    return category ? category.name : 'Техника';
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge-pending">На модерации</span>',
        'approved': '<span class="badge-approved">Одобрено</span>',
        'rejected': '<span class="badge-rejected">Отклонено</span>'
    };
    return badges[status] || '';
}

function formatPrice(amount) {
    if (!amount) return 'Цена не указана';
    return amount.toLocaleString() + ' сум';
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) {
        loadingScreen.classList.remove('active');
        loadingScreen.classList.add('hidden');
        loadingScreen.style.display = 'none';
    }
    
    if (mainContent) {
        mainContent.classList.remove('hidden');
        mainContent.style.display = 'block';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification-toast').forEach(toast => {
        toast.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'x-circle' : 
                 type === 'warning' ? 'alert-circle' : 'info';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
        if (lucide) lucide.createIcons();
    }, 10);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Additional page functions
function loadUserRoutes() {
    const container = document.getElementById('user-routes-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-results">
            <i data-lucide="route"></i>
            <p>У вас пока нет сохраненных маршрутов</p>
            <button class="btn-primary gradient-btn" onclick="navigateTo('route-page')">
                <i data-lucide="map-pin-plus"></i>
                <span>Создать маршрут</span>
            </button>
        </div>
    `;
}

function loadUserOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-orders">
            <i data-lucide="package"></i>
            <p>У вас пока нет заказов</p>
            <button class="btn-primary gradient-btn" onclick="navigateTo('search-page')">
                <i data-lucide="search"></i>
                <span>Найти технику</span>
            </button>
        </div>
    `;
}

function loadFavorites() {
    const container = document.getElementById('favorites-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-favorites">
            <i data-lucide="heart"></i>
            <p>У вас пока нет избранной техники</p>
            <button class="btn-primary gradient-btn" onclick="navigateTo('search-page')">
                <i data-lucide="search"></i>
                <span>Найти технику</span>
            </button>
        </div>
    `;
}

function toggleFavorite() {
    const equipment = currentEquipmentDetails;
    if (!equipment) return;
    
    // Toggle favorite state
    const isFavorite = localStorage.getItem(`favorite_${equipment.id}`);
    if (isFavorite) {
        localStorage.removeItem(`favorite_${equipment.id}`);
        showNotification('Удалено из избранного', 'success');
    } else {
        localStorage.setItem(`favorite_${equipment.id}`, 'true');
        showNotification('Добавлено в избранное', 'success');
    }
    
    // Update button icon
    const button = document.getElementById('favorite-btn');
    if (button) {
        const icon = button.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isFavorite ? 'heart' : 'heart');
            if (lucide) lucide.createIcons();
        }
    }
}

function switchOrderTab(tab) {
    currentOrderTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.order-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.order-tab[onclick*="${tab}"]`)?.classList.add('active');
    
    // Load orders for selected tab
    loadUserOrders();
}

function updateProfileStats() {
    document.getElementById('profile-equipment-count').textContent = userEquipment.length;
    document.getElementById('profile-orders-count').textContent = '0'; // Will be implemented
    document.getElementById('profile-routes-count').textContent = '0'; // Will be implemented
}

// Settings functions
function editProfile() {
    showNotification('Редактирование профиля в разработке', 'info');
}

function showSecurity() {
    showNotification('Настройки безопасности в разработке', 'info');
}

function showNotificationsSettings() {
    showNotification('Настройки уведомлений в разработке', 'info');
}

function showLanguage() {
    showNotification('Выбор языка в разработке', 'info');
}

function showTheme() {
    showNotification('Выбор темы в разработке', 'info');
}

function clearCache() {
    localStorage.clear();
    showNotification('Кэш очищен', 'success');
}

function showTerms() {
    showNotification('Условия использования в разработке', 'info');
}

function showPrivacy() {
    showNotification('Политика конфиденциальности в разработке', 'info');
}

function showSupport() {
    showNotification('Поддержка в разработке', 'info');
}

// Logout
function logout() {
    if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        showNotification('Вы вышли из системы', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}

// UI helper functions
function showEquipmentStats() {
    const count = allEquipment.filter(e => e.status === 'approved' && e.available).length;
    showNotification(`Доступно ${count} единиц техники`, 'info');
}

function showRenterStats() {
    const count = new Set(allEquipment.map(e => e.ownerId)).size;
    showNotification(`${count} арендаторов в системе`, 'info');
}

function showRouteStats() {
    showNotification(`${allRoutes.length} активных маршрутов`, 'info');
}

function showNotifications() {
    showNotification('Уведомления в разработке', 'info');
}

function showPendingItems() {
    switchAdminTab('equipment');
}

function showApprovedItems() {
    showNotification('Одобренных заявок: ' + allEquipment.filter(e => e.status === 'approved').length, 'info');
}

function showRejectedItems() {
    showNotification('Отклоненных заявок: ' + allEquipment.filter(e => e.status === 'rejected').length, 'info');
}

function showUsers() {
    switchAdminTab('users');
}

// Route details
function showRouteDetails(route) {
    showNotification(`Маршрут: ${route.from} → ${route.to}`, 'info');
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);