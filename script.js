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
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const addEquipmentBtn = document.getElementById('add-equipment-btn');
const toggleAvailabilityBtn = document.getElementById('toggle-availability-btn');
const saveEquipmentBtn = document.getElementById('save-equipment');
const userName = document.getElementById('user-name');
const equipmentTypeSelect = document.getElementById('equipment-type');

// Form field groups
const capacityGroup = document.getElementById('capacity-group');
const lengthGroup = document.getElementById('length-group');
const performanceGroup = document.getElementById('performance-group');
const weightGroup = document.getElementById('weight-group');
const bucketGroup = document.getElementById('bucket-group');

// Current state
let currentCategory = '';
let currentUser = null;
let userEquipment = [];
let allEquipment = [];
let pageHistory = [];

// Initialize the application
function init() {
    lucide.createIcons();
    checkAuth();
    setupEventListeners();
    loadEquipmentData();
}

// Check if user is authenticated
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        userName.textContent = currentUser.name;
    } else {
        setTimeout(showAuthModal, 500);
    }
}

// Show authentication modal
function showAuthModal() {
    authModal.classList.add('active');
}

// Hide authentication modal
function hideAuthModal() {
    authModal.classList.remove('active');
}

// Load equipment data from Firebase
function loadEquipmentData() {
    const equipmentRef = database.ref('equipment');
    
    equipmentRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const equipmentData = snapshot.val();
            allEquipment = Object.values(equipmentData);
            console.log('Equipment loaded:', allEquipment.length, 'items');
        } else {
            // Initialize with sample data if no data exists
            allEquipment = getSampleEquipmentData();
            saveEquipmentData();
        }
        
        // Update user equipment if user is logged in
        if (currentUser) {
            userEquipment = allEquipment.filter(item => item.owner.phone === currentUser.phone);
        }
        
        // Update icons after data load
        setTimeout(() => lucide.createIcons(), 100);
    }, (error) => {
        console.error('Error loading equipment data:', error);
        allEquipment = getSampleEquipmentData();
    });
}

// Save equipment data to Firebase
function saveEquipmentData() {
    const equipmentRef = database.ref('equipment');
    equipmentRef.set(allEquipment)
        .then(() => console.log('Equipment data saved successfully'))
        .catch((error) => console.error('Error saving equipment data:', error));
}

// Get sample equipment data
function getSampleEquipmentData() {
    return [
        {
            id: 1,
            category: "mixers",
            name: "Камаз 65115",
            capacity: 10,
            location: "Ташкент, Юнусабадский район",
            price: 80,
            available: true,
            owner: {
                name: "Иван Петров",
                phone: "+998901234567",
                rating: 4.8,
                reviews: 24
            },
            paymentMethods: ["cash", "transfer"],
            description: "Отличное состояние, регулярное обслуживание. Готов к работе на любых объектах."
        },
        {
            id: 2,
            category: "mixers",
            name: "Howo 12 м³",
            capacity: 12,
            location: "Ташкент, Мирзо-Улугбекский район",
            price: 95,
            available: true,
            owner: {
                name: "Алексей Смирнов",
                phone: "+998919876543",
                rating: 4.9,
                reviews: 32
            },
            paymentMethods: ["cash"],
            description: "Немецкое качество, экономичный двигатель. Вместительный бак."
        },
        {
            id: 3,
            category: "pumps",
            name: "Putzmeister 36Z",
            length: 36,
            performance: 90,
            location: "Ташкент, Чиланзарский район",
            price: 120,
            available: false,
            owner: {
                name: "Сергей Иванов",
                phone: "+998935555555",
                rating: 4.7,
                reviews: 18
            },
            paymentMethods: ["transfer"],
            description: "Профессиональное оборудование для крупных строительных объектов."
        },
        {
            id: 4,
            category: "dump-trucks",
            name: "Shacman X3000",
            weight: 20,
            location: "Ташкент, Сергелийский район",
            price: 70,
            available: true,
            owner: {
                name: "Дмитрий Козлов",
                phone: "+998941234567",
                rating: 4.6,
                reviews: 15
            },
            paymentMethods: ["cash", "transfer"],
            description: "Надежный самосвал для перевозки сыпучих материалов."
        },
        {
            id: 5,
            category: "cranes",
            name: "XCMG QY25K",
            weight: 25,
            location: "Ташкент, Яшнабадский район",
            price: 150,
            available: true,
            owner: {
                name: "Андрей Волков",
                phone: "+998901112233",
                rating: 4.9,
                reviews: 28
            },
            paymentMethods: ["transfer"],
            description: "Автомобильный кран с отличной маневренностью и грузоподъемностью."
        }
    ];
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
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
        button.addEventListener('click', goBack);
    });

    // Authentication
    loginBtn.addEventListener('click', handleLogin);

    // Profile actions
    addEquipmentBtn.addEventListener('click', () => navigateTo('add-equipment-page'));
    toggleAvailabilityBtn.addEventListener('click', () => {
        loadAvailabilityEquipment();
        navigateTo('availability-page');
    });

    // Equipment form
    saveEquipmentBtn.addEventListener('click', saveEquipment);
    equipmentTypeSelect.addEventListener('change', toggleFormFields);
}

// Navigation functions
function navigateTo(pageId) {
    // Add current page to history
    const currentActivePage = document.querySelector('.page.active');
    if (currentActivePage) {
        pageHistory.push(currentActivePage.id);
    }

    // Show new page
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId) {
            page.classList.add('active');
        }
    });

    // Update icons after navigation
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
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
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
function loadCategoryEquipment(category) {
    const filteredEquipment = allEquipment.filter(item => item.category === category);
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
    div.className = `equipment-item ${equipment.available ? 'available' : 'busy'}`;
    
    const icon = getEquipmentIcon(equipment.category);
    const statusText = equipment.available ? 'Доступен' : 'Занят';
    const statusClass = equipment.available ? 'available' : 'busy';
    
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
                    <span>${equipment.owner.rating}</span>
                </div>
                <div class="equipment-status ${statusClass}">${statusText}</div>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => showEquipmentDetails(equipment));
    return div;
}

function showEquipmentDetails(equipment) {
    equipmentTitle.textContent = equipment.name;
    
    const icon = getEquipmentIcon(equipment.category);
    const statusText = equipment.available ? 'Доступен' : 'Занят';
    const statusClass = equipment.available ? 'available' : 'busy';
    
    equipmentDetails.innerHTML = `
        <div class="detail-section">
            <div class="owner-info">
                <div class="owner-avatar">
                    <i data-lucide="user"></i>
                </div>
                <div class="owner-details">
                    <h4>${equipment.owner.name}</h4>
                    <div class="equipment-rating">
                        <i data-lucide="star"></i>
                        <span>${equipment.owner.rating} (${equipment.owner.reviews} отзывов)</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Информация о технике</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Статус</span>
                    <span class="detail-value ${statusClass}">${statusText}</span>
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
                    <span class="detail-value">${equipment.paymentMethods.includes('cash') ? '✓' : '✗'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Безналичный расчет</span>
                    <span class="detail-value">${equipment.paymentMethods.includes('transfer') ? '✓' : '✗'}</span>
                </div>
            </div>
        </div>
        
        <div class="contact-buttons">
            <button class="contact-btn phone" onclick="callOwner('${equipment.owner.phone}')">
                <i data-lucide="phone"></i>
                Позвонить
            </button>
            <button class="contact-btn telegram" onclick="messageOwner('${equipment.owner.phone}')">
                <i data-lucide="message-circle"></i>
                Написать
            </button>
        </div>
    `;
    
    navigateTo('details-page');
    setTimeout(() => lucide.createIcons(), 100);
}

function loadAvailabilityEquipment() {
    availabilityEquipmentList.innerHTML = '';
    
    if (userEquipment.length === 0) {
        availabilityEquipmentList.innerHTML = `
            <div class="no-data">
                <i data-lucide="construction"></i>
                <p>У вас пока нет добавленной техники</p>
            </div>
        `;
    } else {
        userEquipment.forEach(equipment => {
            const div = document.createElement('div');
            div.className = `equipment-item ${equipment.available ? 'available' : 'busy'}`;
            
            const icon = getEquipmentIcon(equipment.category);
            const statusText = equipment.available ? 'Доступен' : 'Занят';
            
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
                        <button class="toggle-availability-btn" onclick="toggleAvailability(${equipment.id})">
                            ${equipment.available ? 'Сделать занятым' : 'Сделать доступным'}
                        </button>
                    </div>
                </div>
            `;
            
            availabilityEquipmentList.appendChild(div);
        });
    }
    
    setTimeout(() => lucide.createIcons(), 100);
}

function toggleFormFields() {
    const type = equipmentTypeSelect.value;
    
    // Hide all groups first
    capacityGroup.classList.add('hidden');
    lengthGroup.classList.add('hidden');
    performanceGroup.classList.add('hidden');
    weightGroup.classList.add('hidden');
    bucketGroup.classList.add('hidden');
    
    // Show relevant groups based on equipment type
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
            weightGroup.classList.remove('hidden');
            break;
        case 'cranes':
            weightGroup.classList.remove('hidden');
            break;
        case 'excavators':
            bucketGroup.classList.remove('hidden');
            break;
    }
}

function saveEquipment() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    const type = equipmentTypeSelect.value;
    const name = document.getElementById('equipment-name').value;
    const price = document.getElementById('equipment-price').value;
    const location = document.getElementById('equipment-location').value;
    const description = document.getElementById('equipment-description').value;
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (!type || !name || !price || !location) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    const newEquipment = {
        id: Date.now(),
        category: type,
        name: name,
        location: location,
        price: parseInt(price),
        available: true,
        owner: {
            name: currentUser.name,
            phone: currentUser.phone,
            rating: 5.0,
            reviews: 0
        },
        paymentMethods: paymentMethod === 'both' ? ['cash', 'transfer'] : [paymentMethod],
        description: description || 'Описание не указано'
    };
    
    // Add specific fields based on equipment type
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
            newEquipment.weight = parseInt(document.getElementById('equipment-weight').value) || 0;
            break;
        case 'cranes':
            newEquipment.weight = parseInt(document.getElementById('equipment-weight').value) || 0;
            break;
        case 'excavators':
            newEquipment.bucket = parseFloat(document.getElementById('equipment-bucket').value) || 0;
            break;
    }
    
    allEquipment.push(newEquipment);
    userEquipment.push(newEquipment);
    saveEquipmentData();
    
    alert('Техника успешно добавлена!');
    navigateTo('profile-page');
    resetEquipmentForm();
}

function resetEquipmentForm() {
    document.getElementById('equipment-name').value = '';
    document.getElementById('equipment-price').value = '';
    document.getElementById('equipment-location').value = '';
    document.getElementById('equipment-description').value = '';
    equipmentTypeSelect.value = '';
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
        'mixers': 'mixer',
        'pumps': 'sprout',
        'dump-trucks': 'truck',
        'tonars': 'truck',
        'cranes': 'crane',
        'excavators': 'digging'
    };
    return icons[category] || 'construction';
}

function callOwner(phone) {
    window.open(`tel:${phone}`);
}

function messageOwner(phone) {
    const message = 'Здравствуйте! Интересует ваша техника.';
    window.open(`https://t.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`);
}

function toggleAvailability(equipmentId) {
    const equipment = allEquipment.find(item => item.id === equipmentId);
    if (equipment) {
        equipment.available = !equipment.available;
        saveEquipmentData();
        loadAvailabilityEquipment();
    }
}

function handleLogin() {
    const name = document.getElementById('user-name-input').value;
    const phone = document.getElementById('user-phone').value;
    
    if (!name || !phone) {
        alert('Пожалуйста, введите имя и телефон');
        return;
    }
    
    currentUser = { name, phone };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    userName.textContent = name;
    
    hideAuthModal();
    alert(`Добро пожаловать, ${name}!`);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);