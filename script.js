// Mock data for demonstration
const equipmentData = [
    {
        id: 1,
        category: "mixers",
        name: "Автомиксер Камаз 65115",
        capacity: 10,
        location: "Ташкент, Юнусабадский район",
        price: 80,
        available: true,
        details: {
            licensePlate: "01 A 123 AB",
            year: 2020,
            mileage: "125 000 км",
            description: "Отличное состояние, регулярное обслуживание. Готов к работе. Идеально подходит для строительных объектов средней величины."
        },
        owner: {
            name: "Иван Петров",
            phone: "+998 90 123 45 67",
            telegram: "@ivanpetrov",
            rating: 4.8,
            reviews: 24
        }
    },
    {
        id: 2,
        category: "mixers",
        name: "Автомиксер Howo 12 м³",
        capacity: 12,
        location: "Ташкент, Мирзо-Улугбекский район",
        price: 95,
        available: true,
        details: {
            licensePlate: "01 B 456 BC",
            year: 2019,
            mileage: "180 000 км",
            description: "Немецкое качество, экономичный двигатель. Вместительный бак. Регулярное техническое обслуживание."
        },
        owner: {
            name: "Алексей Смирнов",
            phone: "+998 91 987 65 43",
            telegram: "@alexsmirnov",
            rating: 4.9,
            reviews: 32
        }
    },
    {
        id: 3,
        category: "pumps",
        name: "Бетононасос Putzmeister 36Z",
        capacity: 14,
        location: "Ташкент, Чиланзарский район",
        price: 120,
        available: true,
        details: {
            licensePlate: "01 C 789 CD",
            year: 2021,
            mileage: "75 000 км",
            description: "Мощный насос для высотных работ. Максимальная высота подачи 36м. Современная система управления."
        },
        owner: {
            name: "Дмитрий Волков",
            phone: "+998 93 345 67 89",
            telegram: "@dmitryvolkov",
            rating: 4.7,
            reviews: 18
        }
    },
    {
        id: 4,
        category: "mixers",
        name: "Автомиксер ЗИЛ 130",
        capacity: 8,
        location: "Ташкент, Яшнабадский район",
        price: 65,
        available: false,
        details: {
            licensePlate: "01 D 012 DE",
            year: 2018,
            mileage: "220 000 км",
            description: "Надежная проверенная техника. Идеально для небольших объектов. Экономичный в обслуживании."
        },
        owner: {
            name: "Сергей Иванов",
            phone: "+998 94 567 89 01",
            telegram: "@sergeyivanov",
            rating: 4.5,
            reviews: 15
        }
    },
    {
        id: 5,
        category: "pumps",
        name: "Бетононасос Schwing 42 м",
        capacity: 16,
        location: "Ташкент, Шайхантахурский район",
        price: 140,
        available: true,
        details: {
            licensePlate: "01 E 345 EF",
            year: 2022,
            mileage: "30 000 км",
            description: "Современная модель с электронным управлением. Максимальная высота подачи 42м. Низкий уровень шума."
        },
        owner: {
            name: "Олег Кузнецов",
            phone: "+998 95 678 90 12",
            telegram: "@olegkuznetsov",
            rating: 4.9,
            reviews: 8
        }
    },
    {
        id: 6,
        category: "dump-trucks",
        name: "Самосвал Камаз 65201",
        capacity: 20,
        location: "Ташкент, Яккасарайский район",
        price: 70,
        available: true,
        details: {
            licensePlate: "01 F 678 FG",
            year: 2020,
            mileage: "150 000 км",
            description: "Грузоподъемность 20 тонн. Отличное состояние. Подходит для перевозки сыпучих материалов."
        },
        owner: {
            name: "Николай Семенов",
            phone: "+998 97 123 45 67",
            telegram: "@nikolaysemenov",
            rating: 4.6,
            reviews: 21
        }
    },
    {
        id: 7,
        category: "tonars",
        name: "Тонар ISUZU 5т",
        capacity: 5,
        location: "Ташкент, Учтепинский район",
        price: 50,
        available: true,
        details: {
            licensePlate: "01 G 901 GH",
            year: 2021,
            mileage: "80 000 км",
            description: "Экономичный и маневренный. Идеален для городских условий. Низкий расход топлива."
        },
        owner: {
            name: "Артем Васильев",
            phone: "+998 99 876 54 32",
            telegram: "@artemvasilyev",
            rating: 4.7,
            reviews: 13
        }
    },
    {
        id: 8,
        category: "cranes",
        name: "Кран Liebherr 100т",
        capacity: 100,
        location: "Ташкент, Мирабадский район",
        price: 200,
        available: true,
        details: {
            licensePlate: "01 H 234 HI",
            year: 2020,
            mileage: "50 000 км",
            description: "Мощный кран для сложных подъемных операций. Современная система безопасности."
        },
        owner: {
            name: "Владимир Новиков",
            phone: "+998 90 987 65 43",
            telegram: "@vladimirnovikov",
            rating: 4.9,
            reviews: 9
        }
    },
    {
        id: 9,
        category: "excavators",
        name: "Экскаватор JCB 3CX",
        capacity: 1.2,
        location: "Ташкент, Сергелийский район",
        price: 90,
        available: false,
        details: {
            licensePlate: "01 I 567 IJ",
            year: 2019,
            mileage: "2 500 моточасов",
            description: "Компактный и мощный. Подходит для различных земляных работ. Отличная маневренность."
        },
        owner: {
            name: "Максим Орлов",
            phone: "+998 93 654 32 10",
            telegram: "@maximorlov",
            rating: 4.8,
            reviews: 17
        }
    }
];

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

// Current state
let currentCategory = '';

// Initialize the application
function init() {
    setupEventListeners();
}

// Render equipment for a specific category
function renderCategoryEquipment(category) {
    categoryEquipmentList.innerHTML = '';
    
    // Get equipment for the category and sort by availability and rating
    const categoryEquipment = equipmentData
        .filter(item => item.category === category)
        .sort((a, b) => {
            // Sort by availability first, then by rating
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
    
    // For demonstration, show equipment owned by "Алексей Смирнов"
    const userEquipment = equipmentData.filter(item => item.owner.name === "Алексей Смирнов");
    
    userEquipment.forEach(item => {
        const equipmentItem = createEquipmentItem(item);
        userEquipmentList.appendChild(equipmentItem);
    });
}

// Create equipment list item
function createEquipmentItem(item) {
    const equipmentItem = document.createElement('div');
    equipmentItem.className = `equipment-item ${item.available ? '' : 'busy'}`;
    equipmentItem.dataset.id = item.id;
    
    // Get appropriate icon based on category
    let iconClass = 'fas fa-truck-moving'; // default
    switch(item.category) {
        case 'mixers':
            iconClass = 'fas fa-truck-mix';
            break;
        case 'pumps':
            iconClass = 'fas fa-pump-soap';
            break;
        case 'dump-trucks':
            iconClass = 'fas fa-truck';
            break;
        case 'tonars':
            iconClass = 'fas fa-truck-pickup';
            break;
        case 'excavators':
            iconClass = 'fas fa-digging';
            break;
        case 'cranes':
            iconClass = 'fas fa-crane';
            break;
    }
    
    equipmentItem.innerHTML = `
        <div class="equipment-image">
            <i class="${iconClass}"></i>
        </div>
        <div class="equipment-info">
            <h3>${item.name}</h3>
            <div class="equipment-details">
                <div class="equipment-detail">
                    <i class="fas fa-cube"></i>
                    <span>${item.capacity} ${item.category === 'excavators' ? 'м³ ковш' : 'м³'}</span>
                </div>
                <div class="equipment-detail">
                    <i class="fas fa-route"></i>
                    <span>${item.price} тыс. сум</span>
                </div>
            </div>
            <div class="equipment-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${item.location}</span>
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
    
    // Add click event to show details
    equipmentItem.addEventListener('click', () => {
        showEquipmentDetails(item.id);
    });
    
    return equipmentItem;
}

// Show equipment details
function showEquipmentDetails(equipmentId) {
    const equipment = equipmentData.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    // Get appropriate icon based on category
    let iconClass = 'fas fa-truck-moving'; // default
    switch(equipment.category) {
        case 'mixers':
            iconClass = 'fas fa-truck-mix';
            break;
        case 'pumps':
            iconClass = 'fas fa-pump-soap';
            break;
        case 'dump-trucks':
            iconClass = 'fas fa-truck';
            break;
        case 'tonars':
            iconClass = 'fas fa-truck-pickup';
            break;
        case 'excavators':
            iconClass = 'fas fa-digging';
            break;
        case 'cranes':
            iconClass = 'fas fa-crane';
            break;
    }
    
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
                    <span class="detail-value">${equipment.capacity} ${equipment.category === 'excavators' ? 'м³ ковш' : 'м³'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Год выпуска</span>
                    <span class="detail-value">${equipment.details.year}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Пробег</span>
                    <span class="detail-value">${equipment.details.mileage}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Номер</span>
                    <span class="detail-value">${equipment.details.licensePlate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Цена за ходку</span>
                    <span class="detail-value">${equipment.price} тыс. сум</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Описание</h3>
            <p>${equipment.details.description}</p>
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
                    Написать в Telegram
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners to contact buttons
    const phoneBtn = equipmentDetails.querySelector('.contact-btn.phone');
    const telegramBtn = equipmentDetails.querySelector('.contact-btn.telegram');
    
    phoneBtn.addEventListener('click', () => {
        alert(`Позвонить по номеру: ${equipment.owner.phone}`);
    });
    
    telegramBtn.addEventListener('click', () => {
        alert(`Написать в Telegram: ${equipment.owner.telegram}`);
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
        'cranes': 'Кран',
        'bulldozers': 'Бульдозер',
        'loaders': 'Погрузчик',
        'rollers': 'Каток'
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
    
    // Set active nav item
    const activeNavItem = document.querySelector(`[data-page="${pageId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Handle category pages
    if (pageId === 'category-page' && category) {
        currentCategory = category;
        categoryTitle.textContent = getCategoryName(category);
        renderCategoryEquipment(category);
    } else if (pageId === 'profile-page') {
        renderUserEquipment();
    }
    
    // Scroll to top when switching pages
    window.scrollTo(0, 0);
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
    
    // Profile action buttons
    document.querySelectorAll('.profile-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Функция в разработке');
        });
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);