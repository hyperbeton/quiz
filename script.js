// script.js
// Firebase configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Telegram Web App initialization
let tg = window.Telegram.WebApp;
let user = null;

// App state
let currentUser = null;
let equipmentData = {
    mixers: [],
    pumps: [],
    'dump-trucks': [],
    tonars: [],
    cranes: [],
    excavators: []
};

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const categoryItems = document.querySelectorAll('.category-item');
const equipmentLists = document.querySelectorAll('.equipment-list');
const userEquipmentList = document.getElementById('user-equipment');
const adminEquipmentList = document.getElementById('admin-equipment-list');

// Equipment type configurations
const equipmentConfig = {
    mixers: {
        icon: 'concrete-mixer',
        title: 'Автомиксеры',
        capacityLabel: 'Вместимость',
        capacityUnit: 'м³'
    },
    pumps: {
        icon: 'pump',
        title: 'Автобетононасосы',
        capacityLabel: 'Длина стрелы',
        capacityUnit: 'м'
    },
    'dump-trucks': {
        icon: 'dump-truck',
        title: 'Самосвалы',
        capacityLabel: 'Грузоподъемность',
        capacityUnit: 'т'
    },
    tonars: {
        icon: 'truck',
        title: 'Тонары',
        capacityLabel: 'Грузоподъемность',
        capacityUnit: 'т'
    },
    cranes: {
        icon: 'crane',
        title: 'Краны',
        capacityLabel: 'Грузоподъемность',
        capacityUnit: 'т'
    },
    excavators: {
        icon: 'excavator',
        title: 'Экскаваторы',
        capacityLabel: 'Объем ковша',
        capacityUnit: 'м³'
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Expand Telegram Web App
        tg.expand();
        
        // Wait for Telegram initialization
        await waitForTelegramInit();
        
        // Get user data from Telegram
        user = tg.initDataUnsafe?.user;
        
        if (user) {
            currentUser = {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                photoUrl: user.photo_url,
                languageCode: user.language_code
            };
            
            // Update profile information
            updateProfileInfo();
            
            // Load equipment data
            await loadEquipmentData();
        }
        
        // Hide loading screen and show main content
        setTimeout(() => {
            loadingScreen.classList.remove('active');
            mainContent.classList.remove('hidden');
        }, 1000);
        
        // Initialize event listeners
        initializeEventListeners();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback for testing outside Telegram
        currentUser = {
            id: 'test-user',
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            photoUrl: '',
            languageCode: 'ru'
        };
        
        setTimeout(() => {
            loadingScreen.classList.remove('active');
            mainContent.classList.remove('hidden');
            updateProfileInfo();
            initializeEventListeners();
        }, 1000);
    }
}

function waitForTelegramInit() {
    return new Promise((resolve) => {
        if (tg.initData) {
            resolve();
        } else {
            setTimeout(() => resolve(), 500);
        }
    });
}

function updateProfileInfo() {
    if (!currentUser) return;
    
    const userName = document.getElementById('user-name');
    const userPhone = document.getElementById('user-phone');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const avatarFallback = document.querySelector('.avatar-fallback');
    
    if (userName) {
        userName.textContent = `${currentUser.firstName} ${currentUser.lastName || ''}`.trim();
    }
    
    if (userPhone) {
        userPhone.textContent = currentUser.username ? `@${currentUser.username}` : 'Ташкент, Узбекистан';
    }
    
    if (userAvatarImg && currentUser.photoUrl) {
        userAvatarImg.src = currentUser.photoUrl;
        avatarFallback.style.display = 'none';
    }
}

async function loadEquipmentData() {
    try {
        // In a real app, this would load from Firebase
        // For demo purposes, we'll create mock data
        equipmentData = {
            mixers: generateMockEquipment('mixers', 8),
            pumps: generateMockEquipment('pumps', 6),
            'dump-trucks': generateMockEquipment('dump-trucks', 10),
            tonars: generateMockEquipment('tonars', 12),
            cranes: generateMockEquipment('cranes', 5),
            excavators: generateMockEquipment('excavators', 7)
        };
        
        // Update user equipment
        updateUserEquipment();
        
    } catch (error) {
        console.error('Error loading equipment data:', error);
    }
}

function generateMockEquipment(type, count) {
    const config = equipmentConfig[type];
    const equipment = [];
    
    for (let i = 1; i <= count; i++) {
        const capacity = getRandomCapacity(type);
        const price = getRandomPrice(type);
        
        equipment.push({
            id: `${type}-${i}`,
            name: `${getBrand(type)} ${getModel(type, i)}`,
            type: type,
            capacity: capacity,
            price: price,
            location: getRandomLocation(),
            owner: {
                name: getRandomName(),
                phone: getRandomPhone(),
                rating: (Math.random() * 0.8 + 3.2).toFixed(1),
                reviewCount: Math.floor(Math.random() * 50)
            },
            status: Math.random() > 0.3 ? 'available' : 'busy',
            description: getRandomDescription(type),
            paymentMethod: ['cash', 'transfer', 'both'][Math.floor(Math.random() * 3)],
            specs: getSpecs(type, capacity)
        });
    }
    
    return equipment;
}

function getRandomCapacity(type) {
    const ranges = {
        mixers: { min: 8, max: 12 },
        pumps: { min: 30, max: 50 },
        'dump-trucks': { min: 10, max: 20 },
        tonars: { min: 3, max: 5 },
        cranes: { min: 25, max: 100 },
        excavators: { min: 0.8, max: 2.0 }
    };
    
    const range = ranges[type];
    return type === 'excavators' 
        ? (Math.random() * (range.max - range.min) + range.min).toFixed(1)
        : Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function getRandomPrice(type) {
    const basePrices = {
        mixers: 80000,
        pumps: 120000,
        'dump-trucks': 60000,
        tonars: 40000,
        cranes: 150000,
        excavators: 90000
    };
    
    const base = basePrices[type];
    const variation = base * 0.3;
    return Math.floor(base + (Math.random() * variation - variation / 2));
}

function getRandomLocation() {
    const locations = [
        'Ташкент, Юнусабадский район',
        'Ташкент, Мирзо-Улугбекский район',
        'Ташкент, Чиланзарский район',
        'Ташкент, Шайхантахурский район',
        'Ташкент, Яккасарайский район',
        'Ташкент, Алмазарский район'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
}

function getRandomName() {
    const names = [
        'Алишер У.',
        'Сергей П.',
        'Дмитрий К.',
        'Александр М.',
        'Максим В.',
        'Олег С.',
        'Руслан Н.',
        'Артем Л.'
    ];
    return names[Math.floor(Math.random() * names.length)];
}

function getRandomPhone() {
    return `+998 90 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`;
}

function getBrand(type) {
    const brands = {
        mixers: ['Камаз', 'Howo', 'Shacman', 'FAW'],
        pumps: ['Putzmeister', 'Schwing', 'Sany', 'Zoomlion'],
        'dump-trucks': ['Камаз', 'Howo', 'Shacman', 'Dongfeng'],
        tonars: ['Isuzu', 'JAC', 'Foton', 'Hyundai'],
        cranes: ['Liebherr', 'XCMG', 'Sany', 'Tadano'],
        excavators: ['CAT', 'Hitachi', 'Volvo', 'Komatsu']
    };
    const brandList = brands[type];
    return brandList[Math.floor(Math.random() * brandList.length)];
}

function getModel(type, index) {
    const models = {
        mixers: ['65115', '65201', '65206', '65207'],
        pumps: ['36Z', '42Z', '48Z', '52Z'],
        'dump-trucks': ['65115', '65201', '65206', '65207'],
        tonars: ['NPR', 'NQR', 'J5', 'Aumark'],
        cranes: ['LTM 1050', 'QY25K', 'SAC3000', 'TG-500E'],
        excavators: ['320D', 'ZX210', 'EC210', 'PC200']
    };
    const modelList = models[type];
    return modelList[Math.floor(Math.random() * modelList.length)];
}

function getRandomDescription(type) {
    const descriptions = {
        mixers: 'Бетономешалка в отличном состоянии, регулярное техническое обслуживание, готов к работе.',
        pumps: 'Автобетононасос с современной системой управления, высокая производительность.',
        'dump-trucks': 'Самосвал с усиленным кузовом, подходит для перевозки сыпучих материалов.',
        tonars: 'Малый грузовик для городских перевозок, экономичный расход топлива.',
        cranes: 'Автомобильный кран с телескопической стрелой, точное позиционирование.',
        excavators: 'Гусеничный экскаватор с гидравлической системой, высокая мощность.'
    };
    return descriptions[type];
}

function getSpecs(type, capacity) {
    const baseSpecs = {
        mixers: {
            'Объем барабана': `${capacity} м³`,
            'Мощность двигателя': '240 л.с.',
            'Расход топлива': '25 л/100км',
            'Год выпуска': '2020'
        },
        pumps: {
            'Длина стрелы': `${capacity} м`,
            'Производительность': '90 м³/ч',
            'Мощность двигателя': '280 л.с.',
            'Год выпуска': '2019'
        },
        'dump-trucks': {
            'Грузоподъемность': `${capacity} т`,
            'Объем кузова': '12 м³',
            'Мощность двигателя': '260 л.с.',
            'Год выпуска': '2021'
        },
        tonars: {
            'Грузоподъемность': `${capacity} т`,
            'Объем кузова': '8 м³',
            'Мощность двигателя': '150 л.с.',
            'Год выпуска': '2022'
        },
        cranes: {
            'Грузоподъемность': `${capacity} т`,
            'Вылет стрелы': '40 м',
            'Мощность двигателя': '320 л.с.',
            'Год выпуска': '2018'
        },
        excavators: {
            'Объем ковша': `${capacity} м³`,
            'Масса': '21 т',
            'Мощность двигателя': '110 кВт',
            'Год выпуска': '2020'
        }
    };
    
    return baseSpecs[type];
}

function initializeEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            const category = item.getAttribute('data-category');
            
            if (pageId === 'category-page' && category) {
                showCategoryPage(category);
            } else {
                showPage(pageId);
            }
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Category items
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.getAttribute('data-category');
            showCategoryPage(category);
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            const correspondingNav = document.querySelector(`.nav-item[data-category="${category}"]`);
            if (correspondingNav) {
                correspondingNav.classList.add('active');
            }
        });
    });
    
    // Back buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            window.history.length > 1 ? window.history.back() : showPage('home-page');
        });
    });
    
    // Profile actions
    document.getElementById('add-equipment-btn')?.addEventListener('click', () => {
        showPage('add-equipment-page');
    });
    
    document.getElementById('my-equipment-btn')?.addEventListener('click', () => {
        showPage('moderation-page');
    });
    
    document.getElementById('toggle-availability-btn')?.addEventListener('click', () => {
        showPage('availability-page');
    });
    
    // Equipment type change
    document.getElementById('equipment-type')?.addEventListener('change', function() {
        updateEquipmentForm(this.value);
    });
    
    // Save equipment
    document.getElementById('save-equipment')?.addEventListener('click', saveEquipment);
    
    // Admin filter tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterAdminEquipment(filter);
        });
    });
}

function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Update page-specific content
        if (pageId === 'profile-page') {
            updateUserEquipment();
        } else if (pageId === 'moderation-page') {
            updateModerationStatus();
        } else if (pageId === 'admin-panel') {
            loadAdminData();
        }
    }
}

function showCategoryPage(category) {
    const config = equipmentConfig[category];
    if (!config) return;
    
    // Update category title
    document.getElementById('category-title').textContent = config.title;
    
    // Load and display equipment
    const equipmentList = document.getElementById('category-equipment');
    equipmentList.innerHTML = '';
    
    const equipment = equipmentData[category] || [];
    equipment.forEach(item => {
        const equipmentElement = createEquipmentElement(item);
        equipmentList.appendChild(equipmentElement);
    });
    
    showPage('category-page');
}

function createEquipmentElement(equipment) {
    const config = equipmentConfig[equipment.type];
    const element = document.createElement('div');
    element.className = `equipment-item ${equipment.status}`;
    element.setAttribute('data-id', equipment.id);
    
    element.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${config.icon}"></i>
        </div>
        <div class="equipment-info">
            <h3>${equipment.name}</h3>
            <div class="equipment-details">
                <div class="equipment-detail">
                    <i data-lucide="ruler"></i>
                    <span>${equipment.capacity} ${config.capacityUnit}</span>
                </div>
                <div class="equipment-location">
                    <i data-lucide="map-pin"></i>
                    <span>${equipment.location}</span>
                </div>
            </div>
            <div class="equipment-footer">
                <div class="owner-info">
                    <i data-lucide="user"></i>
                    <span>${equipment.owner.name}</span>
                </div>
                <div class="equipment-rating">
                    <span>★ ${equipment.owner.rating}</span>
                    <span>(${equipment.owner.reviewCount})</span>
                </div>
            </div>
        </div>
        <div class="equipment-meta">
            <div class="equipment-price">${equipment.price.toLocaleString()} сум/час</div>
            <div class="equipment-status ${equipment.status}">
                ${equipment.status === 'available' ? 'Доступен' : 'Занят'}
            </div>
        </div>
    `;
    
    // Add click event
    element.addEventListener('click', () => showEquipmentDetails(equipment));
    
    // Initialize icons
    lucide.createIcons();
    
    return element;
}

function showEquipmentDetails(equipment) {
    const config = equipmentConfig[equipment.type];
    const detailsContainer = document.getElementById('equipment-details');
    
    detailsContainer.innerHTML = `
        <div class="detail-section">
            <div class="equipment-header">
                <div class="equipment-image large">
                    <i data-lucide="${config.icon}"></i>
                </div>
                <div class="equipment-title">
                    <h3>${equipment.name}</h3>
                    <div class="equipment-price large">${equipment.price.toLocaleString()} сум/час</div>
                    <div class="equipment-status large ${equipment.status}">
                        ${equipment.status === 'available' ? 'Доступен' : 'Занят'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Характеристики</h3>
            <div class="specs-grid">
                ${Object.entries(equipment.specs || {}).map(([key, value]) => `
                    <div class="spec-item">
                        <div class="spec-value">${value}</div>
                        <div class="spec-label">${key}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Описание</h3>
            <p>${equipment.description}</p>
        </div>
        
        <div class="detail-section">
            <h3>Владелец</h3>
            <div class="owner-card">
                <div class="owner-avatar">
                    <i data-lucide="user"></i>
                </div>
                <div class="owner-info">
                    <h4>${equipment.owner.name}</h4>
                    <div class="owner-rating">
                        <span class="rating-stars">${'★'.repeat(Math.floor(equipment.owner.rating))}${'☆'.repeat(5 - Math.floor(equipment.owner.rating))}</span>
                        <span class="rating-value">${equipment.owner.rating} (${equipment.owner.reviewCount} отзывов)</span>
                    </div>
                    <div class="owner-phone">
                        <i data-lucide="phone"></i>
                        <span>${equipment.owner.phone}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Способ оплаты</h3>
            <p>${getPaymentMethodText(equipment.paymentMethod)}</p>
        </div>
        
        <div class="contact-buttons">
            <button class="contact-btn phone" onclick="contactOwner('${equipment.owner.phone}', 'phone')">
                <i data-lucide="phone"></i>
                Позвонить
            </button>
            <button class="contact-btn telegram" onclick="contactOwner('${equipment.owner.phone}', 'telegram')">
                <i data-lucide="send"></i>
                Telegram
            </button>
        </div>
    `;
    
    // Initialize icons
    lucide.createIcons();
    
    // Update page title
    document.getElementById('equipment-title').textContent = equipment.name;
    showPage('details-page');
}

function getPaymentMethodText(method) {
    const methods = {
        'cash': 'Наличные',
        'transfer': 'Безналичный расчет',
        'both': 'Наличные и безналичный расчет'
    };
    return methods[method] || method;
}

function contactOwner(phone, method) {
    if (method === 'phone') {
        window.open(`tel:${phone}`);
    } else if (method === 'telegram') {
        // In Telegram Web App, we can use tg.openTelegramLink
        const username = phone.replace(/[^0-9]/g, '');
        if (tg && tg.openTelegramLink) {
            tg.openTelegramLink(`https://t.me/${username}`);
        } else {
            window.open(`https://t.me/${username}`, '_blank');
        }
    }
}

function updateUserEquipment() {
    if (!userEquipmentList) return;
    
    userEquipmentList.innerHTML = '';
    
    // Get user's equipment (in real app, filter by user ID)
    const userEquipments = Object.values(equipmentData).flat().filter(eq => 
        eq.owner.name.includes(currentUser?.firstName || '')
    );
    
    if (userEquipments.length === 0) {
        userEquipmentList.innerHTML = `
            <div class="text-center" style="padding: 40px 20px; color: var(--text-secondary);">
                <i data-lucide="package" style="width: 48px; height: 48px; margin-bottom: 15px;"></i>
                <p>У вас пока нет добавленной техники</p>
                <button class="btn-primary" style="margin-top: 15px;" onclick="showPage('add-equipment-page')">
                    Добавить технику
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    userEquipments.forEach(equipment => {
        const element = createEquipmentElement(equipment);
        userEquipmentList.appendChild(element);
    });
}

function updateEquipmentForm(type) {
    // Hide all specific input groups
    document.getElementById('capacity-group').classList.add('hidden');
    document.getElementById('length-group').classList.add('hidden');
    document.getElementById('performance-group').classList.add('hidden');
    document.getElementById('weight-group').classList.add('hidden');
    document.getElementById('bucket-group').classList.add('hidden');
    
    // Show relevant input group based on equipment type
    const config = equipmentConfig[type];
    if (config) {
        switch (type) {
            case 'mixers':
                document.getElementById('capacity-group').classList.remove('hidden');
                document.querySelector('#capacity-group label').textContent = `${config.capacityLabel} (${config.capacityUnit}) *`;
                break;
            case 'pumps':
                document.getElementById('length-group').classList.remove('hidden');
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
}

function saveEquipment() {
    const form = document.querySelector('.add-equipment-form');
    const formData = new FormData();
    
    // Get form values
    const type = document.getElementById('equipment-type').value;
    const name = document.getElementById('equipment-name').value;
    const price = document.getElementById('equipment-price').value;
    const location = document.getElementById('equipment-location').value;
    const phone = document.getElementById('user-phone-input').value;
    const description = document.getElementById('equipment-description').value;
    const paymentMethod = document.getElementById('payment-method').value;
    
    // Validate required fields
    if (!type || !name || !price || !location || !phone || !description) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    // Get capacity based on type
    let capacity;
    switch (type) {
        case 'mixers':
            capacity = document.getElementById('equipment-capacity').value;
            break;
        case 'pumps':
            capacity = document.getElementById('equipment-length').value;
            break;
        case 'dump-trucks':
        case 'tonars':
        case 'cranes':
            capacity = document.getElementById('equipment-weight').value;
            break;
        case 'excavators':
            capacity = document.getElementById('equipment-bucket').value;
            break;
    }
    
    if (!capacity) {
        alert('Пожалуйста, укажите характеристики техники');
        return;
    }
    
    // Create equipment object
    const equipment = {
        id: `${type}-${Date.now()}`,
        name: name,
        type: type,
        capacity: parseFloat(capacity),
        price: parseInt(price),
        location: location,
        owner: {
            name: currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Пользователь',
            phone: `+998 ${phone}`,
            rating: '0.0',
            reviewCount: 0
        },
        status: 'pending',
        description: description,
        paymentMethod: paymentMethod,
        specs: getSpecs(type, capacity),
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'unknown'
    };
    
    // In real app, save to Firebase
    console.log('Saving equipment:', equipment);
    
    // Show success message
    alert('Техника успешно отправлена на модерацию!');
    
    // Return to profile
    showPage('profile-page');
}

function updateModerationStatus() {
    // In real app, count equipment by status for current user
    const userEquipments = Object.values(equipmentData).flat().filter(eq => 
        eq.owner.name.includes(currentUser?.firstName || '')
    );
    
    const pendingCount = userEquipments.filter(eq => eq.status === 'pending').length;
    const approvedCount = userEquipments.filter(eq => eq.status === 'available').length;
    const rejectedCount = userEquipments.filter(eq => eq.status === 'rejected').length;
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('approved-count').textContent = approvedCount;
    document.getElementById('rejected-count').textContent = rejectedCount;
    
    // Update moderation list
    const moderationList = document.getElementById('moderation-equipment');
    moderationList.innerHTML = '';
    
    userEquipments.forEach(equipment => {
        const element = createModerationEquipmentElement(equipment);
        moderationList.appendChild(element);
    });
}

function createModerationEquipmentElement(equipment) {
    const config = equipmentConfig[equipment.type];
    const element = document.createElement('div');
    element.className = `equipment-item ${equipment.status}`;
    
    element.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${config.icon}"></i>
        </div>
        <div class="equipment-info">
            <h3>${equipment.name}</h3>
            <div class="equipment-details">
                <div class="equipment-detail">
                    <i data-lucide="ruler"></i>
                    <span>${equipment.capacity} ${config.capacityUnit}</span>
                </div>
                <div class="equipment-location">
                    <i data-lucide="map-pin"></i>
                    <span>${equipment.location}</span>
                </div>
            </div>
            <div class="equipment-meta">
                <div class="equipment-price">${equipment.price.toLocaleString()} сум/час</div>
                <div class="equipment-type">${config.title}</div>
            </div>
            ${equipment.status === 'rejected' ? `
                <div class="rejection-reason">
                    <strong>Причина отклонения:</strong> Требуется дополнительная информация о технике
                </div>
            ` : ''}
        </div>
        <div class="equipment-status ${equipment.status}">
            ${equipment.status === 'pending' ? 'На модерации' : 
              equipment.status === 'available' ? 'Одобрено' : 'Отклонено'}
        </div>
    `;
    
    lucide.createIcons();
    return element;
}

function loadAdminData() {
    // In real app, load all equipment for moderation
    const allEquipment = Object.values(equipmentData).flat();
    
    // Update stats
    const pendingCount = allEquipment.filter(eq => eq.status === 'pending').length;
    const approvedCount = allEquipment.filter(eq => eq.status === 'available').length;
    const rejectedCount = allEquipment.filter(eq => eq.status === 'rejected').length;
    
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-approved').textContent = approvedCount;
    document.getElementById('stat-rejected').textContent = rejectedCount;
    
    // Load equipment for moderation
    filterAdminEquipment('pending');
}

function filterAdminEquipment(filter) {
    const allEquipment = Object.values(equipmentData).flat();
    const filteredEquipment = allEquipment.filter(eq => {
        switch (filter) {
            case 'pending': return eq.status === 'pending';
            case 'approved': return eq.status === 'available';
            case 'rejected': return eq.status === 'rejected';
            default: return true;
        }
    });
    
    const adminList = document.getElementById('admin-equipment-list');
    adminList.innerHTML = '';
    
    filteredEquipment.forEach(equipment => {
        const element = createAdminEquipmentElement(equipment);
        adminList.appendChild(element);
    });
}

function createAdminEquipmentElement(equipment) {
    const config = equipmentConfig[equipment.type];
    const element = document.createElement('div');
    element.className = `equipment-item ${equipment.status}`;
    
    element.innerHTML = `
        <div class="equipment-image">
            <i data-lucide="${config.icon}"></i>
        </div>
        <div class="equipment-info">
            <h3>${equipment.name}</h3>
            <div class="equipment-details">
                <div class="equipment-detail">
                    <i data-lucide="ruler"></i>
                    <span>${equipment.capacity} ${config.capacityUnit}</span>
                </div>
                <div class="equipment-location">
                    <i data-lucide="map-pin"></i>
                    <span>${equipment.location}</span>
                </div>
            </div>
            <div class="owner-info">
                <i data-lucide="user"></i>
                <span>${equipment.owner.name}</span>
                <span>•</span>
                <span>${equipment.owner.phone}</span>
            </div>
            <div class="equipment-meta">
                <div class="equipment-price">${equipment.price.toLocaleString()} сум/час</div>
                <div class="equipment-type">${config.title}</div>
            </div>
        </div>
        <div class="equipment-status ${equipment.status}">
            ${equipment.status === 'pending' ? 'На модерации' : 
              equipment.status === 'available' ? 'Одобрено' : 'Отклонено'}
        </div>
    `;
    
    // Add click event for moderation
    if (equipment.status === 'pending') {
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => openAdminModal(equipment));
    }
    
    lucide.createIcons();
    return element;
}

function openAdminModal(equipment) {
    const modal = document.getElementById('equipment-modal');
    const modalContent = document.getElementById('modal-content');
    const modalControls = document.getElementById('modal-controls');
    const modalTitle = document.getElementById('modal-title');
    
    modalTitle.textContent = equipment.name;
    
    modalContent.innerHTML = `
        <div class="modal-body">
            <div class="equipment-details-admin">
                <div class="detail-row">
                    <strong>Тип:</strong> ${equipmentConfig[equipment.type].title}
                </div>
                <div class="detail-row">
                    <strong>Характеристики:</strong> ${equipment.capacity} ${equipmentConfig[equipment.type].capacityUnit}
                </div>
                <div class="detail-row">
                    <strong>Цена:</strong> ${equipment.price.toLocaleString()} сум/час
                </div>
                <div class="detail-row">
                    <strong>Местоположение:</strong> ${equipment.location}
                </div>
                <div class="detail-row">
                    <strong>Владелец:</strong> ${equipment.owner.name}
                </div>
                <div class="detail-row">
                    <strong>Телефон:</strong> ${equipment.owner.phone}
                </div>
                <div class="detail-row">
                    <strong>Описание:</strong> ${equipment.description}
                </div>
                <div class="detail-row">
                    <strong>Способ оплаты:</strong> ${getPaymentMethodText(equipment.paymentMethod)}
                </div>
                <div class="detail-row">
                    <strong>Дата добавления:</strong> ${new Date(equipment.createdAt).toLocaleDateString('ru-RU')}
                </div>
            </div>
        </div>
    `;
    
    modalControls.innerHTML = `
        <div class="modal-footer">
            <button class="modal-btn reject" onclick="moderateEquipment('${equipment.id}', 'reject')">
                Отклонить
            </button>
            <button class="modal-btn approve" onclick="moderateEquipment('${equipment.id}', 'approve')">
                Одобрить
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeAdminModal() {
    document.getElementById('equipment-modal').classList.add('hidden');
}

function moderateEquipment(equipmentId, action) {
    // In real app, update equipment status in Firebase
    console.log(`Moderating equipment ${equipmentId}: ${action}`);
    
    // Update local data for demo
    Object.keys(equipmentData).forEach(type => {
        equipmentData[type] = equipmentData[type].map(eq => {
            if (eq.id === equipmentId) {
                return {
                    ...eq,
                    status: action === 'approve' ? 'available' : 'rejected'
                };
            }
            return eq;
        });
    });
    
    // Close modal and refresh
    closeAdminModal();
    loadAdminData();
    
    alert(`Техника ${action === 'approve' ? 'одобрена' : 'отклонена'}!`);
}

// Utility function to format phone numbers
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
        return `+998 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return phone;
}

// Handle browser back button
window.addEventListener('popstate', function(event) {
    // Simple navigation handling
    showPage('home-page');
    navItems.forEach(nav => {
        if (nav.getAttribute('data-page') === 'home-page') {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });
});