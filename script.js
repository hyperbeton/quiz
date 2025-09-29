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
const ADMIN_IDS = [543221724]; // ЗАМЕНИТЕ НА ВАШ ID

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
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    const displayName = currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : '');
    document.getElementById('user-name').textContent = displayName;
    document.getElementById('user-phone').textContent = currentUser.phone || 'Номер не указан';
    
    if (currentUser.photoUrl) {
        document.getElementById('user-avatar-img').src = currentUser.photoUrl;
        document.getElementById('user-avatar-img').style.display = 'block';
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
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            const category = item.getAttribute('data-category');
            
            if (category) {
                currentCategory = category;
                loadCategoryEquipment(category);
                document.getElementById('category-title').textContent = getCategoryTitle(category);
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
            document.getElementById('category-title').textContent = getCategoryTitle(category);
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
    document.getElementById('add-equipment-btn').addEventListener('click', () => {
        navigateTo('add-equipment-page');
    });
    
    document.getElementById('toggle-availability-btn').addEventListener('click', () => {
        loadAvailabilityEquipment();
        navigateTo('availability-page');
    });

    // Equipment form
    document.getElementById('save-equipment').addEventListener('click', saveEquipment);
    document.getElementById('equipment-type').addEventListener('change', toggleFormFields);
    
    // Phone input formatting
    document.getElementById('user-phone-input').addEventListener('input', formatPhoneNumber);
    
    // Moderation page navigation
    document.getElementById('my-equipment-btn').addEventListener('click', () => {
        navigateTo('moderation-page');
    });
}

function formatPhoneNumber() {
    const input = document.getElementById('user-phone-input');
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
    
    const categoryEquipmentList = document.getElementById('category-equipment');
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
    document.getElementById('equipment-title').textContent = equipment.name;
    
    const statusText = getStatusText(equipment);
    
    const equipmentDetails = document.getElementById('equipment-details');
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
    
    document.getElementById('pending-count').textContent = pending;
    document.getElementById('approved-count').textContent = approved;
    document.getElementById('rejected-count').textContent = rejected;
    
    const moderationEquipmentList = document.getElementById('moderation-equipment');
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
    const type = document.getElementById('equipment-type').value;
    
    document.getElementById('capacity-group').classList.add('hidden');
    document.getElementById('length-group').classList.add('hidden');
    document.getElementById('performance-group').classList.add('hidden');
    document.getElementById('weight-group').classList.add('hidden');
    document.getElementById('bucket-group').classList.add('hidden');
    
    switch (type) {
        case 'mixers':
            document.getElementById('capacity-group').classList.remove('hidden');
            break;
        case 'pumps':
            document.getElementById('length-group').classList.remove('hidden');
            document.getElementById('performance-group').classList.remove('hidden');
            break;
        case 'dump-trucks':
        case 'tonars':
        case 'cranes':
            document.getElementById('weight-group').classList.remove('hidden');
            break;
        case 'excavators':
            document.getElementById('bucket-group').classList.remove('hidden');
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
    const type = document.getElementById('equipment-type').value;
    const name = document.getElementById('equipment-name').value.trim();
    const price = document.getElementById('equipment-price').value;
    const location = document.getElementById('equipment-location').value.trim();
    const description = document.getElementById('equipment-description').value.trim();
    const paymentMethod = document.getElementById('payment-method').value;
    const userPhone = document.getElementById('user-phone-input').value.replace(/\D/g, '');

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
                const capacity = document.getElementById('equipment-capacity').value;
                if (capacity) newEquipment.capacity = parseInt(capacity);
                break;
            case 'pumps':
                const length = document.getElementById('equipment-length').value;
                const performance = document.getElementById('equipment-performance').value;
                if (length) newEquipment.length = parseInt(length);
                if (performance) newEquipment.performance = parseInt(performance);
                break;
            case 'dump-trucks':
            case 'tonars':
            case 'cranes':
                const weight = document.getElementById('equipment-weight').value;
                if (weight) newEquipment.weight = parseInt(weight);
                break;
            case 'excavators':
                const bucket = document.getElementById('equipment-bucket').value;
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
    document.querySelector('.add-equipment-form').reset();
    toggleFormFields();
}

// Admin Panel Functions
function loadAdminPanel() {
    console.log('Loading admin panel...');
    
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) {
        createAdminPanel();
    } else {
        renderAdminPanel();
    }
}

function createAdminPanel() {
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
        
        <div class="admin-content">
            <div class="admin-stats">
                <div class="stat-card pending">
                    <div class="stat-number stat-pending" id="stat-pending">0</div>
                    <div>На модерации</div>
                </div>
                <div class="stat-card approved">
                    <div class="stat-number stat-approved" id="stat-approved">0</div>
                    <div>Одобрено</div>
                </div>
                <div class="stat-card rejected">
                    <div class="stat-number stat-rejected" id="stat-rejected">0</div>
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
        </div>

        <!-- Equipment Details Modal -->
        <div id="equipment-modal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title">Детали заявки</h3>
                    <button class="close-modal" onclick="closeAdminModal()">×</button>
                </div>
                
                <div id="modal-content">
                    <!-- Детали заявки -->
                </div>
                
                <div class="moderation-controls" id="modal-controls">
                    <!-- Кнопки модерации -->
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('main').appendChild(adminPanel);
    
    // Add admin panel styles
    if (!document.querySelector('#admin-styles')) {
        const styles = document.createElement('style');
        styles.id = 'admin-styles';
        styles.textContent = `
            .admin-content { padding: 20px; }
            .admin-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .stat-card { background: white; padding: 20px 15px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-left: 4px solid #e2e8f0; }
            .stat-card.pending { border-left-color: #f59e0b; }
            .stat-card.approved { border-left-color: #10b981; }
            .stat-card.rejected { border-left-color: #ef4444; }
            .stat-number { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
            .stat-pending { color: #f59e0b; }
            .stat-approved { color: #10b981; }
            .stat-rejected { color: #ef4444; }
            .filter-tabs { display: flex; background: white; border-radius: 12px; padding: 5px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .tab-btn { flex: 1; padding: 12px; border: none; background: none; cursor: pointer; border-radius: 8px; transition: all 0.3s ease; font-weight: 500; }
            .tab-btn.active { background: #7c3aed; color: white; }
            .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
            .modal-content { background: white; padding: 25px; border-radius: 12px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
            .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
            .modal-title { font-size: 1.3rem; font-weight: 600; color: #1e293b; }
            .close-modal { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; padding: 5px; }
            .moderation-controls { display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap; }
            .btn { padding: 12px 20px; border: none; border-radius: 12px; font-size: 0.9rem; cursor: pointer; transition: all 0.3s ease; font-weight: 500; }
            .btn-approve { background: #10b981; color: white; }
            .btn-reject { background: #ef4444; color: white; }
            .rejection-reason { margin-top: 15px; width: 100%; }
            .rejection-reason textarea { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; resize: vertical; min-height: 80px; font-family: inherit; }
            .detail-row { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
            .detail-row:last-child { border-bottom: none; margin-bottom: 0; }
            .detail-row strong { color: #1e293b; display: block; margin-bottom: 5px; }
        `;
        document.head.appendChild(styles);
    }
    
    setupAdminEventListeners();
    renderAdminPanel();
}

function setupAdminEventListeners() {
    // Tab event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentAdminFilter = this.dataset.filter;
            renderAdminPanel();
        });
    });
    
    // Back button
    document.querySelector('#admin-panel .btn-back').addEventListener('click', (e) => {
        e.preventDefault();
        goBack();
    });
}

let currentAdminFilter = 'pending';

function renderAdminPanel() {
    console.log('Rendering admin panel with filter:', currentAdminFilter);
    
    // Update statistics
    const pending = allEquipment.filter(item => item.status === 'pending').length;
    const approved = allEquipment.filter(item => item.status === 'approved').length;
    const rejected = allEquipment.filter(item => item.status === 'rejected').length;
    
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-rejected').textContent = rejected;
    
    // Filter equipment
    const filteredEquipment = allEquipment.filter(item => {
        const itemStatus = item.status || 'pending';
        return itemStatus === currentAdminFilter;
    });
    
    const listElement = document.getElementById('admin-equipment-list');
    
    if (filteredEquipment.length === 0) {
        listElement.innerHTML = `
            <div class="no-data">
                <i data-lucide="inbox"></i>
                <p>Нет заявок со статусом "${getAdminStatusText(currentAdminFilter)}"</p>
            </div>
        `;
    } else {
        listElement.innerHTML = filteredEquipment.map(equipment => {
            const status = equipment.status || 'pending';
            const ownerName = equipment.owner?.name || 'Неизвестно';
            const ownerPhone = equipment.ownerPhone || 'Не указан';
            
            return `
                <div class="equipment-item ${status}" onclick="showAdminEquipmentDetails('${equipment.id}')">
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
                            <span class="equipment-type">${getCategoryName(equipment.category)}</span>
                        </div>
                        <div class="owner-info">
                            <i data-lucide="user"></i>
                            <span>${ownerName}</span>
                            <span style="color: #94a3b8;">•</span>
                            <span>${ownerPhone}</span>
                        </div>
                    </div>
                    <div class="equipment-status ${status}">
                        ${getAdminStatusBadge(status)}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    setTimeout(() => lucide.createIcons(), 100);
}

function showAdminEquipmentDetails(equipmentId) {
    const equipment = allEquipment.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    document.getElementById('modal-title').textContent = equipment.name;
    
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="equipment-details">
            <div class="detail-row">
                <strong>ID заявки:</strong> 
                <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${equipment.id}</span>
            </div>
            <div class="detail-row">
                <strong>Категория:</strong> ${getCategoryName(equipment.category)}
            </div>
            <div class="detail-row">
                <strong>Местоположение:</strong> ${equipment.location}
            </div>
            <div class="detail-row">
                <strong>Цена:</strong> ${equipment.price} тыс. сум/час
            </div>
            <div class="detail-row">
                <strong>Владелец:</strong> ${equipment.owner?.name || 'Неизвестно'}
            </div>
            <div class="detail-row">
                <strong>Телефон:</strong> ${equipment.ownerPhone || 'Не указан'}
            </div>
            <div class="detail-row">
                <strong>Статус:</strong> 
                <span class="equipment-status ${equipment.status || 'pending'}">${getAdminStatusBadge(equipment.status || 'pending')}</span>
            </div>
            <div class="detail-row">
                <strong>Описание:</strong> 
                <div style="margin-top: 5px; padding: 10px; background: #f1f5f9; border-radius: 6px;">
                    ${equipment.description || 'Нет описания'}
                </div>
            </div>
            ${equipment.rejectionReason ? `
            <div class="detail-row">
                <strong>Причина отклонения:</strong> 
                <div style="margin-top: 5px; padding: 10px; background: #fee2e2; border-radius: 6px; color: #dc2626;">
                    ${equipment.rejectionReason}
                </div>
            </div>
            ` : ''}
            ${equipment.capacity ? `
            <div class="detail-row">
                <strong>Вместимость:</strong> ${equipment.capacity} м³
            </div>
            ` : ''}
            ${equipment.length ? `
            <div class="detail-row">
                <strong>Длина стрелы:</strong> ${equipment.length} м
            </div>
            ` : ''}
            ${equipment.performance ? `
            <div class="detail-row">
                <strong>Производительность:</strong> ${equipment.performance} м³/ч
            </div>
            ` : ''}
            ${equipment.weight ? `
            <div class="detail-row">
                <strong>Грузоподъемность:</strong> ${equipment.weight} т
            </div>
            ` : ''}
            ${equipment.bucket ? `
            <div class="detail-row">
                <strong>Объем ковша:</strong> ${equipment.bucket} м³
            </div>
            ` : ''}
            <div class="detail-row">
                <strong>Дата создания:</strong> 
                ${new Date(equipment.createdAt).toLocaleString('ru-RU')}
            </div>
        </div>
    `;
    
    const modalControls = document.getElementById('modal-controls');
    if (equipment.status === 'pending') {
        modalControls.innerHTML = `
            <button class="btn btn-approve" onclick="approveEquipment('${equipment.id}')">
                ✅ Одобрить заявку
            </button>
            <button class="btn btn-reject" onclick="showAdminRejectionForm()">
                ❌ Отклонить заявку
            </button>
            <div class="rejection-reason" id="admin-rejection-form" style="display: none;">
                <textarea id="admin-rejection-reason" placeholder="Укажите причину отклонения заявки..."></textarea>
                <button class="btn btn-reject" onclick="rejectEquipment('${equipment.id}')" style="margin-top: 10px; width: 100%;">
                    📨 Отправить отклонение
                </button>
            </div>
        `;
    } else {
        modalControls.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 20px;">
                Заявка уже обработана
            </div>
        `;
    }
    
    document.getElementById('equipment-modal').classList.remove('hidden');
}

function closeAdminModal() {
    document.getElementById('equipment-modal').classList.add('hidden');
    document.getElementById('admin-rejection-form').style.display = 'none';
}

function showAdminRejectionForm() {
    document.getElementById('admin-rejection-form').style.display = 'block';
}

async function approveEquipment(equipmentId) {
    if (!confirm('Вы уверены, что хотите одобрить эту заявку?')) return;
    
    try {
        const equipmentRef = database.ref(`equipment/${equipmentId}`);
        await equipmentRef.update({
            status: 'approved',
            moderatedBy: currentUser.uid,
            moderatedAt: new Date().toISOString(),
            rejectionReason: null
        });
        
        showNotification('✅ Заявка одобрена!', 'success');
        closeAdminModal();
        renderAdminPanel();
    } catch (error) {
        console.error('Error approving equipment:', error);
        showNotification('❌ Ошибка при одобрении заявки: ' + error.message, 'error');
    }
}

async function rejectEquipment(equipmentId) {
    const reason = document.getElementById('admin-rejection-reason').value.trim();
    if (!reason) {
        showNotification('📝 Пожалуйста, укажите причину отклонения', 'error');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите отклонить эту заявку?')) return;
    
    try {
        const equipmentRef = database.ref(`equipment/${equipmentId}`);
        await equipmentRef.update({
            status: 'rejected',
            rejectionReason: reason,
            moderatedBy: currentUser.uid,
            moderatedAt: new Date().toISOString()
        });
        
        showNotification('❌ Заявка отклонена!', 'success');
        closeAdminModal();
        renderAdminPanel();
    } catch (error) {
        console.error('Error rejecting equipment:', error);
        showNotification('❌ Ошибка при отклонении заявки: ' + error.message, 'error');
    }
}

// Admin helper functions
function getAdminStatusText(status) {
    const statuses = {
        'pending': 'На модерации',
        'approved': 'Одобренные',
        'rejected': 'Отклоненные'
    };
    return statuses[status] || status;
}

function getAdminStatusBadge(status) {
    const badges = {
        'pending': '⏳ На модерации',
        'approved': '✅ Одобрено',
        'rejected': '❌ Отклонено'
    };
    return badges[status] || status;
}

function getCategoryName(category) {
    const categories = {
        'mixers': '🚛 Автомиксер',
        'pumps': '🏗️ Автобетононасос',
        'dump-trucks': '🚚 Самосвал',
        'tonars': '🛻 Тонар',
        'cranes': '🏗️ Кран',
        'excavators': '🔧 Экскаватор'
    };
    return categories[category] || '🚜 Другая техника';
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

function loadAvailabilityEquipment() {
    if (!currentUser) return;
    
    const userEquipmentAll = allEquipment.filter(item => item.ownerId === currentUser.uid && item.status === 'approved');
    const availabilityList = document.getElementById('availability-equipment');
    availabilityList.innerHTML = '';
    
    if (userEquipmentAll.length === 0) {
        availabilityList.innerHTML = `
            <div class="no-data">
                <i data-lucide="construction"></i>
                <p>У вас нет одобренной техники</p>
            </div>
        `;
        return;
    }
    
    userEquipmentAll.forEach(equipment => {
        const div = document.createElement('div');
        div.className = `equipment-item ${equipment.available ? 'available' : 'busy'}`;
        
        const icon = getEquipmentIcon(equipment.category);
        
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
                    <div class="equipment-status ${equipment.available ? 'available' : 'busy'}">
                        ${equipment.available ? '✅ Доступен' : '⏳ Занят'}
                    </div>
                </div>
            </div>
            <button class="toggle-availability-btn" onclick="toggleAvailability('${equipment.id}', ${!equipment.available})">
                ${equipment.available ? 'Сделать занятым' : 'Сделать доступным'}
            </button>
        `;
        
        availabilityList.appendChild(div);
    });
}

async function toggleAvailability(equipmentId, newAvailability) {
    try {
        const equipmentRef = database.ref(`equipment/${equipmentId}`);
        await equipmentRef.update({
            available: newAvailability
        });
        
        showNotification(newAvailability ? '✅ Техника теперь доступна' : '⏳ Техника отмечена как занятая', 'success');
        loadAvailabilityEquipment();
    } catch (error) {
        console.error('Error toggling availability:', error);
        showNotification('❌ Ошибка при изменении статуса', 'error');
    }
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
window.toggleAvailability = toggleAvailability;
window.showAdminEquipmentDetails = showAdminEquipmentDetails;
window.closeAdminModal = closeAdminModal;
window.showAdminRejectionForm = showAdminRejectionForm;
window.approveEquipment = approveEquipment;
window.rejectEquipment = rejectEquipment;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);