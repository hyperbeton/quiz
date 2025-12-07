// Firebase configuration (используйте свои настройки)
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
        photoUrl: '',
        isPremium: false
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
                isPremium: tgUser.is_premium || false
            };
            
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
    
    if (currentUser) {
        const displayName = currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : '');
        const greeting = getTimeBasedGreeting();
        
        if (profileName) profileName.textContent = displayName;
        if (userGreeting) userGreeting.textContent = greeting + ', ' + currentUser.firstName;
        
        if (currentUser.photoUrl && profileAvatar) {
            profileAvatar.src = currentUser.photoUrl;
            profileAvatar.style.display = 'block';
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

    // Filter chips
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

    // Form step navigation
    window.nextStep = function(next) {
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

// Load featured equipment
function loadFeaturedEquipment() {
    const featuredGrid = document.getElementById('featured-equipment');
    if (!featuredGrid) return;
    
    // Filter approved and available equipment
    const featured = allEquipment
        .filter(item => item.status === 'approved' && item.available)
        .slice(0, 4); // Show 4 featured items
    
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

// Create equipment card
function createEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = 'equipment-card';
    
    const categoryIcon = getCategoryIcon(equipment.category);
    const categoryName = getCategoryName(equipment.category);
    const price = formatPrice(equipment.price, equipment.category);
    
    div.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${categoryIcon}"></i>
            <div class="equipment-badge">TOP</div>
        </div>
        <div class="equipment-content">
            <h3 class="equipment-title">${equipment.name}</h3>
            <p class="equipment-specs">${categoryName} • ${equipment.capacity || equipment.weight || ''}${equipment.capacity ? 'т' : equipment.weight ? 'т' : ''}</p>
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
            .slice(0, 4);
    } else {
        filtered = allEquipment
            .filter(item => 
                item.status === 'approved' && 
                item.available && 
                (item.category === category || 
                 (category === 'trucks' && (item.category === 'tonar' || item.category === 'dump-trucks')))
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
            if (filter === 'тонары' || filter === 'самосвалы') {
                return item.category === 'tonar' || item.category === 'dump-trucks';
            }
            if (filter === 'миксеры') return item.category === 'mixer';
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
    const price = formatPrice(equipment.price, equipment.category);
    
    div.innerHTML = `
        <div class="result-icon">
            <i data-lucide="${categoryIcon}"></i>
        </div>
        <div class="result-content">
            <h3>${equipment.name}</h3>
            <p class="result-location">${equipment.location}</p>
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
    document.getElementById('detail-price').textContent = formatPrice(equipment.price, equipment.category);
    document.getElementById('spec-capacity').textContent = equipment.capacity ? equipment.capacity + 'т' : equipment.weight ? equipment.weight + 'т' : 'Н/Д';
    document.getElementById('spec-location').textContent = equipment.location;
    document.getElementById('spec-owner').textContent = equipment.owner?.name || 'Неизвестно';
    document.getElementById('spec-rating').textContent = equipment.owner?.rating || '5.0';
    document.getElementById('equipment-description-text').textContent = equipment.description || 'Описание отсутствует';
    
    // Update tags
    const tagsContainer = document.getElementById('equipment-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        
        const tags = [
            equipment.capacity && `Грузоподъемность: ${equipment.capacity}т`,
            equipment.available && 'Доступен сейчас',
            equipment.paymentMethods?.includes('cash') && 'Наличные',
            equipment.paymentMethods?.includes('transfer') && 'Безналичные',
            'Страховка',
            'GPS-трекер'
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
        (item.category === 'tonar' || item.category === 'dump-trucks') &&
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
                            <div class="truck-item" onclick="selectTruck('${truck.id}')">
                                <div class="truck-icon">
                                    <i data-lucide="truck"></i>
                                </div>
                                <div class="truck-info">
                                    <h4>${truck.name}</h4>
                                    <p>${truck.location} • ${formatPrice(truck.price, truck.category)}</p>
                                </div>
                                <button class="btn-small">Выбрать</button>
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
    const priceShift = document.getElementById('price-shift')?.value;
    const priceHour = document.getElementById('price-hour')?.value;
    const minRental = document.getElementById('min-rental')?.value;
    const phone = document.getElementById('owner-phone')?.value.trim();
    const description = document.getElementById('equipment-description')?.value.trim();
    
    // Validation
    if (!category || !model || !location || !phone || !description) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    if (!phone.match(/^\+998\s\d{2}\s\d{3}\s\d{2}\s\d{2}$/)) {
        showNotification('Введите корректный номер телефона', 'error');
        return;
    }
    
    try {
        // Create equipment object
        const newEquipment = {
            category: category,
            name: model,
            capacity: capacity ? parseInt(capacity) : null,
            year: year ? parseInt(year) : null,
            location: location,
            price: priceHour ? parseInt(priceHour) : 0,
            priceShift: priceShift ? parseInt(priceShift) : null,
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
            features: ['Страховка', 'GPS', 'Документы']
        };
        
        console.log('Saving equipment:', newEquipment);
        
        // Save to Firebase
        const equipmentRef = database.ref('equipment').push();
        const equipmentId = equipmentRef.key;
        newEquipment.id = equipmentId;
        
        await equipmentRef.set(newEquipment);
        
        showNotification('✅ Техника отправлена на модерацию', 'success');
        
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

function resetForm() {
    currentStep = 1;
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step-1').classList.add('active');
    
    // Reset form fields
    document.querySelectorAll('.modern-input, .modern-select, .modern-textarea').forEach(input => {
        if (input.type !== 'file') {
            input.value = '';
        }
    });
    
    // Reset upload area
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i data-lucide="upload"></i>
            <p>Перетащите фото или нажмите для загрузки</p>
        `;
    }
}

// Contact owner
window.contactOwner = function() {
    showNotification('Функция связи скоро будет доступна', 'info');
};

// Request rent
window.requestRent = function() {
    showNotification('Функция бронирования скоро будет доступна', 'info');
};

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
        'dump-trucks': 'truck',
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
        'dump-trucks': 'Самосвал',
        'mixer': 'Миксер',
        'crane': 'Кран',
        'excavator': 'Экскаватор',
        'pump': 'Насос'
    };
    return names[category] || 'Техника';
}

function formatPrice(price, category) {
    if (category === 'tonar' || category === 'dump-trucks') {
        return `${price.toLocaleString()} сум/рейс`;
    }
    return `${price.toLocaleString()} сум/час`;
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
    
    // Add styles for notification
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-left: 4px solid var(--primary);
                max-width: 280px;
            }
            .notification-success { border-left-color: var(--success); }
            .notification-error { border-left-color: var(--error); }
            .notification-warning { border-left-color: var(--warning); }
            .notification-info { border-left-color: var(--info); }
            .notification-toast.show {
                transform: translateX(0);
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-content i {
                width: 18px;
                height: 18px;
            }
        `;
        document.head.appendChild(styles);
    }
    
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