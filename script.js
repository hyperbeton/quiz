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
        
        // Setup notification listener
        setupNotificationListener();
        
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
                isPremium: tgUser.is_premium || false
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

// Setup notification listener for moderation results
function setupNotificationListener() {
    if (!currentUser) return;
    
    const notificationsRef = database.ref('notifications/' + currentUser.uid);
    
    notificationsRef.on('child_added', (snapshot) => {
        const notification = snapshot.val();
        handleModerationNotification(notification);
        
        // Remove notification after processing
        snapshot.ref.remove();
    });
}

// Handle moderation notifications
function handleModerationNotification(notification) {
    const equipmentId = notification.equipmentId;
    const status = notification.status;
    const reason = notification.reason;
    
    const equipment = allEquipment.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    if (status === 'approved') {
        showNotification(`✅ Ваша техника "${equipment.name}" одобрена и теперь видна другим пользователям!`, 'success');
        
        // Reload equipment data to reflect changes
        loadEquipmentData();
        
    } else if (status === 'rejected') {
        showNotification(`❌ Техника "${equipment.name}" отклонена. Причина: ${reason || 'не указана'}`, 'error');
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
                categoryTitle.textContent = getCategoryTitle(category);
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
            categoryTitle.textContent = getCategoryTitle(category);
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
    addEquipmentBtn.addEventListener('click', () => {
        navigateTo('add-equipment-page');
    });
    
    toggleAvailabilityBtn.addEventListener('click', () => {
        loadAvailabilityEquipment();
        navigateTo('availability-page');
    });

    // Equipment form
    saveEquipmentBtn.addEventListener('click', saveEquipment);
    equipmentTypeSelect.addEventListener('change', toggleFormFields);
    
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
                }));
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
    equipmentTitle.textContent = equipment.name;
    
    const statusText = getStatusText(equipment);
    
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
            <p>${equipment.description}</p>
        </div>
        
        <div class="detail-section">
            <h3>Способы оплаты</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Наличные</span>
                    <span class="detail-value">${equipment.paymentMethods.includes('cash') ? '✅' : '❌'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Безналичный расчет</span>
                    <span class="detail-value">${equipment.paymentMethods.includes('transfer') ? '✅' : '❌'}</span>
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
    
    pendingCount.textContent = pending;
    approvedCount.textContent = approved;
    rejectedCount.textContent = rejected;
    
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
    const type = equipmentTypeSelect.value;
    console.log('Toggling form fields for type:', type);
    
    [capacityGroup, lengthGroup, performanceGroup, weightGroup, bucketGroup].forEach(group => {
        group.classList.add('hidden');
    });
    
    switch (type) {
        case 'mixers':
            capacityGroup.classList.remove('hidden');
            break;
        case 'pumps':
            lengthGroup.classList.remove('hidden');
            performanceGroup.classList.remove('hidden');
            break;
        case 'dump-trucks':
        case 'tonars':
        case 'cranes':
            weightGroup.classList.remove('hidden');
            break;
        case 'excavators':
            bucketGroup.classList.remove('hidden');
            break;
    }
}

// ОСНОВНАЯ ФУНКЦИЯ СОХРАНЕНИЯ ТЕХНИКИ
async function saveEquipment() {
    if (!currentUser) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    const type = equipmentTypeSelect.value;
    const name = document.getElementById('equipment-name').value.trim();
    const price = document.getElementById('equipment-price').value;
    const location = document.getElementById('equipment-location').value.trim();
    const description = document.getElementById('equipment-description').value.trim();
    const paymentMethod = document.getElementById('payment-method').value;
    const userPhone = document.getElementById('user-phone-input').value.replace(/\D/g, '');

    if (!type || !name || !price || !location || !userPhone || !description) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }

    if (userPhone.length !== 9) {
        showNotification('Введите номер из 9 цифр (без +998)', 'error');
        return;
    }
    
    try {
        const newEquipment = {
            id: Date.now().toString(),
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
            status: 'pending', // Важно: ставим статус pending для модерации
            createdAt: Date.now()
        };
        
        // Добавляем специфичные поля
        switch (type) {
            case 'mixers':
                newEquipment.capacity = parseInt(document.getElementById('equipment-capacity').value) || 0;
                break;
            case 'pumps':
                newEquipment.length = parseInt(document.getElementById('equipment-length').value) || 0;
                newEquipment.performance = parseInt(document.getElementById('equipment-performance').value) || 0;
                break;
            case 'dump-trucks':
            case 'tonars':
            case 'cranes':
                newEquipment.weight = parseInt(document.getElementById('equipment-weight').value) || 0;
                break;
            case 'excavators':
                newEquipment.bucket = parseFloat(document.getElementById('equipment-bucket').value) || 0;
                break;
        }
        
        // Сохраняем в Firebase - бот сам найдет новую технику
        const equipmentRef = database.ref('equipment/' + newEquipment.id);
        await equipmentRef.set(newEquipment);
        
        // Обновляем телефон пользователя
        if (!currentUser.phone) {
            const userRef = database.ref('users/' + currentUser.uid + '/phone');
            await userRef.set('+998' + userPhone);
            currentUser.phone = '+998' + userPhone;
            userPhoneElement.textContent = currentUser.phone;
        }
        
        showNotification('✅ Техника отправлена на модерацию! Мы уведомим вас о результате.', 'success');
        navigateTo('profile-page');
        resetEquipmentForm();
        
    } catch (error) {
        console.error('Error saving equipment:', error);
        showNotification('❌ Ошибка при добавлении техники', 'error');
    }
}

function resetEquipmentForm() {
    document.getElementById('equipment-name').value = '';
    document.getElementById('equipment-price').value = '';
    document.getElementById('equipment-location').value = '';
    document.getElementById('equipment-description').value = '';
    document.getElementById('user-phone-input').value = '';
    equipmentTypeSelect.value = '';
    toggleFormFields();
}

async function toggleEquipmentAvailability(equipmentId) {
    try {
        const equipmentIndex = allEquipment.findIndex(item => item.id === equipmentId);
        if (equipmentIndex !== -1 && allEquipment[equipmentIndex].status === 'approved') {
            allEquipment[equipmentIndex].available = !allEquipment[equipmentIndex].available;
            
            const equipmentRef = database.ref('equipment/' + equipmentId + '/available');
            await equipmentRef.set(allEquipment[equipmentIndex].available);
            
            userEquipment = allEquipment.filter(item => 
                item.ownerId === currentUser.uid && item.status === 'approved'
            );
            
            loadAvailabilityEquipment();
            
            showNotification(`✅ Статус техники изменен на ${allEquipment[equipmentIndex].available ? 'доступен' : 'занят'}`, 'success');
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
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    setTimeout(() => lucide.createIcons(), 100);
}

// Global functions for onclick handlers
window.callOwner = callOwner;
window.messageOwner = messageOwner;
window.toggleEquipmentAvailability = toggleEquipmentAvailability;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);