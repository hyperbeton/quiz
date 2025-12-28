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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Telegram Web App instance
const tg = window.Telegram.WebApp;

// Current state
let currentUser = null;
let allEquipment = [];
let currentStep = 1;
let userEquipment = [];
let editingEquipmentId = null;

// Initialize the application
async function init() {
    try {
        console.log('🚀 Initializing modern application...');
        
        // Initialize icons
        lucide.createIcons();
        
        // Try to initialize Telegram
        await initializeTelegram();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update pricing fields based on default category
        updatePricingFields();
        
        // Load equipment data
        loadEquipmentData();
        
        // Load user greeting
        updateUserGreeting();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            console.log('✅ App initialized successfully');
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        showNotification('Приложение загружено', 'info');
    }
}

// Initialize Telegram
async function initializeTelegram() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.log('Telegram timeout, using fallback');
            createFallbackUser();
            resolve();
        }, 3000);

        try {
            if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
                tg.expand();
                tg.enableClosingConfirmation();
                loadUserFromTelegram();
                console.log('Telegram initialized');
            } else {
                createFallbackUser();
            }
            
            clearTimeout(timeout);
            resolve();
        } catch (error) {
            console.error('Error initializing Telegram:', error);
            clearTimeout(timeout);
            createFallbackUser();
            resolve();
        }
    });
}

// Create fallback user
function createFallbackUser() {
    currentUser = {
        uid: 'fallback_' + Date.now(),
        firstName: 'Александр',
        lastName: 'Иванов',
        username: 'alexivanov',
        phone: '+998 90 123 45 67',
        photoUrl: '',
        isPremium: false,
        role: 'admin' // Для тестирования установим роль админа
    };
    
    console.log('Fallback user created:', currentUser);
    updateUIForAuthenticatedUser();
}

// Load user from Telegram
function loadUserFromTelegram() {
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
                phone: '', // Telegram не предоставляет номер
                isPremium: tgUser.is_premium || false,
                role: 'user' // По умолчанию обычный пользователь
            };
            
            // Для тестирования - установите роль админа для вашего пользователя
            // Замените 'your_username' на ваш реальный username в Telegram
            if (currentUser.username === 'ваш_username_в_telegram') {
                currentUser.role = 'admin';
            }
            
            console.log('User loaded from Telegram:', currentUser);
            updateUIForAuthenticatedUser();
        } else {
            createFallbackUser();
        }
    } catch (error) {
        console.error('Error loading user:', error);
        createFallbackUser();
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    const profileName = document.getElementById('profile-name');
    const userGreeting = document.getElementById('user-greeting-text');
    const profileAvatar = document.getElementById('profile-avatar');
    const adminMenuItem = document.getElementById('admin-menu-item');
    
    if (currentUser) {
        const displayName = currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : '');
        const greeting = getTimeBasedGreeting();
        
        if (profileName) profileName.textContent = displayName;
        if (userGreeting) userGreeting.textContent = greeting + ', ' + currentUser.firstName;
        
        if (currentUser.photoUrl && profileAvatar) {
            profileAvatar.src = currentUser.photoUrl;
            profileAvatar.style.display = 'block';
        }
        
        // Show admin menu item if user is admin
        if (adminMenuItem && currentUser.role === 'admin') {
            adminMenuItem.style.display = 'flex';
        }
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

// Update user greeting
function updateUserGreeting() {
    const greetingText = document.getElementById('user-greeting-text');
    if (greetingText && currentUser) {
        const greeting = getTimeBasedGreeting();
        greetingText.textContent = greeting + ', ' + currentUser.firstName;
    }
}

// Update pricing fields based on category
function updatePricingFields() {
    const category = document.getElementById('equipment-category').value;
    const pricingFields = document.getElementById('pricing-fields');
    const capacityUnit = document.getElementById('capacity-unit');
    
    // Update capacity unit based on category
    if (category === 'mixer') {
        capacityUnit.textContent = 'м³';
    } else if (category === 'pump') {
        capacityUnit.textContent = 'м³/час';
    } else {
        capacityUnit.textContent = 'тонн';
    }
    
    let pricingHTML = '';
    
    switch(category) {
        case 'mixer':
            pricingHTML = `
                <div class="price-input">
                    <label>Цена за 1 м³ (до 20 км)</label>
                    <div class="input-with-prefix">
                        <span class="input-prefix">сум</span>
                        <input type="number" id="price-per-unit" placeholder="70000" class="modern-input">
                    </div>
                </div>
                <div class="price-input">
                    <label>Цена за 1 км сверх 20 км</label>
                    <div class="input-with-prefix">
                        <span class="input-prefix">сум</span>
                        <input type="number" id="price-per-km" placeholder="1000" class="modern-input">
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
                        <input type="number" id="price-per-hour" placeholder="50000" class="modern-input">
                    </div>
                </div>
                <div class="price-input">
                    <label>Мин. часов аренды</label>
                    <div class="input-with-suffix">
                        <input type="number" id="min-hours" placeholder="4" class="modern-input">
                        <span class="input-suffix">часов</span>
                    </div>
                </div>
            `;
            break;
            
        case 'tonar':
        case 'samosval':
            pricingHTML = `
                <div class="price-input">
                    <label>Цена за 1 м³/тонну (базовая)</label>
                    <div class="input-with-prefix">
                        <span class="input-prefix">сум</span>
                        <input type="number" id="price-per-unit" placeholder="15000" class="modern-input">
                    </div>
                </div>
                <div class="price-input">
                    <label>Цена за 1 км</label>
                    <div class="input-with-prefix">
                        <span class="input-prefix">сум</span>
                        <input type="number" id="price-per-km" placeholder="500" class="modern-input">
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
                        <input type="number" id="price-per-hour" placeholder="30000" class="modern-input">
                    </div>
                </div>
                <div class="price-input">
                    <label>Цена за смену (8ч)</label>
                    <div class="input-with-prefix">
                        <span class="input-prefix">сум</span>
                        <input type="number" id="price-per-shift" placeholder="200000" class="modern-input">
                    </div>
                </div>
            `;
    }
    
    pricingFields.innerHTML = pricingHTML;
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            
            navigateTo(pageId);
            
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            item.classList.add('active');
        });
    });

    // Category pills
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.category-pill').forEach(p => {
                p.classList.remove('active');
            });
            pill.classList.add('active');
            
            const category = pill.getAttribute('data-category');
            filterEquipmentByCategory(category);
        });
    });

    // Quick actions
    document.querySelectorAll('.action-card').forEach(action => {
        action.addEventListener('click', () => {
            const actionType = action.getAttribute('data-action');
            handleQuickAction(actionType);
        });
    });

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            goBack();
        });
    });

    // Search functionality
    const searchInput = document.getElementById('main-search');
    const clearSearch = document.querySelector('.clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.trim();
            if (term.length > 0) {
                clearSearch?.classList.remove('hidden');
                if (term.length >= 2) {
                    performSearch(term);
                }
            } else {
                clearSearch?.classList.add('hidden');
                clearSearchResults();
            }
        });
        
        searchInput.addEventListener('focus', () => {
            navigateTo('search-page');
        });
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            clearSearch.classList.add('hidden');
            clearSearchResults();
        });
    }

    // Filter chips in search
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => {
                c.classList.remove('active');
            });
            chip.classList.add('active');
            
            const filter = chip.textContent.toLowerCase();
            filterSearchResults(filter);
        });
    });

    // Category select change
    document.getElementById('equipment-category').addEventListener('change', updatePricingFields);

    // Form step navigation
    window.nextStep = function(next) {
        // Validate current step
        if (!validateStep(currentStep)) {
            return;
        }
        
        document.querySelector(`#step-${currentStep}`).classList.remove('active');
        currentStep = next;
        document.querySelector(`#step-${currentStep}`).classList.add('active');
    };

    window.prevStep = function(prev) {
        document.querySelector(`#step-${currentStep}`).classList.remove('active');
        currentStep = prev;
        document.querySelector(`#step-${currentStep}`).classList.add('active');
    };

    // Upload area
    const uploadArea = document.getElementById('upload-area');
    const photoUpload = document.getElementById('photo-upload');
    
    if (uploadArea && photoUpload) {
        uploadArea.addEventListener('click', () => {
            photoUpload.click();
        });
        
        photoUpload.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                uploadArea.innerHTML = `
                    <i data-lucide="check-circle"></i>
                    <p>Загружено ${files.length} фото</p>
                `;
                lucide.createIcons();
            }
        });
    }
}

// Validate form step
function validateStep(step) {
    if (step === 1) {
        const category = document.getElementById('equipment-category').value;
        const model = document.getElementById('equipment-model').value.trim();
        const capacity = document.getElementById('equipment-capacity').value;
        
        if (!category) {
            showNotification('Выберите тип техники', 'error');
            return false;
        }
        
        if (!model) {
            showNotification('Введите название модели', 'error');
            return false;
        }
        
        if (!capacity || capacity <= 0) {
            showNotification('Введите корректную грузоподъемность', 'error');
            return false;
        }
        
        return true;
    }
    
    return true;
}

// Navigation functions
function navigateTo(pageId) {
    console.log('Navigating to:', pageId);
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Update page-specific content
        switch(pageId) {
            case 'home-page':
                loadFeaturedEquipment();
                break;
            case 'search-page':
                document.getElementById('main-search')?.focus();
                clearSearchResults();
                break;
            case 'my-equipment-page':
                loadUserEquipment();
                break;
            case 'admin-page':
                loadAdminPage();
                break;
            case 'add-equipment-page':
                resetForm();
                break;
        }
    }
    
    // Recreate icons
    setTimeout(() => lucide.createIcons(), 100);
}

function goBack() {
    const pages = document.querySelectorAll('.page.active');
    if (pages.length > 0) {
        const currentPage = pages[0].id;
        
        switch(currentPage) {
            case 'details-page':
            case 'route-page':
            case 'add-equipment-page':
            case 'settings-page':
            case 'my-equipment-page':
            case 'admin-page':
                navigateTo('home-page');
                break;
            case 'search-page':
                if (document.getElementById('main-search')?.value) {
                    document.getElementById('main-search').value = '';
                    clearSearchResults();
                } else {
                    navigateTo('home-page');
                }
                break;
            default:
                navigateTo('home-page');
        }
    } else {
        navigateTo('home-page');
    }
}

// Load equipment data
function loadEquipmentData() {
    try {
        console.log('Loading equipment data...');
        const equipmentRef = database.ref('equipment');
        
        equipmentRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const equipmentData = snapshot.val();
                allEquipment = Object.entries(equipmentData).map(([key, value]) => ({
                    id: key,
                    ...value
                })).filter(item => item !== null);
                
                console.log('Equipment loaded:', allEquipment.length, 'items');
                
                // Update featured equipment on home page
                if (document.getElementById('home-page').classList.contains('active')) {
                    loadFeaturedEquipment();
                }
            } else {
                allEquipment = [];
                console.log('No equipment data found');
            }
        }, (error) => {
            console.error('Error loading equipment:', error);
            allEquipment = [];
        });
    } catch (error) {
        console.error('Error loading equipment:', error);
        allEquipment = [];
    }
}

// Load user's equipment
function loadUserEquipment() {
    if (!currentUser) return;
    
    try {
        const equipmentRef = database.ref('equipment');
        
        equipmentRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const equipmentData = snapshot.val();
                userEquipment = Object.entries(equipmentData)
                    .map(([key, value]) => ({
                        id: key,
                        ...value
                    }))
                    .filter(item => item.ownerId === currentUser.uid && item !== null);
                
                console.log('User equipment loaded:', userEquipment.length, 'items');
                
                // Update stats
                updateUserEquipmentStats();
                
                // Display user equipment on my-equipment-page
                displayUserEquipment();
            } else {
                userEquipment = [];
                console.log('No user equipment found');
            }
        });
    } catch (error) {
        console.error('Error loading user equipment:', error);
        userEquipment = [];
    }
}

// Update user equipment stats
function updateUserEquipmentStats() {
    const totalCount = userEquipment.length;
    const activeCount = userEquipment.filter(item => item.status === 'approved' && item.available).length;
    const pendingCount = userEquipment.filter(item => item.status === 'pending').length;
    
    document.getElementById('my-equipment-count').textContent = totalCount;
    document.getElementById('my-active-count').textContent = activeCount;
    document.getElementById('my-pending-count').textContent = pendingCount;
}

// Display user equipment
function displayUserEquipment() {
    const container = document.getElementById('user-equipment-container');
    if (!container) return;
    
    container.innerHTML = '';
    
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
    
    userEquipment.forEach(equipment => {
        const card = createUserEquipmentCard(equipment);
        container.appendChild(card);
    });
    
    setTimeout(() => lucide.createIcons(), 100);
}

// Create user equipment card
function createUserEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = 'equipment-card';
    
    const categoryIcon = getCategoryIcon(equipment.category);
    const categoryName = getCategoryName(equipment.category);
    const price = formatPriceForCard(equipment);
    const statusBadge = getStatusBadge(equipment.status);
    
    div.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${categoryIcon}"></i>
            ${statusBadge}
        </div>
        <div class="equipment-content">
            <h3 class="equipment-title">${equipment.name}</h3>
            <p class="equipment-specs">${categoryName} • ${equipment.location}</p>
            <div class="equipment-footer">
                <div class="equipment-price small-price">${price}</div>
                <div class="equipment-actions">
                    <button class="btn-small" onclick="editEquipment('${equipment.id}')">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="btn-small btn-danger" onclick="deleteEquipment('${equipment.id}')">
                        <i data-lucide="trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// Load featured equipment
function loadFeaturedEquipment() {
    const featuredGrid = document.getElementById('featured-equipment');
    if (!featuredGrid) return;
    
    // Filter approved and available equipment
    const featured = allEquipment
        .filter(item => item.status === 'approved' && item.available)
        .slice(0, 4);
    
    featuredGrid.innerHTML = '';
    
    if (featured.length === 0) {
        featuredGrid.innerHTML = `
            <div class="no-results">
                <i data-lucide="construction"></i>
                <p>Популярной техники пока нет</p>
            </div>
        `;
        return;
    }
    
    featured.forEach(equipment => {
        const card = createEquipmentCard(equipment);
        featuredGrid.appendChild(card);
    });
    
    setTimeout(() => lucide.createIcons(), 100);
}

// Create equipment card for home page
function createEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = 'equipment-card';
    
    const categoryIcon = getCategoryIcon(equipment.category);
    const categoryName = getCategoryName(equipment.category);
    const price = formatPriceForCard(equipment);
    
    div.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${categoryIcon}"></i>
            ${equipment.featured ? '<div class="equipment-badge">TOP</div>' : ''}
        </div>
        <div class="equipment-content">
            <h3 class="equipment-title">${equipment.name}</h3>
            <p class="equipment-specs">${categoryName} • ${formatCapacity(equipment)}</p>
            <div class="equipment-footer">
                <div class="equipment-price small-price">${price}</div>
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

// Filter equipment by category
function filterEquipmentByCategory(category) {
    const featuredGrid = document.getElementById('featured-equipment');
    if (!featuredGrid) return;
    
    let filtered = [];
    
    if (category === 'all') {
        filtered = allEquipment
            .filter(item => item.status === 'approved' && item.available)
            .slice(0, 4);
    } else {
        filtered = allEquipment
            .filter(item => 
                item.status === 'approved' && 
                item.available && 
                (item.category === category || 
                 (category === 'trucks' && (item.category === 'tonar' || item.category === 'samosval')) ||
                 (category === 'mixers' && item.category === 'mixer') ||
                 (category === 'cranes' && item.category === 'crane') ||
                 (category === 'excavators' && item.category === 'excavator') ||
                 (category === 'pumps' && item.category === 'pump'))
            )
            .slice(0, 4);
    }
    
    featuredGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        featuredGrid.innerHTML = `
            <div class="no-results">
                <i data-lucide="construction"></i>
                <p>Техника не найдена</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(equipment => {
        const card = createEquipmentCard(equipment);
        featuredGrid.appendChild(card);
    });
    
    setTimeout(() => lucide.createIcons(), 100);
}

// Handle quick actions
function handleQuickAction(actionType) {
    switch(actionType) {
        case 'search':
            navigateTo('search-page');
            break;
        case 'add':
            navigateTo('add-equipment-page');
            break;
        case 'route':
            navigateTo('route-page');
            break;
        case 'orders':
            showNotification('Раздел в разработке', 'info');
            break;
    }
}

// Search functionality
function performSearch(searchTerm) {
    console.log('Searching for:', searchTerm);
    
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;
    
    // Filter equipment by search term
    const filtered = allEquipment.filter(item => 
        item.status === 'approved' &&
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (item.owner?.name && item.owner.name.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    
    displaySearchResults(filtered, searchTerm);
}

function filterSearchResults(filter) {
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;
    
    // Get current search term
    const searchInput = document.getElementById('main-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filtered = allEquipment.filter(item => 
        item.status === 'approved'
    );
    
    // Apply category filter
    if (filter !== 'все') {
        filtered = filtered.filter(item => {
            if (filter === 'тонары') return item.category === 'tonar';
            if (filter === 'самосвалы') return item.category === 'samosval';
            if (filter === 'миксеры') return item.category === 'mixer';
            if (filter === 'бетононасосы') return item.category === 'pump';
            if (filter === 'краны') return item.category === 'crane';
            if (filter === 'экскаваторы') return item.category === 'excavator';
            if (filter === 'маршруты') return item.routeAvailable;
            return item.category === filter;
        });
    }
    
    // Apply search term filter
    if (searchTerm.length >= 2) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.location.toLowerCase().includes(searchTerm)
        );
    }
    
    displaySearchResults(filtered, searchTerm);
}

function displaySearchResults(results, searchTerm) {
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i data-lucide="search-x"></i>
                <p>Ничего не найдено${searchTerm ? ` по запросу "${searchTerm}"` : ''}</p>
            </div>
        `;
        return;
    }
    
    results.forEach(equipment => {
        const resultItem = createSearchResultItem(equipment);
        resultsContainer.appendChild(resultItem);
    });
}

function createSearchResultItem(equipment) {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    
    const categoryIcon = getCategoryIcon(equipment.category);
    const price = formatPriceForCard(equipment);
    
    div.innerHTML = `
        <div class="result-icon">
            <i data-lucide="${categoryIcon}"></i>
        </div>
        <div class="result-content">
            <h3>${equipment.name}</h3>
            <p class="result-location">${equipment.location}</p>
            <div class="result-meta">
                <span class="result-price small-price">${price}</span>
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
        lucide.createIcons();
    }
}

// Show equipment details
function showEquipmentDetails(equipment) {
    console.log('Showing details for:', equipment.name);
    
    // Update page title
    const titleElement = document.getElementById('equipment-title');
    if (titleElement) {
        titleElement.textContent = equipment.name;
    }
    
    // Update equipment details
    document.getElementById('detail-equipment-name').textContent = equipment.name;
    document.getElementById('detail-price').textContent = formatPriceForDetails(equipment);
    document.getElementById('spec-capacity').textContent = formatCapacity(equipment);
    document.getElementById('spec-location').textContent = equipment.location;
    document.getElementById('spec-owner').textContent = equipment.owner?.name || 'Неизвестно';
    document.getElementById('spec-rating').textContent = equipment.owner?.rating || '5.0';
    document.getElementById('equipment-description-text').textContent = equipment.description || 'Описание отсутствует';
    
    // Store equipment data for contact
    window.currentEquipmentDetails = equipment;
    
    // Update tags
    const tagsContainer = document.getElementById('equipment-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        
        const tags = [
            formatCapacity(equipment),
            equipment.available ? 'Доступен сейчас' : 'Недоступен',
            equipment.paymentMethods?.includes('cash') && 'Наличные',
            equipment.paymentMethods?.includes('transfer') && 'Безналичные',
            equipment.insurance && 'Страховка',
            equipment.gps && 'GPS-трекер',
            equipment.year && `Год: ${equipment.year}`
        ].filter(tag => tag);
        
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            tagsContainer.appendChild(span);
        });
    }
    
    navigateTo('details-page');
}

// Calculate route
window.calculateRoute = function() {
    const from = document.getElementById('route-from')?.value.trim();
    const to = document.getElementById('route-to')?.value.trim();
    const cargo = document.getElementById('route-cargo')?.value.trim();
    const date = document.getElementById('route-date')?.value;
    const transportType = document.getElementById('transport-type')?.value;
    
    if (!from || !to) {
        showNotification('Укажите города отправления и назначения', 'error');
        return;
    }
    
    // Simulate calculation
    const resultsDiv = document.getElementById('route-results');
    if (resultsDiv) {
        resultsDiv.classList.remove('hidden');
        
        // Animate results
        resultsDiv.style.opacity = '0';
        resultsDiv.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultsDiv.style.transition = 'all 0.3s ease';
            resultsDiv.style.opacity = '1';
            resultsDiv.style.transform = 'translateY(0)';
        }, 100);
    }
    
    showNotification('Маршрут рассчитан', 'success');
};

window.showAvailableTrucks = function() {
    const from = document.getElementById('route-from')?.value.trim();
    const to = document.getElementById('route-to')?.value.trim();
    
    if (!from || !to) {
        showNotification('Укажите маршрут', 'error');
        return;
    }
    
    // Filter trucks for the route
    const availableTrucks = allEquipment.filter(item => 
        (item.category === 'tonar' || item.category === 'samosval') &&
        item.status === 'approved' &&
        item.available
    );
    
    if (availableTrucks.length === 0) {
        showNotification('Нет доступной техники на этом маршруте', 'info');
        return;
    }
    
    // Create modal with available trucks
    const modalHTML = `
        <div class="modal-overlay active" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Доступная техника</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>Маршрут: ${from} → ${to}</p>
                    <div class="trucks-list">
                        ${availableTrucks.map(truck => `
                            <div class="truck-item">
                                <div class="truck-icon">
                                    <i data-lucide="truck"></i>
                                </div>
                                <div class="truck-info">
                                    <h4>${truck.name}</h4>
                                    <p>${truck.location} • ${formatPriceForCard(truck)}</p>
                                </div>
                                <button class="btn-small" onclick="selectTruck('${truck.id}')">Выбрать</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons();
};

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function selectTruck(truckId) {
    const truck = allEquipment.find(item => item.id === truckId);
    if (truck) {
        showEquipmentDetails(truck);
        closeModal();
    }
}

// Save equipment
window.saveEquipment = async function() {
    if (!currentUser) {
        showNotification('Ошибка авторизации', 'error');
        return;
    }
    
    // Get form values
    const category = document.getElementById('equipment-category')?.value;
    const model = document.getElementById('equipment-model')?.value.trim();
    const capacity = document.getElementById('equipment-capacity')?.value;
    const year = document.getElementById('equipment-year')?.value;
    const location = document.getElementById('equipment-location')?.value.trim();
    const phone = document.getElementById('owner-phone')?.value.trim();
    const description = document.getElementById('equipment-description')?.value.trim();
    const minRental = document.getElementById('min-rental')?.value;
    
    // Validation
    if (!category || !model || !capacity || !location || !phone || !description) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    // More flexible phone validation
    const phoneRegex = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Введите корректный номер телефона формата: +998 90 123 45 67', 'error');
        return;
    }
    
    // Get pricing based on category
    let pricing = {};
    
    switch(category) {
        case 'mixer':
            const pricePerUnit = document.getElementById('price-per-unit')?.value || 70000;
            const pricePerKm = document.getElementById('price-per-km')?.value || 1000;
            pricing = {
                pricePerUnit: parseInt(pricePerUnit),
                pricePerKm: parseInt(pricePerKm),
                baseDistance: 20,
                unit: 'м³'
            };
            break;
            
        case 'pump':
            const pricePerHour = document.getElementById('price-per-hour')?.value || 50000;
            const minHours = document.getElementById('min-hours')?.value || 4;
            pricing = {
                pricePerHour: parseInt(pricePerHour),
                minHours: parseInt(minHours),
                unit: 'час'
            };
            break;
            
        case 'tonar':
        case 'samosval':
            const pricePerUnitTruck = document.getElementById('price-per-unit')?.value || 15000;
            const pricePerKmTruck = document.getElementById('price-per-km')?.value || 500;
            pricing = {
                pricePerUnit: parseInt(pricePerUnitTruck),
                pricePerKm: parseInt(pricePerKmTruck),
                unit: 'м³/т'
            };
            break;
            
        default:
            const pricePerHourDefault = document.getElementById('price-per-hour')?.value || 30000;
            const pricePerShift = document.getElementById('price-per-shift')?.value || 200000;
            pricing = {
                pricePerHour: parseInt(pricePerHourDefault),
                pricePerShift: parseInt(pricePerShift),
                unit: 'час'
            };
    }
    
    try {
        // Create equipment object
        const equipmentData = {
            category: category,
            name: model,
            capacity: parseInt(capacity),
            year: year ? parseInt(year) : null,
            location: location,
            pricing: pricing,
            minRental: minRental,
            ownerId: currentUser.uid,
            owner: {
                name: currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : ''),
                phone: phone,
                rating: 5.0,
                reviews: 0
            },
            description: description,
            available: true,
            status: 'pending',
            createdAt: Date.now(),
            insurance: true,
            gps: true
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
            const equipmentId = equipmentRef.key;
            equipmentData.id = equipmentId;
            await equipmentRef.set(equipmentData);
            showNotification('✅ Техника отправлена на модерацию', 'success');
        }
        
        // Reset form and navigate back
        setTimeout(() => {
            navigateTo('profile-page');
            resetForm();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving equipment:', error);
        showNotification('❌ Ошибка при сохранении: ' + error.message, 'error');
    }
};

// Edit equipment
function editEquipment(equipmentId) {
    const equipment = userEquipment.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    editingEquipmentId = equipmentId;
    
    // Fill form with equipment data
    document.getElementById('equipment-category').value = equipment.category;
    document.getElementById('equipment-model').value = equipment.name;
    document.getElementById('equipment-capacity').value = equipment.capacity;
    document.getElementById('equipment-year').value = equipment.year || '';
    document.getElementById('equipment-location').value = equipment.location;
    document.getElementById('owner-phone').value = equipment.owner?.phone || currentUser.phone;
    document.getElementById('equipment-description').value = equipment.description || '';
    document.getElementById('min-rental').value = equipment.minRental || '8';
    
    // Update pricing fields
    updatePricingFields();
    
    // Fill pricing fields based on equipment data
    setTimeout(() => {
        if (equipment.pricing) {
            if (equipment.category === 'mixer') {
                document.getElementById('price-per-unit').value = equipment.pricing.pricePerUnit || 70000;
                document.getElementById('price-per-km').value = equipment.pricing.pricePerKm || 1000;
            } else if (equipment.category === 'pump') {
                document.getElementById('price-per-hour').value = equipment.pricing.pricePerHour || 50000;
                document.getElementById('min-hours').value = equipment.pricing.minHours || 4;
            } else if (equipment.category === 'tonar' || equipment.category === 'samosval') {
                document.getElementById('price-per-unit').value = equipment.pricing.pricePerUnit || 15000;
                document.getElementById('price-per-km').value = equipment.pricing.pricePerKm || 500;
            } else {
                document.getElementById('price-per-hour').value = equipment.pricing.pricePerHour || 30000;
                document.getElementById('price-per-shift').value = equipment.pricing.pricePerShift || 200000;
            }
        }
    }, 100);
    
    navigateTo('add-equipment-page');
    showNotification('Редактирование техники', 'info');
}

// Delete equipment
async function deleteEquipment(equipmentId) {
    if (!confirm('Вы уверены, что хотите удалить технику?')) return;
    
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
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step-1').classList.add('active');
    
    // Reset form fields
    const formFields = [
        'equipment-category',
        'equipment-model',
        'equipment-capacity',
        'equipment-year',
        'equipment-location',
        'owner-phone',
        'equipment-description',
        'min-rental'
    ];
    
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.tagName === 'SELECT') {
                field.selectedIndex = 0;
            } else {
                field.value = '';
            }
        }
    });
    
    // Reset pricing fields
    updatePricingFields();
    
    // Reset upload area
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i data-lucide="upload"></i>
            <p>Перетащите фото или нажмите для загрузки</p>
        `;
    }
    
    // Reset photo upload
    const photoUpload = document.getElementById('photo-upload');
    if (photoUpload) {
        photoUpload.value = '';
    }
}

// Contact owner - РАБОТАЕТ
window.contactOwner = function() {
    const equipment = window.currentEquipmentDetails;
    if (!equipment || !equipment.owner || !equipment.owner.phone) {
        showNotification('Контактная информация не найдена', 'error');
        return;
    }
    
    const phoneNumber = equipment.owner.phone.replace(/\s+/g, '');
    
    // Создаем модальное окно с контактами
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Связаться с владельцем</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="contact-info">
                        <div class="contact-item">
                            <i data-lucide="user"></i>
                            <span>${equipment.owner.name}</span>
                        </div>
                        <div class="contact-item">
                            <i data-lucide="phone"></i>
                            <span>${equipment.owner.phone}</span>
                        </div>
                        <div class="contact-item">
                            <i data-lucide="truck"></i>
                            <span>${equipment.name}</span>
                        </div>
                        <div class="contact-item">
                            <i data-lucide="map-pin"></i>
                            <span>${equipment.location}</span>
                        </div>
                    </div>
                    <div class="contact-actions">
                        <button class="btn-primary" onclick="window.location.href='tel:${phoneNumber}'">
                            <i data-lucide="phone"></i>
                            <span>Позвонить</span>
                        </button>
                        <button class="btn-secondary" onclick="sendTelegramMessage('${equipment.owner.name}', '${equipment.name}')">
                            <i data-lucide="message-square"></i>
                            <span>Написать в Telegram</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons();
};

// Send Telegram message
function sendTelegramMessage(ownerName, equipmentName) {
    const message = `Здравствуйте! Интересует ваша техника: ${equipmentName}. Можно уточнить детали?`;
    const encodedMessage = encodeURIComponent(message);
    
    const equipment = window.currentEquipmentDetails;
    if (equipment.owner && equipment.owner.username) {
        window.open(`https://t.me/${equipment.owner.username}?text=${encodedMessage}`, '_blank');
    } else {
        // Если username нет, предлагаем скопировать сообщение
        navigator.clipboard.writeText(message).then(() => {
            showNotification('Сообщение скопировано в буфер обмена', 'success');
        }).catch(err => {
            showNotification('Не удалось скопировать сообщение', 'error');
        });
    }
    closeModal();
}

// Request rent
window.requestRent = function() {
    const equipment = window.currentEquipmentDetails;
    if (!equipment) return;
    
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Бронирование техники</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <p><strong>${equipment.name}</strong></p>
                    <p>${formatPriceForDetails(equipment)}</p>
                    
                    <div class="form-group">
                        <label class="form-label">Дата начала аренды</label>
                        <input type="date" id="rental-start-date" class="modern-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Продолжительность</label>
                        <select id="rental-duration" class="modern-select">
                            <option value="4">4 часа</option>
                            <option value="8">Смена (8 часов)</option>
                            <option value="24">Сутки</option>
                            <option value="168">Неделя</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Дополнительные пожелания</label>
                        <textarea id="rental-notes" class="modern-textarea" placeholder="Укажите дополнительные требования..."></textarea>
                    </div>
                    
                    <button class="btn-primary gradient-btn" onclick="submitRentalRequest()">
                        <i data-lucide="calendar"></i>
                        <span>Отправить заявку</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons();
};

function submitRentalRequest() {
    const equipment = window.currentEquipmentDetails;
    const startDate = document.getElementById('rental-start-date').value;
    const duration = document.getElementById('rental-duration').value;
    const notes = document.getElementById('rental-notes').value;
    
    if (!startDate) {
        showNotification('Выберите дату начала аренды', 'error');
        return;
    }
    
    // Calculate estimated price
    let estimatedPrice = 0;
    if (equipment.pricing) {
        if (equipment.category === 'mixer') {
            estimatedPrice = equipment.pricing.pricePerUnit || 70000;
        } else if (equipment.category === 'pump') {
            const hours = parseInt(duration);
            const pricePerHour = equipment.pricing.pricePerHour || 50000;
            const minHours = equipment.pricing.minHours || 4;
            estimatedPrice = Math.max(hours, minHours) * pricePerHour;
        } else if (equipment.pricing.pricePerHour) {
            const hours = parseInt(duration);
            estimatedPrice = hours * equipment.pricing.pricePerHour;
        }
    }
    
    showNotification(`Заявка на бронирование отправлена владельцу. Примерная стоимость: ${estimatedPrice.toLocaleString()} сум`, 'success');
    closeModal();
}

// Admin functions
function loadAdminPage() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Доступ запрещен', 'error');
        navigateTo('home-page');
        return;
    }
    
    loadPendingEquipment();
    updateAdminStats();
}

function loadPendingEquipment() {
    const pendingEquipment = allEquipment.filter(item => item.status === 'pending');
    displayPendingEquipment(pendingEquipment);
}

function displayPendingEquipment(equipmentList) {
    const container = document.getElementById('admin-equipment-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (equipmentList.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i data-lucide="check-circle"></i>
                <p>Нет заявок на модерацию</p>
            </div>
        `;
        return;
    }
    
    equipmentList.forEach(equipment => {
        const card = createAdminEquipmentCard(equipment);
        container.appendChild(card);
    });
}

function createAdminEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = 'admin-equipment-card';
    
    const categoryIcon = getCategoryIcon(equipment.category);
    const categoryName = getCategoryName(equipment.category);
    
    div.innerHTML = `
        <div class="admin-card-header">
            <div class="admin-card-title">
                <div class="category-icon">
                    <i data-lucide="${categoryIcon}"></i>
                </div>
                <div>
                    <h4>${equipment.name}</h4>
                    <p>${categoryName} • ${equipment.location}</p>
                </div>
            </div>
            <span class="badge-pending">На модерации</span>
        </div>
        <div class="admin-card-body">
            <p><strong>Владелец:</strong> ${equipment.owner?.name || 'Не указан'}</p>
            <p><strong>Телефон:</strong> ${equipment.owner?.phone || 'Не указан'}</p>
            <p><strong>Грузоподъемность:</strong> ${formatCapacity(equipment)}</p>
            <p><strong>Цена:</strong> ${formatPriceForDetails(equipment)}</p>
            <p><strong>Описание:</strong> ${equipment.description?.substring(0, 100)}${equipment.description?.length > 100 ? '...' : ''}</p>
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
            approvedBy: currentUser.uid
        });
        
        showNotification('✅ Техника одобрена', 'success');
        loadPendingEquipment();
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
            rejectedBy: currentUser.uid
        });
        
        showNotification('Техника отклонена', 'success');
        loadPendingEquipment();
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

function updateAdminStats() {
    const pendingCount = allEquipment.filter(item => item.status === 'pending').length;
    const approvedCount = allEquipment.filter(item => item.status === 'approved').length;
    const rejectedCount = allEquipment.filter(item => item.status === 'rejected').length;
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('approved-count').textContent = approvedCount;
    document.getElementById('rejected-count').textContent = rejectedCount;
}

// Logout
window.logout = function() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        showNotification('Вы вышли из системы', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
};

// Utility functions
function getCategoryIcon(category) {
    const icons = {
        'tonar': 'truck',
        'samosval': 'truck',
        'mixer': 'mixer',
        'crane': 'crane',
        'excavator': 'excavator',
        'pump': 'gauge'
    };
    return icons[category] || 'construction';
}

function getCategoryName(category) {
    const names = {
        'tonar': 'Тонар',
        'samosval': 'Самосвал',
        'mixer': 'Миксер',
        'crane': 'Кран',
        'excavator': 'Экскаватор',
        'pump': 'Бетононасос'
    };
    return names[category] || 'Техника';
}

function formatPriceForCard(equipment) {
    if (!equipment.pricing) return 'Цена не указана';
    
    if (equipment.category === 'mixer') {
        // Миксер: 70,000 сум/м³ (до 20 км)
        const basePrice = equipment.pricing.pricePerUnit || 70000;
        const unit = equipment.pricing.unit || 'м³';
        return `${basePrice.toLocaleString()} сум/${unit}`;
    } else if (equipment.category === 'pump') {
        // Бетононасос: почасовая оплата
        const pricePerHour = equipment.pricing.pricePerHour || 0;
        return `${pricePerHour.toLocaleString()} сум/час`;
    } else if (equipment.category === 'tonar' || equipment.category === 'samosval') {
        // Тонар/самосвал: за единицу объема/веса
        const pricePerUnit = equipment.pricing.pricePerUnit || 0;
        const unit = equipment.pricing.unit || 'м³/т';
        return `${pricePerUnit.toLocaleString()} сум/${unit}`;
    } else {
        // Другая техника
        if (equipment.pricing.pricePerHour) {
            return `${equipment.pricing.pricePerHour.toLocaleString()} сум/час`;
        } else if (equipment.pricing.pricePerShift) {
            return `${equipment.pricing.pricePerShift.toLocaleString()} сум/смена`;
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
        const unit = equipment.pricing.unit || 'м³';
        const baseDistance = equipment.pricing.baseDistance || 20;
        const pricePerKm = equipment.pricing.pricePerKm || 1000;
        priceText = `${basePrice.toLocaleString()} сум/${unit} (до ${baseDistance} км)`;
        if (pricePerKm > 0) {
            priceText += ` + ${pricePerKm.toLocaleString()} сум/км`;
        }
    } else if (equipment.category === 'pump') {
        const pricePerHour = equipment.pricing.pricePerHour || 0;
        const minHours = equipment.pricing.minHours || 4;
        priceText = `${pricePerHour.toLocaleString()} сум/час (мин. ${minHours} часа)`;
    } else if (equipment.category === 'tonar' || equipment.category === 'samosval') {
        const pricePerUnit = equipment.pricing.pricePerUnit || 0;
        const unit = equipment.pricing.unit || 'м³/т';
        const pricePerKm = equipment.pricing.pricePerKm || 500;
        priceText = `${pricePerUnit.toLocaleString()} сум/${unit} + ${pricePerKm.toLocaleString()} сум/км`;
    } else {
        if (equipment.pricing.pricePerHour && equipment.pricing.pricePerShift) {
            priceText = `${equipment.pricing.pricePerHour.toLocaleString()} сум/час • ${equipment.pricing.pricePerShift.toLocaleString()} сум/смена`;
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
    if (equipment.capacity) {
        if (equipment.category === 'mixer') {
            return `${equipment.capacity} м³`;
        } else if (equipment.category === 'pump') {
            return `${equipment.capacity} м³/час`;
        } else {
            return `${equipment.capacity} т`;
        }
    }
    return 'Н/Д';
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge-pending">На модерации</span>',
        'approved': '<span class="badge-approved">Одобрено</span>',
        'rejected': '<span class="badge-rejected">Отклонено</span>'
    };
    return badges[status] || '';
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
        lucide.createIcons();
    }, 10);
    
    // Auto hide
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);