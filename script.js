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

// DOM elements
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const categoryItems = document.querySelectorAll('.category-item');
const categoryEquipmentList = document.getElementById('category-equipment');
const userEquipmentList = document.getElementById('user-equipment');
const availabilityEquipmentList = document.getElementById('availability-equipment');
const equipmentDetails = document.getElementById('equipment-details');
const categoryTitle = document.getElementById('category-title');
const equipmentTitle = document.getElementById('equipment-title');
const backButtons = document.querySelectorAll('.btn-back');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

// Profile elements
const userName = document.getElementById('user-name');
const userPhoneElement = document.getElementById('user-phone');
const userRatingValue = document.getElementById('user-rating-value');
const userAvatarImg = document.getElementById('user-avatar-img');
const addEquipmentBtn = document.getElementById('add-equipment-btn');
const toggleAvailabilityBtn = document.getElementById('toggle-availability-btn');
const saveEquipmentBtn = document.getElementById('save-equipment');
const equipmentTypeSelect = document.getElementById('equipment-type');

// Form field groups
const capacityGroup = document.getElementById('capacity-group');
const lengthGroup = document.getElementById('length-group');
const performanceGroup = document.getElementById('performance-group');
const weightGroup = document.getElementById('weight-group');
const bucketGroup = document.getElementById('bucket-group');

// Moderation elements
const pendingCount = document.getElementById('pending-count');
const approvedCount = document.getElementById('approved-count');
const rejectedCount = document.getElementById('rejected-count');
const moderationEquipmentList = document.getElementById('moderation-equipment');

// Admin IDs
const ADMIN_IDS = [543221724]; // Ваш ID Telegram

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
        
        // Setup event listeners
        setupEventListeners();
        
        // Load user data from Telegram
        await loadUserFromTelegram();
        
        // Load equipment data
        await loadEquipmentData();
        
        // Add admin button if user is admin
        if (isAdmin()) {
            addAdminButton();
        }
        
        // Hide loading screen and show main content
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            mainContent.classList.remove('hidden');
            console.log('App initialized successfully');
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        loadingScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');
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
    try {
        const initData = tg.initDataUnsafe;
        console.log('Telegram init data:', initData);
        
        if (initData.user) {
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
            
            // Save or load user from database
            await syncUserWithDatabase();
            
            // Update UI
            updateUIForAuthenticatedUser();
            
            console.log('User loaded from Telegram:', currentUser);
        } else {
            throw new Error('User data not available from Telegram');
        }
    } catch (error) {
        console.error('Error loading user from Telegram:', error);
        showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Sync user data with database
async function syncUserWithDatabase() {
    try {
        const userRef = database.ref('users/' + currentUser.uid);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            currentUser = { ...currentUser, ...userData };
            console.log('User data loaded from database');
        } else {
            // Create new user record
            await userRef.set({
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                username: currentUser.username,
                photoUrl: currentUser.photoUrl,
                languageCode: currentUser.languageCode,
                isPremium: currentUser.isPremium,
                isAdmin: currentUser.isAdmin,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                rating: 5.0,
                reviews: 0,
                lastLogin: firebase.database.ServerValue.TIMESTAMP,
                phone: ''
            });
            console.log('New user created in database');
        }
    } catch (error) {
        console.error('Error syncing user with database:', error);
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    const displayName = currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : '');
    userName.textContent = displayName;
    userPhoneElement.textContent = currentUser.phone || 'Номер не указан';
    userRatingValue.textContent = `${currentUser.rating || 5.0} (${currentUser.reviews || 0} отзывов)`;
    
    if (currentUser.photoUrl) {
        userAvatarImg.src = currentUser.photoUrl;
        userAvatarImg.style.display = 'block';
        document.querySelector('.avatar-fallback').style.display = 'none';
    }
    
    userEquipment = allEquipment.filter(item => 
        item.ownerId === currentUser.uid && item.status === 'approved'
    );
    
    if (document.getElementById('profile-page').classList.contains('active')) {
        renderUserEquipment();
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            const category = item.getAttribute('data-category');
            
            if (category) {
                currentCategory = category;
                loadCategoryEquipment(category);
                if (categoryTitle) categoryTitle.textContent = getCategoryTitle(category);
            }
            
            navigateTo(pageId);
            updateNavigation(item);
        });
    });

    // Category items
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.getAttribute('data-category');
            currentCategory = category;
            loadCategoryEquipment(category);
            if (categoryTitle) categoryTitle.textContent = getCategoryTitle(category);
            navigateTo('category-page');
            updateNavigationForCategory(category);
        });
    });

    // Back buttons
    backButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            goBack();
        });
    });

    // Profile actions
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
    const myEquipmentBtn = document.getElementById('my-equipment-btn');
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

    // оставляем только 9 цифр
    if (value.length > 9) value = value.substring(0, 9);

    // формат отображения: 90-123-45-67
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

    pages.forEach(page => {
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
    console.log('Going back, history:', pageHistory);
    
    if (pageHistory.length > 0) {
        const previousPageId = pageHistory.pop();
        navigateTo(previousPageId);
    } else {
        navigateTo('home-page');
    }
}

function updateNavigation(activeItem) {
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function updateNavigationForCategory(category) {
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-category') === category) {
            item.classList.add('active');
        }
    });
}

// Equipment functions
async function loadEquipmentData() {
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
                <div class="equipment-rating">
                    <i data-lucide="star"></i>
                    <span>${equipment.owner?.rating || 5.0}</span>
                </div>
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
    if (equipmentTitle) equipmentTitle.textContent = equipment.name;
    
    const statusText = getStatusText(equipment);
    
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

function loadAvailabilityEquipment() {
    console.log('Loading availability equipment');
    if (!availabilityEquipmentList) return;
    
    availabilityEquipmentList.innerHTML = '';
    
    if (!userEquipment.length) {
        availabilityEquipmentList.innerHTML = `
            <div class="no-data">
                <i data-lucide="construction"></i>
                <p>У вас пока нет добавленной техники</p>
            </div>
        `;
        return;
    }
    
    userEquipment.forEach(equipment => {
        const div = document.createElement('div');
        div.className = `equipment-item ${equipment.available ? 'available' : 'busy'}`;
        
        const icon = getEquipmentIcon(equipment.category);
        const statusText = equipment.available ? '✅ Доступен' : '⏳ Занят';
        
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
                    <div class="equipment-status ${equipment.available ? 'available' : 'busy'}">${statusText}</div>
                    <button class="toggle-availability-btn" onclick="toggleEquipmentAvailability('${equipment.id}')">
                        ${equipment.available ? 'Сделать занятым' : 'Сделать доступным'}
                    </button>
                </div>
            </div>
        `;
        
        availabilityEquipmentList.appendChild(div);
    });
    
    setTimeout(() => lucide.createIcons(), 100);
}

function loadModerationStatus() {
    if (!currentUser) return;
    
    const userEquipmentAll = allEquipment.filter(item => item.ownerId === currentUser.uid);
    const pending = userEquipmentAll.filter(item => item.status === 'pending').length;
    const approved = userEquipmentAll.filter(item => item.status === 'approved').length;
    const rejected = userEquipmentAll.filter(item => item.status === 'rejected').length;
    
    if (pendingCount) pendingCount.textContent = pending;
    if (approvedCount) approvedCount.textContent = approved;
    if (rejectedCount) rejectedCount.textContent = rejected;
    
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

// Admin Panel Functions
function loadAdminPanel() {
    const adminPage = document.getElementById('admin-panel');
    if (!adminPage) {
        createAdminPanel();
        return;
    }
    
    renderAdminPanel();
}

function createAdminPanel() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    const adminPanel = document.createElement('section');
    adminPanel.id = 'admin-panel';
    adminPanel.className = 'page';
    adminPanel.innerHTML = `
        <div class="page-header">
            <button class="btn-back">
                <i data-lucide="arrow-left"></i>
            </button>
            <h2>👑 Панель модерации</h2>
        </div>
        
        <div class="admin-stats">
            <div class="stat-card pending">
                <div class="stat-number stat-pending" id="admin-pending-count">0</div>
                <div>На модерации</div>
            </div>
            <div class="stat-card approved">
                <div class="stat-number stat-approved" id="admin-approved-count">0</div>
                <div>Одобрено</div>
            </div>
            <div class="stat-card rejected">
                <div class="stat-number stat-rejected" id="admin-rejected-count">0</div>
                <div>Отклонено</div>
            </div>
        </div>
        
        <div class="filter-tabs">
            <button class="tab-btn active" data-filter="pending">⏳ На модерации</button>
            <button class="tab-btn" data-filter="approved">✅ Одобренные</button>
            <button class="tab-btn" data-filter="rejected">❌ Отклоненные</button>
        </div>
        
        <div class="equipment-list" id="admin-equipment-list">
            <!-- Заявки будут загружаться здесь -->
        </div>
        
        <!-- Modal for equipment details -->
        <div id="admin-modal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="admin-modal-title">Детали заявки</h3>
                    <button class="close-modal" onclick="closeAdminModal()">×</button>
                </div>
                <div id="admin-modal-body"></div>
                <div class="modal-actions" id="admin-modal-actions"></div>
            </div>
        </div>
    `;
    
    mainContent.appendChild(adminPanel);
    
    // Add styles for admin panel
    if (!document.querySelector('#admin-styles')) {
        const styles = document.createElement('style');
        styles.id = 'admin-styles';
        styles.textContent = `
            .admin-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .stat-card {
                background: var(--surface-light);
                padding: 20px;
                border-radius: var(--border-radius);
                text-align: center;
                box-shadow: var(--shadow);
                border-left: 4px solid var(--border-color);
            }
            
            .stat-card.pending { border-left-color: var(--warning-color); }
            .stat-card.approved { border-left-color: var(--success-color); }
            .stat-card.rejected { border-left-color: var(--danger-color); }
            
            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .stat-pending { color: var(--warning-color); }
            .stat-approved { color: var(--success-color); }
            .stat-rejected { color: var(--danger-color); }
            
            .filter-tabs {
                display: flex;
                background: var(--surface-light);
                border-radius: var(--border-radius);
                padding: 5px;
                margin-bottom: 20px;
            }
            
            .tab-btn {
                flex: 1;
                padding: 10px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 6px;
                transition: var(--transition);
            }
            
            .tab-btn.active {
                background: var(--primary-color);
                color: white;
            }
            
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 20px;
            }
            
            .modal-content {
                background: white;
                padding: 20px;
                border-radius: var(--border-radius);
                max-width: 500px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
            }
            
            .modal-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .admin-btn {
                padding: 10px 15px;
                border: none;
                border-radius: var(--border-radius);
                cursor: pointer;
                flex: 1;
            }
            
            .btn-approve {
                background: var(--success-color);
                color: white;
            }
            
            .btn-reject {
                background: var(--danger-color);
                color: white;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add event listeners
    setTimeout(() => {
        const backBtn = adminPanel.querySelector('.btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                goBack();
            });
        }
        
        const tabBtns = adminPanel.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                renderAdminEquipmentList(this.dataset.filter);
            });
        });
    }, 100);
    
    renderAdminPanel();
}

function renderAdminPanel() {
    const pending = allEquipment.filter(item => item.status === 'pending').length;
    const approved = allEquipment.filter(item => item.status === 'approved').length;
    const rejected = allEquipment.filter(item => item.status === 'rejected').length;
    
    const pendingCountElem = document.getElementById('admin-pending-count');
    const approvedCountElem = document.getElementById('admin-approved-count');
    const rejectedCountElem = document.getElementById('admin-rejected-count');
    
    if (pendingCountElem) pendingCountElem.textContent = pending;
    if (approvedCountElem) approvedCountElem.textContent = approved;
    if (rejectedCountElem) rejectedCountElem.textContent = rejected;
    
    renderAdminEquipmentList('pending');
}

function renderAdminEquipmentList(filter) {
    const listElement = document.getElementById('admin-equipment-list');
    if (!listElement) return;
    
    const filteredEquipment = allEquipment.filter(item => item.status === filter);
    
    if (filteredEquipment.length === 0) {
        listElement.innerHTML = `
            <div class="no-data">
                <i data-lucide="inbox"></i>
                <p>Нет заявок со статусом "${getStatusText({status: filter})}"</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    listElement.innerHTML = filteredEquipment.map(equipment => `
        <div class="equipment-item ${equipment.status}" onclick="showAdminEquipmentDetails('${equipment.id}')">
            <div class="equipment-image">
                <i data-lucide="${getEquipmentIcon(equipment.category)}"></i>
            </div>
            <div class="equipment-info">
                <h3>${equipment.name}</h3>
                <div class="equipment-location">
                    <i data-lucide="map-pin"></i>
                    <span>${equipment.location}</span>
                </div>
                <div class="equipment-meta">
                    <span class="equipment-price">${equipment.price} тыс. сум/час</span>
                    <span class="owner-name">👤 ${equipment.owner?.name || 'Неизвестно'}</span>
                </div>
            </div>
            <div class="equipment-status ${equipment.status}">
                ${getStatusText(equipment)}
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function showAdminEquipmentDetails(equipmentId) {
    const equipment = allEquipment.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    const modal = document.getElementById('admin-modal');
    const modalTitle = document.getElementById('admin-modal-title');
    const modalBody = document.getElementById('admin-modal-body');
    const modalActions = document.getElementById('admin-modal-actions');
    
    if (!modal || !modalTitle || !modalBody || !modalActions) return;
    
    modalTitle.textContent = equipment.name;
    
    modalBody.innerHTML = `
        <div class="equipment-details">
            <p><strong>Категория:</strong> ${getCategoryTitle(equipment.category)}</p>
            <p><strong>Местоположение:</strong> ${equipment.location}</p>
            <p><strong>Цена:</strong> ${equipment.price} тыс. сум/час</p>
            <p><strong>Владелец:</strong> ${equipment.owner?.name || 'Неизвестно'}</p>
            <p><strong>Телефон:</strong> ${equipment.ownerPhone || 'Не указан'}</p>
            <p><strong>Описание:</strong> ${equipment.description || 'Нет описания'}</p>
            ${equipment.capacity ? `<p><strong>Вместимость:</strong> ${equipment.capacity} м³</p>` : ''}
            ${equipment.length ? `<p><strong>Длина стрелы:</strong> ${equipment.length} м</p>` : ''}
            ${equipment.performance ? `<p><strong>Производительность:</strong> ${equipment.performance} м³/ч</p>` : ''}
            ${equipment.weight ? `<p><strong>Грузоподъемность:</strong> ${equipment.weight} т</p>` : ''}
            ${equipment.bucket ? `<p><strong>Объем ковша:</strong> ${equipment.bucket} м³</p>` : ''}
            ${equipment.rejectionReason ? `<p><strong>Причина отклонения:</strong> ${equipment.rejectionReason}</p>` : ''}
        </div>
    `;
    
    if (equipment.status === 'pending') {
        modalActions.innerHTML = `
            <button class="admin-btn btn-approve" onclick="approveEquipment('${equipment.id}')">✅ Одобрить</button>
            <button class="admin-btn btn-reject" onclick="showRejectionForm('${equipment.id}')">❌ Отклонить</button>
        `;
    } else {
        modalActions.innerHTML = `
            <button class="admin-btn" onclick="closeAdminModal()">Закрыть</button>
        `;
    }
    
    modal.classList.remove('hidden');
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function approveEquipment(equipmentId) {
    if (!confirm('Одобрить эту заявку?')) return;
    
    const equipmentRef = database.ref('equipment/' + equipmentId);
    equipmentRef.update({
        status: 'approved',
        moderatedBy: currentUser.uid,
        moderatedAt: new Date().toISOString(),
        rejectionReason: null
    }).then(() => {
        showNotification('✅ Заявка одобрена', 'success');
        closeAdminModal();
    }).catch(error => {
        showNotification('❌ Ошибка: ' + error.message, 'error');
    });
}

function showRejectionForm(equipmentId) {
    const reason = prompt('Укажите причину отклонения:');
    if (reason === null) return;
    
    if (!reason.trim()) {
        showNotification('❌ Укажите причину отклонения', 'error');
        return;
    }
    
    rejectEquipment(equipmentId, reason.trim());
}

function rejectEquipment(equipmentId, reason) {
    const equipmentRef = database.ref('equipment/' + equipmentId);
    equipmentRef.update({
        status: 'rejected',
        rejectionReason: reason,
        moderatedBy: currentUser.uid,
        moderatedAt: new Date().toISOString()
    }).then(() => {
        showNotification('❌ Заявка отклонена', 'success');
        closeAdminModal();
    }).catch(error => {
        showNotification('❌ Ошибка: ' + error.message, 'error');
    });
}

function toggleFormFields() {
    const type = equipmentTypeSelect.value;
    console.log('Toggling form fields for type:', type);
    
    const groups = [capacityGroup, lengthGroup, performanceGroup, weightGroup, bucketGroup];
    groups.forEach(group => {
        if (group) group.classList.add('hidden');
    });
    
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
    const type = equipmentTypeSelect.value;
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
                rating: currentUser.rating || 5.0,
                reviews: currentUser.reviews || 0
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
        
        // Обновляем телефон пользователя
        if (!currentUser.phone) {
            const userRef = database.ref('users/' + currentUser.uid + '/phone');
            await userRef.set('+998' + userPhone);
            currentUser.phone = '+998' + userPhone;
            if (userPhoneElement) userPhoneElement.textContent = currentUser.phone;
        }
        
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

async function toggleEquipmentAvailability(equipmentId) {
    try {
        const equipment = allEquipment.find(item => item.id === equipmentId);
        if (equipment && equipment.status === 'approved') {
            const newAvailability = !equipment.available;
            
            const equipmentRef = database.ref('equipment/' + equipmentId + '/available');
            await equipmentRef.set(newAvailability);
            
            // Обновляем локальные данные
            equipment.available = newAvailability;
            userEquipment = allEquipment.filter(item => 
                item.ownerId === currentUser.uid && item.status === 'approved'
            );
            
            loadAvailabilityEquipment();
            
            showNotification(`✅ Статус техники изменен на ${newAvailability ? 'доступен' : 'занят'}`, 'success');
        }
    } catch (error) {
        console.error('Error toggling availability:', error);
        showNotification('❌ Ошибка при изменении статуса', 'error');
    }
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
    console.log('Calling owner:', phone);
    window.open(`tel:${phone}`);
}

function messageOwner(phone, equipmentName) {
    if (!phone || phone === 'Не указан') {
        showNotification('❌ Номер телефона не указан', 'error');
        return;
    }
    console.log('Messaging owner:', phone, equipmentName);
    const message = `Здравствуйте! Интересует ваша техника: ${equipmentName}`;
    window.open(`https://t.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
}

// Notification function
function showNotification(message, type = 'info') {
    console.log('Showing notification:', message, type);
    
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
window.toggleEquipmentAvailability = toggleEquipmentAvailability;
window.saveEquipment = saveEquipment;
window.closeAdminModal = closeAdminModal;
window.showAdminEquipmentDetails = showAdminEquipmentDetails;
window.approveEquipment = approveEquipment;
window.showRejectionForm = showRejectionForm;
window.rejectEquipment = rejectEquipment;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);