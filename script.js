// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, get, child, push, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// DOM elements
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const categoryItems = document.querySelectorAll('.category-item');
const categoryEquipmentList = document.getElementById('category-equipment');
const userEquipmentList = document.getElementById('user-equipment');
const equipmentDetails = document.getElementById('equipment-details');
const categoryTitle = document.getElementById('category-title');
const equipmentTitle = document.getElementById('equipment-title');
const backButtons = document.querySelectorAll('.btn-back');
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const addEquipmentBtn = document.getElementById('add-equipment-btn');
const saveEquipmentBtn = document.getElementById('save-equipment');
const userName = document.getElementById('user-name');

// Current state
let currentCategory = '';
let currentUser = null;
let userEquipment = [];

// Initialize the application
function init() {
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
        showAuthModal();
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
async function loadEquipmentData() {
    try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'equipment'));
        
        if (snapshot.exists()) {
            const equipmentData = snapshot.val();
            window.equipmentData = Object.values(equipmentData);
        } else {
            // Initialize with sample data if no data exists
            window.equipmentData = getSampleEquipmentData();
            await saveEquipmentData();
        }
    } catch (error) {
        console.error('Error loading equipment data:', error);
        window.equipmentData = getSampleEquipmentData();
    }
}

// Save equipment data to Firebase
async function saveEquipmentData() {
    try {
        await set(ref(database, 'equipment'), window.equipmentData);
    } catch (error) {
        console.error('Error saving equipment data:', error);
    }
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
            description: "Отличное состояние, регулярное обслуживание"
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
            description: "Немецкое качество, экономичный двигатель"
        },
        {
            id: 3,
            category: "pumps",
            name: "Putzmeister 36Z",
            capacity: 14,
            location: "Ташкент, Чиланзарский район",
            price: 120,
            available: true,
            owner: {
                name: "Дмитрий Волков",
                phone: "+998933456789",
                rating: 4.7,
                reviews: 18
            },
            paymentMethods: ["transfer"],
            description: "Мощный насос для высотных работ"
        }
    ];
}

// Render equipment for a specific category
function renderCategoryEquipment(category) {
    categoryEquipmentList.innerHTML = '';
    
    if (!window.equipmentData) return;
    
    const categoryEquipment = window.equipmentData
        .filter(item => item.category === category)
        .sort((a, b) => {
            if (a.available && !b.available) return -1;
            if (!a.available && b.available) return 1;
            return b.owner.rating - a.owner.rating;
        });
    
    categoryEquipment.forEach(item => {
        const equipmentItem = createEquipmentItem(item);
        categoryEquipmentList.appendChild(equipmentItem);
    });
}

// Render user's equipment
function renderUserEquipment() {
    userEquipmentList.innerHTML = '';
    
    if (!userEquipment.length) {
        userEquipmentList.innerHTML = '<div class="no-equipment">У вас пока нет добавленной техники</div>';
        return;
    }
    
    userEquipment.forEach(item => {
        const equipmentItem = createEquipmentItem(item);
        userEquipmentList.appendChild(equipmentItem);
    });
}

// Create equipment list item
function createEquipmentItem(item) {
    const equipmentItem = document.createElement('div');
    equipmentItem.className = `equipment-item ${item.available ? 'available' : 'busy'}`;
    equipmentItem.dataset.id = item.id;
    
    const iconClass = getIconClass(item.category);
    const paymentText = getPaymentText(item.paymentMethods);
    
    equipmentItem.innerHTML = `
        <div class="equipment-image">
            <i class="${iconClass}"></i>
        </div>
        <div class="equipment-info">
            <h3>${item.name}</h3>
            <div class="equipment-details">
                <div class="equipment-detail">
                    <i class="fas fa-cube"></i>
                    <span>${item.capacity} ${getCapacityUnit(item.category)}</span>
                </div>
                <div class="equipment-detail">
                    <i class="fas fa-route"></i>
                    <span>${item.price} тыс.</span>
                </div>
            </div>
            <div class="equipment-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${item.location}</span>
            </div>
            <div class="equipment-detail">
                <i class="fas fa-credit-card"></i>
                <span>${paymentText}</span>
            </div>
        </div>
        <div class="equipment-footer">
            <div class="equipment-price">${item.price} тыс.</div>
            <div class="equipment-rating">
                <i class="fas fa-star"></i>
                <span>${item.owner.rating}</span>
            </div>
            <div class="equipment-status ${item.available ? '' : 'busy'}">
                ${item.available ? 'Свободен' : 'Занят'}
            </div>
        </div>
    `;
    
    equipmentItem.addEventListener('click', () => {
        showEquipmentDetails(item.id);
    });
    
    return equipmentItem;
}

// Get icon class based on category
function getIconClass(category) {
    const icons = {
        'mixers': 'fas fa-truck-mix',
        'pumps': 'fas fa-pump-soap',
        'dump-trucks': 'fas fa-truck',
        'tonars': 'fas fa-truck-pickup',
        'excavators': 'fas fa-digging',
        'cranes': 'fas fa-crane'
    };
    return icons[category] || 'fas fa-truck-moving';
}

// Get capacity unit based on category
function getCapacityUnit(category) {
    return category === 'excavators' ? 'м³ ковш' : 'м³';
}

// Get payment method text
function getPaymentText(methods) {
    if (methods.includes('both')) return 'Нал/Безнал';
    if (methods.includes('cash')) return 'Наличные';
    if (methods.includes('transfer')) return 'Перечисление';
    return 'Не указано';
}

// Show equipment details
function showEquipmentDetails(equipmentId) {
    const equipment = window.equipmentData.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    equipmentTitle.textContent = equipment.name;
    equipmentDetails.innerHTML = `
        <div class="detail-section">
            <h3>Основная информация</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Тип техники</span>
                    <span class="detail-value">${getCategoryName(equipment.category)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Вместимость</span>
                    <span class="detail-value">${equipment.capacity} ${getCapacityUnit(equipment.category)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Цена за ходку</span>
                    <span class="detail-value">${equipment.price} тыс. сум</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Способы оплаты</span>
                    <span class="detail-value">${getPaymentText(equipment.paymentMethods)}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Описание</h3>
            <p>${equipment.description}</p>
        </div>
        
        <div class="detail-section">
            <h3>Владелец</h3>
            <div class="owner-info">
                <div class="owner-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="owner-details">
                    <h4>${equipment.owner.name}</h4>
                    <div class="equipment-rating">
                        <i class="fas fa-star"></i>
                        <span>${equipment.owner.rating} (${equipment.owner.reviews} отзывов)</span>
                    </div>
                </div>
            </div>
            <div class="contact-buttons">
                <button class="contact-btn phone">
                    <i class="fas fa-phone"></i>
                    Позвонить
                </button>
                <button class="contact-btn telegram">
                    <i class="fab fa-telegram"></i>
                    Написать
                </button>
            </div>
        </div>
    `;
    
    const phoneBtn = equipmentDetails.querySelector('.contact-btn.phone');
    const telegramBtn = equipmentDetails.querySelector('.contact-btn.telegram');
    
    phoneBtn.addEventListener('click', () => {
        alert(`Позвонить: ${equipment.owner.phone}`);
    });
    
    telegramBtn.addEventListener('click', () => {
        alert(`Написать владельцу: ${equipment.owner.name}`);
    });
    
    switchPage('details-page');
}

// Get category name by key
function getCategoryName(categoryKey) {
    const categoryNames = {
        'mixers': 'Автомиксер',
        'pumps': 'Автобетононасос',
        'dump-trucks': 'Самосвал',
        'tonars': 'Тонар',
        'excavators': 'Экскаватор',
        'cranes': 'Кран'
    };
    return categoryNames[categoryKey] || 'Неизвестно';
}

// Switch between pages
function switchPage(pageId, category = '') {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    
    const activeNavItem = document.querySelector(`[data-page="${pageId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    if (pageId === 'category-page' && category) {
        currentCategory = category;
        categoryTitle.textContent = getCategoryName(category);
        renderCategoryEquipment(category);
    } else if (pageId === 'profile-page') {
        renderUserEquipment();
    }
    
    window.scrollTo(0, 0);
}

// Add new equipment
async function addNewEquipment() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    const type = document.getElementById('equipment-type').value;
    const name = document.getElementById('equipment-name').value;
    const capacity = document.getElementById('equipment-capacity').value;
    const price = document.getElementById('equipment-price').value;
    const location = document.getElementById('equipment-location').value;
    const description = document.getElementById('equipment-description').value;
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (!type || !name || !capacity || !price || !location) {
        alert('Заполните все обязательные поля');
        return;
    }
    
    const newEquipment = {
        id: Date.now(),
        category: type,
        name: name,
        capacity: parseInt(capacity),
        location: location,
        price: parseInt(price),
        available: true,
        owner: {
            name: currentUser.name,
            phone: currentUser.phone,
            rating: 5.0,
            reviews: 0
        },
        paymentMethods: [paymentMethod],
        description: description || 'Описание не указано'
    };
    
    window.equipmentData.push(newEquipment);
    userEquipment.push(newEquipment);
    
    await saveEquipmentData();
    alert('Техника успешно добавлена!');
    switchPage('profile-page');
}

// Setup event listeners
function setupEventListeners() {
    // Navigation items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            const category = item.getAttribute('data-category');
            switchPage(pageId, category);
        });
    });
    
    // Category items
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.getAttribute('data-category');
            switchPage('category-page', category);
        });
    });
    
    // Back buttons
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentCategory) {
                switchPage('category-page', currentCategory);
            } else {
                switchPage('home-page');
            }
        });
    });
    
    // Auth
    loginBtn.addEventListener('click', () => {
        const phone = document.getElementById('user-phone').value;
        if (phone) {
            currentUser = {
                name: 'Пользователь',
                phone: phone
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            userName.textContent = currentUser.name;
            hideAuthModal();
        }
    });
    
    // Add equipment
    addEquipmentBtn.addEventListener('click', () => {
        if (!currentUser) {
            showAuthModal();
        } else {
            switchPage('add-equipment-page');
        }
    });
    
    saveEquipmentBtn.addEventListener('click', addNewEquipment);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);