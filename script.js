// script.js
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
let currentCategory = '';
let currentUser = null;
let userEquipment = [];
let allEquipment = [];
let pageHistory = [];

// Admin IDs
const ADMIN_IDS = [543221724];

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

// Check if current user is admin
function isAdmin() {
    return currentUser && ADMIN_IDS.includes(parseInt(currentUser.uid));
}

// Initialize the application
async function init() {
    try {
        console.log('Initializing Telegram Web App...');
        
        // Initialize Telegram Web App
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Initialize icons
        lucide.createIcons();
        
        // Load user data from Telegram first
        await loadUserFromTelegram();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load equipment data (async, won't block)
        loadEquipmentData();
        
        // Add admin button if user is admin
        if (isAdmin()) {
            addAdminButton();
        }
        
        // Hide loading screen immediately after user is loaded
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            if (mainContent) {
                mainContent.classList.remove('hidden');
            }
            console.log('App initialized successfully');
        }, 500);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        // Always show main content even if there's an error
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
        showNotification('Ошибка загрузки приложения', 'error');
    }
}

// Add admin button to navigation
function addAdminButton() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav) return;
    
    const adminNavItem = document.createElement('div');
    adminNavItem.className = 'nav-item';
    adminNavItem.setAttribute('data-page', 'admin-panel');
    adminNavItem.innerHTML = `
        <div class="nav-icon">
            <i data-lucide="shield"></i>
        </div>
        <span>Админ</span>
    `;
    
    adminNavItem.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('admin-panel');
    });
    
    bottomNav.appendChild(adminNavItem);
}

// Load user data from Telegram
async function loadUserFromTelegram() {
    return new Promise((resolve) => {
        try {
            const initData = tg.initDataUnsafe;
            console.log('Telegram init data:', initData);
            
            if (initData && initData.user) {
                const tgUser = initData.user;
                currentUser = {
                    uid: tgUser.id.toString(),
                    firstName: tgUser.first_name,
                    lastName: tgUser.last_name || '',
                    username: tgUser.username || '',
                    photoUrl: tgUser.photo_url || '',
                    languageCode: tgUser.language_code || 'ru',
                    isPremium: tgUser.is_premium || false,
                    isAdmin: ADMIN_IDS.includes(tgUser.id)
                };
                
                console.log('User loaded from Telegram:', currentUser);
                updateUIForAuthenticatedUser();
            } else {
                // Если нет данных Telegram, создаем временного пользователя
                currentUser = {
                    uid: 'guest_' + Date.now(),
                    firstName: 'Гость',
                    lastName: '',
                    username: '',
                    photoUrl: '',
                    languageCode: 'ru',
                    isPremium: false,
                    isAdmin: false
                };
                console.log('Created guest user:', currentUser);
                updateUIForAuthenticatedUser();
            }
        } catch (error) {
            console.error('Error loading user from Telegram:', error);
            // Создаем временного пользователя при ошибке
            currentUser = {
                uid: 'error_guest_' + Date.now(),
                firstName: 'Гость',
                lastName: '',
                username: '',
                photoUrl: '',
                languageCode: 'ru',
                isPremium: false,
                isAdmin: false
            };
            updateUIForAuthenticatedUser();
        }
        resolve();
    });
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    const userNameElement = document.getElementById('user-name');
    const userPhoneElement = document.getElementById('user-phone');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const avatarFallback = document.querySelector('.avatar-fallback');
    
    if (userNameElement) {
        const displayName = currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : '');
        userNameElement.textContent = displayName;
    }
    
    if (userPhoneElement) {
        userPhoneElement.textContent = currentUser.phone || 'Номер не указан';
    }
    
    if (currentUser.photoUrl && userAvatarImg && avatarFallback) {
        userAvatarImg.src = currentUser.photoUrl;
        userAvatarImg.style.display = 'block';
        avatarFallback.style.display = 'none';
    }
    
    // Update user equipment
    userEquipment = allEquipment.filter(item => 
        item.ownerId === currentUser.uid && item.status === 'approved'
    );
    
    if (document.getElementById('profile-page')?.classList.contains('active')) {
        renderUserEquipment();
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
            const category = item.getAttribute('data-category');
            
            if (category) {
                currentCategory = category;
                loadCategoryEquipment(category);
                const categoryTitle = document.getElementById('category-title');
                if (categoryTitle) {
                    categoryTitle.textContent = getCategoryTitle(category);
                }
            }
            
            navigateTo(pageId);
            updateNavigation(item);
        });
    });

    // Category items
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.getAttribute('data-category');
            currentCategory = category;
            loadCategoryEquipment(category);
            const categoryTitle = document.getElementById('category-title');
            if (categoryTitle) {
                categoryTitle.textContent = getCategoryTitle(category);
            }
            navigateTo('category-page');
            updateNavigationForCategory(category);
        });
    });

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            goBack();
        });
    });

    // Profile actions
    const addEquipmentBtn = document.getElementById('add-equipment-btn');
    const toggleAvailabilityBtn = document.getElementById('toggle-availability-btn');
    const myEquipmentBtn = document.getElementById('my-equipment-btn');
    
    if (addEquipmentBtn) {
        addEquipmentBtn.addEventListener('click', () => {
            navigateTo('add-equipment-page');
        });
    }
    
    if (toggleAvailabilityBtn) {
        toggleAvailabilityBtn.addEventListener('click', () => {
            loadAvailabilityEquipment();
            navigateTo('availability-page');
        });
    }

    // Equipment form
    const saveEquipmentBtn = document.getElementById('save-equipment');
    const equipmentTypeSelect = document.getElementById('equipment-type');
    
    if (saveEquipmentBtn) {
        saveEquipmentBtn.addEventListener('click', saveEquipment);
    }
    
    if (equipmentTypeSelect) {
        equipmentTypeSelect.addEventListener('change', toggleFormFields);
    }
    
    // Phone input formatting
    const phoneInput = document.getElementById('user-phone-input');
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
    
    // Moderation page navigation
    if (myEquipmentBtn) {
        myEquipmentBtn.addEventListener('click', () => {
            navigateTo('moderation-page');
        });
    }
}

function formatPhoneNumber() {
    const input = document.getElementById('user-phone-input');
    if (!input) return;
    
    let value = input.value.replace(/\D/g, '');

    if (value.length > 9) value = value.substring(0, 9);

    if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, (_, p1, p2, p3, p4) => {
            return `${p1}-${p2}-${p3}-${p4}`;
        });
    }

    input.value = value;
}

// Navigation functions
function navigateTo(pageId) {
    console.log('Navigating to:', pageId);
    
    const currentActivePage = document.querySelector('.page.active');
    if (currentActivePage && currentActivePage.id !== pageId) {
        pageHistory.push(currentActivePage.id);
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId) {
            page.classList.add('active');
        }
    });

    if (pageId === 'profile-page') {
        renderUserEquipment();
        loadModerationStatus();
    } else if (pageId === 'category-page') {
        loadCategoryEquipment(currentCategory);
    } else if (pageId === 'moderation-page') {
        loadModerationStatus();
    } else if (pageId === 'admin-panel') {
        if (!isAdmin()) {
            showNotification('❌ У вас нет прав доступа к админ-панели', 'error');
            navigateTo('home-page');
            return;
        }
        loadAdminPanel();
    }

    setTimeout(() => lucide.createIcons(), 100);
}

function goBack() {
    if (pageHistory.length > 0) {
        const previousPageId = pageHistory.pop();
        navigateTo(previousPageId);
    } else {
        navigateTo('home-page');
    }
}

function updateNavigation(activeItem) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function updateNavigationForCategory(category) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-category') === category) {
            item.classList.add('active');
        }
    });
}

// Equipment functions
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
                
                if (currentUser) {
                    userEquipment = allEquipment.filter(item => 
                        item.ownerId === currentUser.uid && item.status === 'approved'
                    );
                }
            } else {
                allEquipment = [];
                console.log('No equipment data found');
            }
            
            setTimeout(() => lucide.createIcons(), 100);
        });
    } catch (error) {
        console.error('Error loading equipment data:', error);
        allEquipment = [];
    }
}

function loadCategoryEquipment(category) {
    console.log('Loading category equipment:', category);
    const filteredEquipment = allEquipment.filter(item => 
        item.category === category && item.status === 'approved' && item.available
    );
    
    const categoryEquipmentList = document.getElementById('category-equipment');
    if (!categoryEquipmentList) return;
    
    categoryEquipmentList.innerHTML = '';

    if (filteredEquipment.length === 0) {
        categoryEquipmentList.innerHTML = `
            <div class="no-data">
                <i data-lucide="construction"></i>
                <p>Техника в этой категории пока не добавлена</p>
            </div>
        `;
    } else {
        filteredEquipment.forEach(equipment => {
            const equipmentItem = createEquipmentCard(equipment);
            categoryEquipmentList.appendChild(equipmentItem);
        });
    }

    setTimeout(() => lucide.createIcons(), 100);
}

function createEquipmentCard(equipment) {
    const div = document.createElement('div');
    div.className = `equipment-item ${equipment.available ? 'available' : 'busy'} ${equipment.status || 'approved'}`;
    
    const icon = getEquipmentIcon(equipment.category);
    const statusText = getStatusText(equipment);
    
    div.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${icon}"></i>
        </div>
        <div class="equipment-info">
            <h3>${equipment.name}</h3>
            <div class="equipment-details">
                ${equipment.capacity ? `<div class="equipment-detail"><i data-lucide="box"></i> ${equipment.capacity} м³</div>` : ''}
                ${equipment.length ? `<div class="equipment-detail"><i data-lucide="ruler"></i> ${equipment.length} м</div>` : ''}
                ${equipment.weight ? `<div class="equipment-detail"><i data-lucide="weight"></i> ${equipment.weight} т</div>` : ''}
            </div>
            <div class="equipment-location">
                <i data-lucide="map-pin"></i>
                <span>${equipment.location}</span>
            </div>
            <div class="equipment-footer">
                <div class="equipment-price">${equipment.price} тыс. сум/час</div>
                <div class="equipment-status ${equipment.status || 'approved'} ${equipment.available ? 'available' : 'busy'}">${statusText}</div>
            </div>
        </div>
    `;
    
    if (equipment.status === 'approved') {
        div.addEventListener('click', () => {
            showEquipmentDetails(equipment);
        });
    }
    
    return div;
}

function getStatusText(equipment) {
    if (equipment.status === 'pending') return '⏳ На модерации';
    if (equipment.status === 'rejected') return '❌ Отклонено';
    return equipment.available ? '✅ Доступен' : '⏳ Занят';
}

function showEquipmentDetails(equipment) {
    console.log('Showing equipment details:', equipment.name);
    const equipmentTitle = document.getElementById('equipment-title');
    if (equipmentTitle) {
        equipmentTitle.textContent = equipment.name;
    }
    
    const statusText = getStatusText(equipment);
    
    const equipmentDetails = document.getElementById('equipment-details');
    if (!equipmentDetails) return;
    
    equipmentDetails.innerHTML = `
        <div class="detail-section">
            <div class="owner-info">
                <div class="owner-avatar">
                    <i data-lucide="user"></i>
                </div>
                <div class="owner-details">
                    <h4>${equipment.owner?.name || 'Владелец'}</h4>
                    <div class="equipment-rating">
                        <i data-lucide="star"></i>
                        <span>${equipment.owner?.rating || 5.0} (${equipment.owner?.reviews || 0} отзывов)</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Информация о технике</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Статус</span>
                    <span class="detail-value ${equipment.status || 'approved'}">${statusText}</span>
                </div>
                ${equipment.capacity ? `
                <div class="detail-item">
                    <span class="detail-label">Вместимость</span>
                    <span class="detail-value">${equipment.capacity} м³</span>
                </div>
                ` : ''}
                ${equipment.length ? `
                <div class="detail-item">
                    <span class="detail-label">Длина стрелы</span>
                    <span class="detail-value">${equipment.length} м</span>
                </div>
                ` : ''}
                ${equipment.performance ? `
                <div class="detail-item">
                    <span class="detail-label">Производительность</span>
                    <span class="detail-value">${equipment.performance} м³/ч</span>
                </div>
                ` : ''}
                ${equipment.weight ? `
                <div class="detail-item">
                    <span class="detail-label">Грузоподъемность</span>
                    <span class="detail-value">${equipment.weight} т</span>
                </div>
                ` : ''}
                <div class="detail-item">
                    <span class="detail-label">Цена</span>
                    <span class="detail-value">${equipment.price} тыс. сум/час</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Местоположение</span>
                    <span class="detail-value">${equipment.location}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Телефон владельца</span>
                    <span class="detail-value">${equipment.ownerPhone || 'Не указан'}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Описание</h3>
            <p>${equipment.description || 'Нет описания'}</p>
        </div>
        
        <div class="detail-section">
            <h3>Способы оплаты</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Наличные</span>
                    <span class="detail-value">${equipment.paymentMethods && equipment.paymentMethods.includes('cash') ? '✅' : '❌'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Безналичный расчет</span>
                    <span class="detail-value">${equipment.paymentMethods && equipment.paymentMethods.includes('transfer') ? '✅' : '❌'}</span>
                </div>
            </div>
        </div>
        
        <div class="contact-buttons">
            <button class="contact-btn phone" onclick="callOwner('${equipment.ownerPhone}')">
                <i data-lucide="phone"></i>
                Позвонить
            </button>
            <button class="contact-btn telegram" onclick="messageOwner('${equipment.ownerPhone}', '${equipment.name}')">
                <i data-lucide="message-circle"></i>
                Написать
            </button>
        </div>
    `;
    
    navigateTo('details-page');
    setTimeout(() => lucide.createIcons(), 100);
}

function renderUserEquipment() {
    console.log('Rendering user equipment');
    const userEquipmentList = document.getElementById('user-equipment');
    if (!userEquipmentList) return;
    
    userEquipmentList.innerHTML = '';
    
    if (!userEquipment.length) {
        userEquipmentList.innerHTML = `
            <div class="no-data">
                <i data-lucide="construction"></i>
                <p>У вас пока нет добавленной техники</p>
            </div>
        `;
        return;
    }
    
    userEquipment.forEach(equipment => {
        const equipmentItem = createEquipmentCard(equipment);
        userEquipmentList.appendChild(equipmentItem);
    });
}

function loadModerationStatus() {
    if (!currentUser) return;
    
    const userEquipmentAll = allEquipment.filter(item => item.ownerId === currentUser.uid);
    const pending = userEquipmentAll.filter(item => item.status === 'pending').length;
    const approved = userEquipmentAll.filter(item => item.status === 'approved').length;
    const rejected = userEquipmentAll.filter(item => item.status === 'rejected').length;
    
    const pendingCount = document.getElementById('pending-count');
    const approvedCount = document.getElementById('approved-count');
    const rejectedCount = document.getElementById('rejected-count');
    
    if (pendingCount) pendingCount.textContent = pending;
    if (approvedCount) approvedCount.textContent = approved;
    if (rejectedCount) rejectedCount.textContent = rejected;
    
    const moderationEquipmentList = document.getElementById('moderation-equipment');
    if (!moderationEquipmentList) return;
    
    moderationEquipmentList.innerHTML = '';
    
    if (userEquipmentAll.length === 0) {
        moderationEquipmentList.innerHTML = `
            <div class="no-data">
                <i data-lucide="construction"></i>
                <p>У вас пока нет добавленной техники</p>
            </div>
        `;
        return;
    }
    
    userEquipmentAll.forEach(equipment => {
        const div = document.createElement('div');
        div.className = `equipment-item ${equipment.status || 'pending'}`;
        
        const icon = getEquipmentIcon(equipment.category);
        const statusText = getStatusText(equipment);
        
        div.innerHTML = `
            <div class="equipment-image">
                <i data-lucide="${icon}"></i>
            </div>
            <div class="equipment-info">
                <h3>${equipment.name}</h3>
                <div class="equipment-location">
                    <i data-lucide="map-pin"></i>
                    <span>${equipment.location}</span>
                </div>
                <div class="equipment-footer">
                    <div class="equipment-price">${equipment.price} тыс. сум/час</div>
                    <div class="equipment-status ${equipment.status || 'pending'}">${statusText}</div>
                    ${equipment.status === 'rejected' ? `
                    <div class="rejection-reason">
                        <small>Причина: ${equipment.rejectionReason || 'Не указана'}</small>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        moderationEquipmentList.appendChild(div);
    });
}

function toggleFormFields() {
    const type = document.getElementById('equipment-type')?.value;
    if (!type) return;
    
    const capacityGroup = document.getElementById('capacity-group');
    const lengthGroup = document.getElementById('length-group');
    const performanceGroup = document.getElementById('performance-group');
    const weightGroup = document.getElementById('weight-group');
    const bucketGroup = document.getElementById('bucket-group');
    
    if (capacityGroup) capacityGroup.classList.add('hidden');
    if (lengthGroup) lengthGroup.classList.add('hidden');
    if (performanceGroup) performanceGroup.classList.add('hidden');
    if (weightGroup) weightGroup.classList.add('hidden');
    if (bucketGroup) bucketGroup.classList.add('hidden');
    
    switch (type) {
        case 'mixers':
            if (capacityGroup) capacityGroup.classList.remove('hidden');
            break;
        case 'pumps':
            if (lengthGroup) lengthGroup.classList.remove('hidden');
            if (performanceGroup) performanceGroup.classList.remove('hidden');
            break;
        case 'dump-trucks':
        case 'tonars':
        case 'cranes':
            if (weightGroup) weightGroup.classList.remove('hidden');
            break;
        case 'excavators':
            if (bucketGroup) bucketGroup.classList.remove('hidden');
            break;
    }
}

// ОСНОВНАЯ ФУНКЦИЯ СОХРАНЕНИЯ ТЕХНИКИ
async function saveEquipment() {
    console.log('Save equipment function called');
    
    if (!currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    // Получаем значения из формы
    const type = document.getElementById('equipment-type')?.value;
    const name = document.getElementById('equipment-name')?.value.trim();
    const price = document.getElementById('equipment-price')?.value;
    const location = document.getElementById('equipment-location')?.value.trim();
    const description = document.getElementById('equipment-description')?.value.trim();
    const paymentMethod = document.getElementById('payment-method')?.value;
    const userPhone = document.getElementById('user-phone-input')?.value.replace(/\D/g, '');

    console.log('Form values:', { type, name, price, location, description, paymentMethod, userPhone });

    // Валидация
    if (!type || !name || !price || !location || !userPhone || !description) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }

    if (userPhone.length !== 9) {
        showNotification('Введите номер из 9 цифр (без +998)', 'error');
        return;
    }
    
    try {
        // Создаем объект техники
        const newEquipment = {
            category: type,
            name: name,
            location: location,
            price: parseInt(price),
            available: true,
            ownerId: currentUser.uid,
            owner: {
                name: currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : ''),
                username: currentUser.username,
                rating: 5.0,
                reviews: 0
            },
            ownerPhone: '+998' + userPhone,
            paymentMethods: paymentMethod === 'both' ? ['cash', 'transfer'] : [paymentMethod],
            description: description,
            status: 'pending',
            createdAt: Date.now()
        };
        
        // Добавляем специфичные поля
        switch (type) {
            case 'mixers':
                const capacity = document.getElementById('equipment-capacity')?.value;
                if (capacity) newEquipment.capacity = parseInt(capacity);
                break;
            case 'pumps':
                const length = document.getElementById('equipment-length')?.value;
                const performance = document.getElementById('equipment-performance')?.value;
                if (length) newEquipment.length = parseInt(length);
                if (performance) newEquipment.performance = parseInt(performance);
                break;
            case 'dump-trucks':
            case 'tonars':
            case 'cranes':
                const weight = document.getElementById('equipment-weight')?.value;
                if (weight) newEquipment.weight = parseInt(weight);
                break;
            case 'excavators':
                const bucket = document.getElementById('equipment-bucket')?.value;
                if (bucket) newEquipment.bucket = parseFloat(bucket);
                break;
        }
        
        console.log('Saving equipment:', newEquipment);
        
        // Сохраняем в Firebase с автоматическим ID
        const equipmentRef = database.ref('equipment').push();
        const equipmentId = equipmentRef.key;
        newEquipment.id = equipmentId;
        
        await equipmentRef.set(newEquipment);
        
        showNotification('✅ Техника отправлена на модерацию!', 'success');
        
        // Возвращаемся на страницу профиля
        setTimeout(() => {
            navigateTo('profile-page');
            resetEquipmentForm();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving equipment:', error);
        showNotification('❌ Ошибка при добавлении техники: ' + error.message, 'error');
    }
}

function resetEquipmentForm() {
    const form = document.querySelector('.add-equipment-form');
    if (form) {
        form.reset();
    }
    toggleFormFields();
}

// Utility functions
function getCategoryTitle(category) {
    const titles = {
        'mixers': 'Автомиксеры',
        'pumps': 'Автобетононасосы',
        'dump-trucks': 'Самосвалы',
        'tonars': 'Тонары',
        'cranes': 'Краны',
        'excavators': 'Экскаваторы'
    };
    return titles[category] || 'Категория';
}

function getEquipmentIcon(category) {
    const icons = {
        'mixers': 'truck',
        'pumps': 'construction',
        'dump-trucks': 'truck',
        'tonars': 'truck',
        'cranes': 'crane',
        'excavators': 'hammer'
    };
    return icons[category] || 'construction';
}

function callOwner(phone) {
    if (!phone || phone === 'Не указан') {
        showNotification('❌ Номер телефона не указан', 'error');
        return;
    }
    window.open(`tel:${phone}`);
}

function messageOwner(phone, equipmentName) {
    if (!phone || phone === 'Не указан') {
        showNotification('❌ Номер телефона не указан', 'error');
        return;
    }
    const message = `Здравствуйте! Интересует ваша техника: ${equipmentName}`;
    window.open(`https://t.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
}

// Notification function
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Добавляем стили если их нет
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                border-left: 4px solid #7c3aed;
                max-width: 300px;
            }
            .notification-success { border-left-color: #10b981; }
            .notification-error { border-left-color: #ef4444; }
            .notification-info { border-left-color: #3b82f6; }
            .notification.show { transform: translateX(0); }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-content i { width: 20px; height: 20px; }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    // Обновляем иконки
    setTimeout(() => lucide.createIcons(), 100);
}

// Global functions for onclick handlers
window.callOwner = callOwner;
window.messageOwner = messageOwner;
window.saveEquipment = saveEquipment;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);