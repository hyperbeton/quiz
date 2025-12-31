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
const auth = firebase.auth();

// Telegram Web App instance
const tg = window.Telegram?.WebApp;

// Current state
let currentUser = null;
let allEquipment = [];
let currentStep = 1;
let userEquipment = [];
let editingEquipmentId = null;
let currentEquipmentDetails = null;
let adminUsers = ['ваш_username_в_telegram', 'admin_user']; // Добавьте сюда админов

// Initialize the application
async function init() {
    try {
        console.log('🚀 Initializing application...');
        
        // Initialize icons
        if (lucide) lucide.createIcons();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update pricing fields
        updatePricingFields();
        
        // Check authentication
        await checkAuth();
        
        // Load initial data
        loadEquipmentData();
        loadStats();
        
        // Set default date for route
        const today = new Date().toISOString().split('T')[0];
        const routeDate = document.getElementById('route-date');
        if (routeDate) {
            routeDate.value = today;
            routeDate.min = today;
        }
        
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            const mainContent = document.getElementById('main-content');
            if (loadingScreen) loadingScreen.classList.add('hidden');
            if (mainContent) mainContent.classList.remove('hidden');
            console.log('✅ App initialized successfully');
            
            // Update icons after load
            if (lucide) lucide.createIcons();
        }, 1500);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Ошибка загрузки приложения', 'error');
    }
}

// Check authentication
async function checkAuth() {
    try {
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            await loadUserFromTelegram();
        } else {
            await createFallbackUser();
        }
        
        // Update UI
        updateUIForAuthenticatedUser();
        
    } catch (error) {
        console.error('Auth error:', error);
        await createFallbackUser();
    }
}

// Create fallback user for testing
async function createFallbackUser() {
    currentUser = {
        uid: 'test_user_' + Date.now(),
        firstName: 'Иван',
        lastName: 'Петров',
        username: 'ivanpetrov',
        phone: '+998 90 123 45 67',
        photoUrl: '',
        isPremium: false,
        role: 'user'
    };
    
    // For testing admin panel, uncomment line below
    // currentUser.role = 'admin';
    
    console.log('Fallback user created');
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
                role: 'user'
            };
            
            // Check if user is admin
            if (adminUsers.includes(currentUser.username)) {
                currentUser.role = 'admin';
            }
            
            console.log('User loaded from Telegram');
        }
    } catch (error) {
        console.error('Error loading Telegram user:', error);
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    if (!currentUser) return;
    
    const profileName = document.getElementById('profile-name');
    const userGreeting = document.getElementById('user-greeting-text');
    const adminMenuItem = document.getElementById('admin-menu-item');
    
    const displayName = `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`;
    const greeting = getTimeBasedGreeting();
    
    if (profileName) profileName.textContent = displayName;
    if (userGreeting) userGreeting.textContent = `${greeting}, ${currentUser.firstName}`;
    
    // Show admin menu if user is admin
    if (adminMenuItem && currentUser.role === 'admin') {
        adminMenuItem.style.display = 'flex';
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
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value.trim());
            }
        });
    }
    
    // Clear search button
    const clearSearchBtn = document.querySelector('.clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    // Photo upload
    const photoUpload = document.getElementById('photo-upload');
    const uploadArea = document.getElementById('upload-area');
    
    if (photoUpload && uploadArea) {
        uploadArea.addEventListener('click', () => photoUpload.click());
        
        photoUpload.addEventListener('change', (e) => {
            handleImageUpload(e.target.files);
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border)';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border)';
            handleImageUpload(e.dataTransfer.files);
        });
    }
    
    // Form navigation
    window.validateStep1 = validateStep1;
    window.validateStep2 = validateStep2;
    window.prevStep = prevStep;
    window.nextStep = nextStep;
    
    // Equipment category change
    const categorySelect = document.getElementById('equipment-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', updatePricingFields);
    }
    
    // Notification settings
    const pushNotif = document.getElementById('push-notifications');
    const emailNotif = document.getElementById('email-notifications');
    
    if (pushNotif) pushNotif.addEventListener('change', saveNotificationSettings);
    if (emailNotif) emailNotif.addEventListener('change', saveNotificationSettings);
}

// Debounce function for search
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

// Handle image upload
function handleImageUpload(files) {
    if (!files || files.length === 0) return;
    
    const uploadArea = document.getElementById('upload-area');
    const preview = document.getElementById('upload-preview');
    
    if (!uploadArea || !preview) return;
    
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
    
    for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '100%';
            img.style.height = '80px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = 'var(--border-radius-sm)';
            preview.appendChild(img);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Refresh icons
    if (lucide) lucide.createIcons();
}

// Update pricing fields based on category
function updatePricingFields() {
    const category = document.getElementById('equipment-category')?.value || 'tonar';
    const pricingFields = document.getElementById('pricing-fields');
    const capacityUnit = document.getElementById('capacity-unit');
    
    if (!pricingFields) return;
    
    // Update capacity unit
    if (category === 'mixer') {
        if (capacityUnit) capacityUnit.textContent = 'м³';
    } else if (category === 'pump') {
        if (capacityUnit) capacityUnit.textContent = 'м³/час';
    } else {
        if (capacityUnit) capacityUnit.textContent = 'тонн';
    }
    
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

// Navigation functions
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
        }
    }
    
    // Refresh icons
    setTimeout(() => {
        if (lucide) lucide.createIcons();
    }, 100);
}

function goBack() {
    const currentPage = document.querySelector('.page.active');
    if (!currentPage) return;
    
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
        case 'orders-page':
            navigateTo('home-page');
            break;
        default:
            navigateTo('home-page');
    }
}

// Load equipment data from Firebase
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
                
                // Update featured equipment if on home page
                if (document.getElementById('home-page').classList.contains('active')) {
                    loadFeaturedEquipment();
                }
                
                // Update stats
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

// Load stats
function loadStats() {
    updateStats();
}

function updateStats() {
    const onlineCount = allEquipment.filter(e => e.status === 'approved' && e.available).length;
    const renterCount = new Set(allEquipment.map(e => e.ownerId)).size;
    
    document.getElementById('online-count').textContent = onlineCount;
    document.getElementById('renter-count').textContent = renterCount;
}

// Load featured equipment
function loadFeaturedEquipment() {
    const featuredGrid = document.getElementById('featured-equipment');
    if (!featuredGrid) return;
    
    // Get approved and available equipment
    const featured = allEquipment
        .filter(item => item.status === 'approved' && item.available)
        .slice(0, 6);
    
    if (featured.length === 0) {
        featuredGrid.innerHTML = `
            <div class="no-results">
                <i data-lucide="construction"></i>
                <p>Популярной техники пока нет</p>
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

// Create equipment card
function createEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = 'equipment-card';
    
    const categoryIcon = getCategoryIcon(equipment.category);
    const categoryName = getCategoryName(equipment.category);
    const price = formatPriceForCard(equipment);
    
    div.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${categoryIcon}"></i>
        </div>
        <div class="equipment-content">
            <h3 class="equipment-title">${equipment.name || 'Без названия'}</h3>
            <p class="equipment-specs">${categoryName} • ${formatCapacity(equipment)}</p>
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

// Filter equipment by category
function filterEquipmentByCategory(category) {
    const featuredGrid = document.getElementById('featured-equipment');
    if (!featuredGrid) return;
    
    let filtered = [];
    
    if (category === 'all') {
        filtered = allEquipment
            .filter(item => item.status === 'approved' && item.available)
            .slice(0, 6);
    } else {
        const categoryMap = {
            'trucks': ['tonar', 'samosval'],
            'mixers': ['mixer'],
            'cranes': ['crane'],
            'excavators': ['excavator'],
            'pumps': ['pump']
        };
        
        const categories = categoryMap[category] || [category];
        
        filtered = allEquipment
            .filter(item => 
                item.status === 'approved' && 
                item.available && 
                categories.includes(item.category)
            )
            .slice(0, 6);
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
    
    if (lucide) lucide.createIcons();
}

// Search functionality
function performSearch(searchTerm) {
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;
    
    const clearSearchBtn = document.querySelector('.clear-search');
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
                (item.category && item.category.toLowerCase().includes(searchLower)) ||
                (item.location && item.location.toLowerCase().includes(searchLower)) ||
                (item.description && item.description.toLowerCase().includes(searchLower)) ||
                (item.owner && item.owner.name && item.owner.name.toLowerCase().includes(searchLower))
            );
        });
        
        displaySearchResults(filtered, searchTerm);
    }, 500);
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
                <button class="btn-secondary" onclick="navigateTo('add-equipment-page')">
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
    
    const categoryIcon = getCategoryIcon(equipment.category);
    const price = formatPriceForCard(equipment);
    
    div.innerHTML = `
        <div class="result-icon">
            <i data-lucide="${categoryIcon}"></i>
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

function clearSearch() {
    const searchInput = document.getElementById('main-search');
    const clearSearchBtn = document.querySelector('.clear-search');
    
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
    
    clearSearchResults();
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

// Show equipment details
function showEquipmentDetails(equipment) {
    currentEquipmentDetails = equipment;
    
    // Update page title
    const titleElement = document.getElementById('equipment-title');
    if (titleElement) {
        titleElement.textContent = equipment.name || 'Детали техники';
    }
    
    // Update equipment details
    document.getElementById('detail-equipment-name').textContent = equipment.name || 'Без названия';
    document.getElementById('detail-price').textContent = formatPriceForDetails(equipment);
    document.getElementById('spec-capacity').textContent = formatCapacity(equipment);
    document.getElementById('spec-location').textContent = equipment.location || 'Не указано';
    document.getElementById('spec-owner').textContent = equipment.owner?.name || 'Неизвестно';
    document.getElementById('spec-rating').textContent = equipment.owner?.rating || '5.0';
    document.getElementById('equipment-description-text').textContent = equipment.description || 'Описание отсутствует';
    
    // Update tags
    const tagsContainer = document.getElementById('equipment-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        
        const tags = [
            formatCapacity(equipment),
            equipment.available ? 'Доступен сейчас' : 'Недоступен',
            equipment.year && `Год: ${equipment.year}`,
            equipment.pricing?.unit || ''
        ].filter(tag => tag && tag !== 'Н/Д');
        
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            tagsContainer.appendChild(span);
        });
        
        if (tags.length === 0) {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = 'Информация отсутствует';
            tagsContainer.appendChild(span);
        }
    }
    
    navigateTo('details-page');
}

// Form validation and navigation
function validateStep1() {
    const category = document.getElementById('equipment-category').value;
    const model = document.getElementById('equipment-model').value.trim();
    const capacity = document.getElementById('equipment-capacity').value;
    
    if (!category) {
        showNotification('Выберите тип техники', 'error');
        return;
    }
    
    if (!model) {
        showNotification('Введите название модели', 'error');
        return;
    }
    
    if (!capacity || capacity <= 0) {
        showNotification('Введите корректную грузоподъемность', 'error');
        return;
    }
    
    nextStep(2);
}

function validateStep2() {
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
    
    nextStep(3);
}

function nextStep(stepNumber) {
    const currentStepEl = document.querySelector(`#step-${currentStep}`);
    const nextStepEl = document.querySelector(`#step-${stepNumber}`);
    
    if (currentStepEl) currentStepEl.classList.remove('active');
    if (nextStepEl) {
        nextStepEl.classList.add('active');
        currentStep = stepNumber;
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
    const capacity = document.getElementById('equipment-capacity').value;
    const year = document.getElementById('equipment-year').value;
    const location = document.getElementById('equipment-location').value.trim();
    const phone = document.getElementById('owner-phone').value.trim();
    const description = document.getElementById('equipment-description').value.trim();
    const minRental = document.getElementById('min-rental').value;
    
    // Validation
    if (!category || !model || !capacity || !location || !phone) {
        showNotification('Заполните все обязательные поля', 'error');
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
                name: `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`,
                phone: phone,
                rating: 5.0,
                reviews: 0
            },
            description: description || 'Описание отсутствует',
            available: true,
            status: 'pending',
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
    
    document.getElementById('my-equipment-count').textContent = totalCount;
    document.getElementById('my-active-count').textContent = activeCount;
    document.getElementById('my-pending-count').textContent = pendingCount;
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
            <h3 class="equipment-title">${equipment.name || 'Без названия'}</h3>
            <p class="equipment-specs">${categoryName} • ${equipment.location || 'Не указано'}</p>
            <div class="equipment-footer">
                <div class="equipment-price">${price}</div>
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
    
    div.addEventListener('click', () => {
        showEquipmentDetails(equipment);
    });
    
    return div;
}

// Edit equipment
function editEquipment(equipmentId) {
    const equipment = userEquipment.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    editingEquipmentId = equipmentId;
    
    // Update form title
    document.getElementById('add-equipment-title').textContent = 'Редактирование техники';
    document.getElementById('save-button-text').textContent = 'Обновить';
    
    // Fill form
    document.getElementById('equipment-category').value = equipment.category;
    document.getElementById('equipment-model').value = equipment.name;
    document.getElementById('equipment-capacity').value = equipment.capacity;
    document.getElementById('equipment-year').value = equipment.year || '';
    document.getElementById('equipment-location').value = equipment.location;
    document.getElementById('owner-phone').value = equipment.owner?.phone || '';
    document.getElementById('equipment-description').value = equipment.description || '';
    document.getElementById('min-rental').value = equipment.minRental || '8';
    
    // Update pricing
    updatePricingFields();
    
    // Fill pricing after a delay
    setTimeout(() => {
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
    
    // Reset form title
    document.getElementById('add-equipment-title').textContent = 'Новая техника';
    document.getElementById('save-button-text').textContent = 'Опубликовать';
    
    // Show step 1
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step-1').classList.add('active');
    
    // Reset form fields
    document.getElementById('equipment-category').value = '';
    document.getElementById('equipment-model').value = '';
    document.getElementById('equipment-capacity').value = '';
    document.getElementById('equipment-year').value = '';
    document.getElementById('equipment-location').value = '';
    document.getElementById('owner-phone').value = '';
    document.getElementById('equipment-description').value = '';
    document.getElementById('min-rental').value = '8';
    
    // Reset pricing
    updatePricingFields();
    
    // Reset upload
    const uploadArea = document.getElementById('upload-area');
    const preview = document.getElementById('upload-preview');
    
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i data-lucide="upload"></i>
            <p>Перетащите фото или нажмите для загрузки</p>
        `;
    }
    
    if (preview) {
        preview.innerHTML = '';
        preview.style.display = 'none';
    }
    
    const photoUpload = document.getElementById('photo-upload');
    if (photoUpload) photoUpload.value = '';
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
    
    if (equipmentList.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i data-lucide="check-circle"></i>
                <p>Нет заявок на модерацию</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    equipmentList.forEach(equipment => {
        const card = createAdminEquipmentCard(equipment);
        container.appendChild(card);
    });
    
    if (lucide) lucide.createIcons();
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
                    <h4>${equipment.name || 'Без названия'}</h4>
                    <p>${categoryName} • ${equipment.location || 'Не указано'}</p>
                </div>
            </div>
            <span class="badge-pending">На модерации</span>
        </div>
        <div class="admin-card-body">
            <p><strong>Владелец:</strong> ${equipment.owner?.name || 'Не указан'}</p>
            <p><strong>Телефон:</strong> ${equipment.owner?.phone || 'Не указан'}</p>
            <p><strong>Грузоподъемность:</strong> ${formatCapacity(equipment)}</p>
            <p><strong>Цена:</strong> ${formatPriceForDetails(equipment)}</p>
            <p><strong>Описание:</strong> ${(equipment.description || '').substring(0, 100)}${equipment.description && equipment.description.length > 100 ? '...' : ''}</p>
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

function refreshAdminData() {
    loadPendingEquipment();
    updateAdminStats();
    showNotification('Данные обновлены', 'success');
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
                        <button class="btn-secondary" onclick="sendTelegramMessage()">
                            <i data-lucide="message-square"></i>
                            <span>Написать в Telegram</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (lucide) lucide.createIcons();
}

function sendTelegramMessage() {
    const equipment = currentEquipmentDetails;
    const message = `Здравствуйте! Интересует ваша техника: ${equipment.name}. Можно уточнить детали?`;
    
    if (equipment.owner && equipment.owner.username) {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://t.me/${equipment.owner.username}?text=${encodedMessage}`, '_blank');
    } else {
        navigator.clipboard.writeText(message).then(() => {
            showNotification('Сообщение скопировано в буфер обмена', 'success');
        });
    }
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
                    <p><strong>${equipment.name || 'Техника'}</strong></p>
                    <p>${formatPriceForDetails(equipment)}</p>
                    
                    <div class="form-group">
                        <label class="form-label">Дата начала аренды</label>
                        <input type="date" id="rental-start-date" class="modern-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Продолжительность</label>
                        <select id="rental-duration" class="modern-select">
                            <option value="4">4 часа</option>
                            <option value="8" selected>Смена (8 часов)</option>
                            <option value="24">Сутки</option>
                            <option value="168">Неделя</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Дополнительные пожелания</label>
                        <textarea id="rental-notes" class="modern-textarea" placeholder="Укажите дополнительные требования..." rows="3"></textarea>
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
    if (lucide) lucide.createIcons();
}

function submitRentalRequest() {
    const equipment = currentEquipmentDetails;
    const startDate = document.getElementById('rental-start-date').value;
    const duration = document.getElementById('rental-duration').value;
    const notes = document.getElementById('rental-notes').value;
    
    if (!startDate) {
        showNotification('Выберите дату начала аренды', 'error');
        return;
    }
    
    // Calculate price
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
        } else if (equipment.pricing.pricePerUnit) {
            estimatedPrice = equipment.pricing.pricePerUnit;
        }
    }
    
    showNotification(`Заявка отправлена! Примерная стоимость: ${estimatedPrice.toLocaleString()} сум`, 'success');
    closeModal();
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// Calculate route
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
    
    const resultsDiv = document.getElementById('route-results');
    if (resultsDiv) {
        resultsDiv.classList.remove('hidden');
        setTimeout(() => {
            resultsDiv.style.opacity = '1';
            resultsDiv.style.transform = 'translateY(0)';
        }, 10);
    }
    
    showNotification('Маршрут рассчитан', 'success');
}

function showAvailableTrucks() {
    const from = document.getElementById('route-from')?.value.trim();
    const to = document.getElementById('route-to')?.value.trim();
    
    if (!from || !to) {
        showNotification('Укажите маршрут', 'error');
        return;
    }
    
    const availableTrucks = allEquipment.filter(item => 
        (item.category === 'tonar' || item.category === 'samosval') &&
        item.status === 'approved' &&
        item.available
    );
    
    if (availableTrucks.length === 0) {
        showNotification('Нет доступной техники на этом маршруте', 'info');
        return;
    }
    
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
                            <div class="truck-item" onclick="selectTruck('${truck.id}')">
                                <div class="truck-icon">
                                    <i data-lucide="truck"></i>
                                </div>
                                <div class="truck-info">
                                    <h4>${truck.name || 'Без названия'}</h4>
                                    <p>${truck.location || 'Не указано'} • ${formatPriceForCard(truck)}</p>
                                </div>
                                <button class="btn-small" onclick="event.stopPropagation(); selectTruck('${truck.id}')">Выбрать</button>
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

function selectTruck(truckId) {
    const truck = allEquipment.find(item => item.id === truckId);
    if (truck) {
        showEquipmentDetails(truck);
        closeModal();
    }
}

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
        priceText = `${basePrice.toLocaleString()} сум/м³ (до ${baseDistance} км)`;
        if (pricePerKm > 0) {
            priceText += ` + ${pricePerKm.toLocaleString()} сум/км`;
        }
    } else if (equipment.category === 'pump') {
        const pricePerHour = equipment.pricing.pricePerHour || 0;
        const minHours = equipment.pricing.minHours || 4;
        priceText = `${pricePerHour.toLocaleString()} сум/час (мин. ${minHours} часа)`;
    } else if (equipment.category === 'tonar' || equipment.category === 'samosval') {
        const pricePerUnit = equipment.pricing.pricePerUnit || 0;
        const pricePerKm = equipment.pricing.pricePerKm || 500;
        priceText = `${pricePerUnit.toLocaleString()} сум/м³ + ${pricePerKm.toLocaleString()} сум/км`;
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
    if (!equipment.capacity) return 'Н/Д';
    
    if (equipment.category === 'mixer') {
        return `${equipment.capacity} м³`;
    } else if (equipment.category === 'pump') {
        return `${equipment.capacity} м³/час`;
    } else {
        return `${equipment.capacity} т`;
    }
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

// Profile functions
function updateProfileStats() {
    document.getElementById('profile-equipment-count').textContent = userEquipment.length;
    document.getElementById('profile-orders-count').textContent = '0'; // Will be implemented
}

// Settings functions
function saveNotificationSettings() {
    const pushEnabled = document.getElementById('push-notifications')?.checked;
    const emailEnabled = document.getElementById('email-notifications')?.checked;
    
    // Save to localStorage or backend
    localStorage.setItem('pushNotifications', pushEnabled);
    localStorage.setItem('emailNotifications', emailEnabled);
    
    showNotification('Настройки сохранены', 'success');
}

function editProfile() {
    showNotification('Редактирование профиля в разработке', 'info');
}

function showSecurity() {
    showNotification('Настройки безопасности в разработке', 'info');
}

function showTerms() {
    showNotification('Условия использования в разработке', 'info');
}

// Logout
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        showNotification('Вы вышли из системы', 'success');
        setTimeout(() => {
            // In real app, clear auth state
            window.location.reload();
        }, 1000);
    }
}

// Additional UI functions
function showEquipmentStats() {
    const count = allEquipment.filter(e => e.status === 'approved' && e.available).length;
    showNotification(`Доступно ${count} единиц техники`, 'info');
}

function showRenterStats() {
    const count = new Set(allEquipment.map(e => e.ownerId)).size;
    showNotification(`${count} арендаторов в системе`, 'info');
}

function showAllCategories() {
    showNotification('Все категории загружены', 'info');
}

function showAllEquipment() {
    navigateTo('search-page');
}

function switchOrderTab(tab) {
    showNotification(`Вкладка ${tab} в разработке`, 'info');
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);