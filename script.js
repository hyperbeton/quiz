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
const auth = firebase.auth();

// Current state
let currentCategory = '';
let currentUser = null;
let userEquipment = [];
let allEquipment = [];
let pageHistory = [];
let confirmationResult = null;
let countdownTimer = null;
let countdownSeconds = 60;

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
const verificationModal = document.getElementById('verification-modal');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

// Auth elements
const authTabs = document.querySelectorAll('.auth-tab');
const phoneAuth = document.getElementById('phone-auth');
const testAuth = document.getElementById('test-auth');
const sendCodeBtn = document.getElementById('send-code-btn');
const userPhoneInput = document.getElementById('user-phone');
const verificationCodeInput = document.getElementById('verification-code-input');
const confirmCodeBtn = document.getElementById('confirm-code-btn');
const resendCodeBtn = document.getElementById('resend-code-btn');
const countdownElement = document.getElementById('countdown');
const verificationPhoneNumber = document.getElementById('verification-phone-number');
const closeAuthModal = document.getElementById('close-auth-modal');
const logoutBtn = document.getElementById('logout-btn');
const testLoginButtons = document.querySelectorAll('.btn-test-login');

// Profile elements
const addEquipmentBtn = document.getElementById('add-equipment-btn');
const toggleAvailabilityBtn = document.getElementById('toggle-availability-btn');
const saveEquipmentBtn = document.getElementById('save-equipment');
const userName = document.getElementById('user-name');
const userPhoneElement = document.getElementById('user-phone');
const equipmentTypeSelect = document.getElementById('equipment-type');

// Form field groups
const capacityGroup = document.getElementById('capacity-group');
const lengthGroup = document.getElementById('length-group');
const performanceGroup = document.getElementById('performance-group');
const weightGroup = document.getElementById('weight-group');
const bucketGroup = document.getElementById('bucket-group');

// Initialize the application
async function init() {
    try {
        lucide.createIcons();
        setupEventListeners();
        
        // Check authentication state
        const authState = await checkAuthState();
        if (!authState) {
            // No user logged in, show auth modal after delay
            setTimeout(() => {
                if (!currentUser) {
                    showAuthModal();
                }
            }, 1000);
        }
        
        await loadEquipmentData();
        
        // Hide loading screen
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            mainContent.classList.remove('hidden');
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        loadingScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }
}

// Check authentication state
async function checkAuthState() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await handleUserSignedIn(user);
                resolve(true);
            } else {
                handleUserSignedOut();
                resolve(false);
            }
        });
    });
}

// Handle user signed in
async function handleUserSignedIn(user) {
    try {
        currentUser = {
            uid: user.uid,
            phoneNumber: user.phoneNumber,
            email: user.email,
            displayName: user.displayName || 'Пользователь'
        };
        
        // Get additional user data from database
        const userRef = database.ref('users/' + user.uid);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            currentUser = { ...currentUser, ...userData };
        } else {
            // Create new user record
            const userName = user.phoneNumber ? `Пользователь ${user.phoneNumber}` : 'Пользователь';
            await userRef.set({
                name: userName,
                phone: user.phoneNumber,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                rating: 5.0,
                reviews: 0,
                lastLogin: firebase.database.ServerValue.TIMESTAMP
            });
            
            currentUser.name = userName;
        }
        
        updateUIForAuthenticatedUser();
        userEquipment = allEquipment.filter(item => item.ownerId === user.uid);
        
    } catch (error) {
        console.error('Error handling user sign in:', error);
    }
}

// Handle user signed out
function handleUserSignedOut() {
    currentUser = null;
    userEquipment = [];
    updateUIForUnauthenticatedUser();
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    userName.textContent = currentUser.name || currentUser.displayName || 'Пользователь';
    userPhoneElement.textContent = currentUser.phone || currentUser.phoneNumber || 'Ташкент, Узбекистан';
    userEquipment = allEquipment.filter(item => item.ownerId === currentUser.uid);
    
    // Update profile page if active
    if (document.getElementById('profile-page').classList.contains('active')) {
        renderUserEquipment();
    }
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
    userName.textContent = 'Гость';
    userPhoneElement.textContent = 'Ташкент, Узбекистан';
    userEquipmentList.innerHTML = '<div class="no-data">Войдите в систему чтобы увидеть вашу технику</div>';
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            const category = item.getAttribute('data-category');
            
            if (pageId === 'profile-page' && !currentUser) {
                showAuthModal();
                return;
            }
            
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

    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });

    // Phone authentication
    sendCodeBtn.addEventListener('click', sendVerificationCode);
    confirmCodeBtn.addEventListener('click', confirmVerificationCode);
    resendCodeBtn.addEventListener('click', resendVerificationCode);
    
    // Test login buttons
    testLoginButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const phone = e.target.closest('.test-user-item').getAttribute('data-phone');
            handleTestLogin(phone);
        });
    });
    
    // Modal controls
    closeAuthModal.addEventListener('click', hideAuthModal);
    logoutBtn.addEventListener('click', handleLogout);

    // Profile actions
    addEquipmentBtn.addEventListener('click', () => {
        if (!currentUser) {
            showAuthModal();
            return;
        }
        navigateTo('add-equipment-page');
    });
    
    toggleAvailabilityBtn.addEventListener('click', () => {
        if (!currentUser) {
            showAuthModal();
            return;
        }
        loadAvailabilityEquipment();
        navigateTo('availability-page');
    });

    // Equipment form
    saveEquipmentBtn.addEventListener('click', saveEquipment);
    equipmentTypeSelect.addEventListener('change', toggleFormFields);

    // Close modals when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideAuthModal();
        }
    });
    
    verificationModal.addEventListener('click', (e) => {
        if (e.target === verificationModal) {
            hideVerificationModal();
        }
    });

    // Phone input formatting
    userPhoneInput.addEventListener('input', formatPhoneNumber);
}

// Auth functions
function switchAuthTab(tabName) {
    authTabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    
    phoneAuth.classList.toggle('hidden', tabName !== 'phone');
    testAuth.classList.toggle('hidden', tabName !== 'test');
}

function formatPhoneNumber() {
    let value = userPhoneInput.value.replace(/\D/g, '');
    if (value.length > 9) value = value.substring(0, 9);
    
    // Format as XX XXX XX XX
    if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{0,3})(\d{0,2})(\d{0,2})/, (_, p1, p2, p3, p4) => {
            let result = p1;
            if (p2) result += ' ' + p2;
            if (p3) result += ' ' + p3;
            if (p4) result += ' ' + p4;
            return result;
        });
    }
    
    userPhoneInput.value = value;
}

async function sendVerificationCode() {
    const phoneNumber = userPhoneInput.value.replace(/\D/g, '');
    
    if (!phoneNumber || phoneNumber.length !== 9) {
        showNotification('Пожалуйста, введите корректный номер телефона (9 цифр)', 'error');
        return;
    }
    
    const fullPhoneNumber = '+998' + phoneNumber;
    
    try {
        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = 'Отправка...';
        
        // For demo purposes, we'll simulate phone auth
        // In production, you would use Firebase Phone Auth
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show verification modal for demo
        confirmationResult = {
            confirm: async (code) => {
                // Simulate verification
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (code === '123456') {
                    // Create demo user object
                    const demoUser = {
                        uid: 'demo-user-' + phoneNumber + '-' + Date.now(),
                        phoneNumber: fullPhoneNumber,
                        displayName: 'Пользователь ' + fullPhoneNumber
                    };
                    return { user: demoUser };
                } else {
                    throw new Error('Неверный код подтверждения');
                }
            }
        };
        
        verificationPhoneNumber.textContent = formatPhoneForDisplay(fullPhoneNumber);
        showVerificationModal();
        startCountdown();
        
        showNotification('Код подтверждения отправлен на ваш телефон', 'success');
        
    } catch (error) {
        console.error('Error sending verification code:', error);
        handleAuthError(error);
    } finally {
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = 'Получить код';
    }
}

function formatPhoneForDisplay(phone) {
    return phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}

async function confirmVerificationCode() {
    const code = verificationCodeInput.value.trim();
    
    if (!code || code.length !== 6) {
        showNotification('Пожалуйста, введите 6-значный код подтверждения', 'error');
        return;
    }
    
    try {
        confirmCodeBtn.disabled = true;
        confirmCodeBtn.textContent = 'Проверка...';
        
        const result = await confirmationResult.confirm(code);
        
        // Handle the demo user
        await handleDemoUserLogin(result.user);
        
        hideVerificationModal();
        hideAuthModal();
        
    } catch (error) {
        console.error('Error verifying code:', error);
        handleAuthError(error);
    } finally {
        confirmCodeBtn.disabled = false;
        confirmCodeBtn.textContent = 'Подтвердить';
    }
}

async function handleDemoUserLogin(userData) {
    // Create a proper user object for demo
    const demoUser = {
        uid: userData.uid,
        phoneNumber: userData.phoneNumber,
        name: userData.displayName || `Пользователь ${userData.phoneNumber}`
    };
    
    // Save to localStorage for persistence
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
    
    await handleUserSignedIn(demoUser);
    showNotification(`Добро пожаловать, ${demoUser.name}!`, 'success');
}

function handleTestLogin(phone) {
    const fullPhoneNumber = '+998' + phone;
    const demoUser = {
        uid: 'demo-user-' + phone + '-' + Date.now(),
        phoneNumber: fullPhoneNumber,
        name: phone === '901234567' ? 'Иван Петров' : 'Алексей Смирнов'
    };
    
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
    handleUserSignedIn(demoUser);
    hideAuthModal();
    showNotification(`Добро пожаловать, ${demoUser.name}!`, 'success');
}

function handleAuthError(error) {
    let message = 'Произошла ошибка при аутентификации';
    
    switch (error.message) {
        case 'Неверный код подтверждения':
            message = 'Неверный код подтверждения. Попробуйте снова.';
            break;
        default:
            message = error.message || message;
    }
    
    showNotification(message, 'error');
}

function resendVerificationCode() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    
    sendVerificationCode();
}

function startCountdown() {
    countdownSeconds = 60;
    resendCodeBtn.disabled = true;
    countdownElement.textContent = countdownSeconds;
    
    countdownTimer = setInterval(() => {
        countdownSeconds--;
        countdownElement.textContent = countdownSeconds;
        
        if (countdownSeconds <= 0) {
            clearInterval(countdownTimer);
            resendCodeBtn.disabled = false;
            countdownElement.textContent = '0';
        }
    }, 1000);
}

// Modal functions
function showAuthModal() {
    authModal.classList.add('active');
    userPhoneInput.value = '';
    verificationCodeInput.value = '';
}

function hideAuthModal() {
    authModal.classList.remove('active');
}

function showVerificationModal() {
    verificationModal.classList.add('active');
}

function hideVerificationModal() {
    verificationModal.classList.remove('active');
    verificationCodeInput.value = '';
    
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
}

// Logout function
async function handleLogout() {
    try {
        // Clear user data
        currentUser = null;
        userEquipment = [];
        localStorage.removeItem('demoUser');
        
        updateUIForUnauthenticatedUser();
        navigateTo('home-page');
        
        showNotification('Вы успешно вышли из системы', 'info');
    } catch (error) {
        console.error('Error signing out:', error);
        showNotification('Ошибка при выходе из системы', 'error');
    }
}

// Notification function
function showNotification(message, type = 'info') {
    // Remove existing notifications
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
    
    // Add styles if not exists
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
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    // Create icons
    setTimeout(() => lucide.createIcons(), 100);
}

// Navigation functions
function navigateTo(pageId) {
    // Add current page to history only if it's different
    const currentActivePage = document.querySelector('.page.active');
    if (currentActivePage && currentActivePage.id !== pageId) {
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
        const equipmentRef = database.ref('equipment');
        
        equipmentRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const equipmentData = snapshot.val();
                allEquipment = Object.entries(equipmentData).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                console.log('Equipment loaded:', allEquipment.length, 'items');
            } else {
                // Initialize with sample data if no data exists
                allEquipment = getSampleEquipmentData();
                saveEquipmentData();
            }
            
            // Update user equipment if user is logged in
            if (currentUser) {
                userEquipment = allEquipment.filter(item => item.ownerId === currentUser.uid);
            }
            
            setTimeout(() => lucide.createIcons(), 100);
        });
    } catch (error) {
        console.error('Error loading equipment data:', error);
        allEquipment = getSampleEquipmentData();
    }
}

function getSampleEquipmentData() {
    const sampleUsers = [
        {
            uid: 'demo-user-901234567',
            name: 'Иван Петров',
            phone: '+998901234567',
            rating: 4.8,
            reviews: 24
        },
        {
            uid: 'demo-user-901234568', 
            name: 'Алексей Смирнов',
            phone: '+998901234568',
            rating: 4.9,
            reviews: 32
        }
    ];
    
    return [
        {
            id: '1',
            category: "mixers",
            name: "Камаз 65115",
            capacity: 10,
            location: "Ташкент, Юнусабадский район",
            price: 80,
            available: true,
            ownerId: sampleUsers[0].uid,
            owner: sampleUsers[0],
            paymentMethods: ["cash", "transfer"],
            description: "Отличное состояние, регулярное обслуживание. Готов к работе на любых объектах."
        },
        {
            id: '2',
            category: "mixers",
            name: "Howo 12 м³",
            capacity: 12,
            location: "Ташкент, Мирзо-Улугбекский район",
            price: 95,
            available: true,
            ownerId: sampleUsers[1].uid,
            owner: sampleUsers[1],
            paymentMethods: ["cash"],
            description: "Немецкое качество, экономичный двигатель. Вместительный бак."
        },
        {
            id: '3',
            category: "pumps",
            name: "Putzmeister 36Z",
            length: 36,
            performance: 90,
            location: "Ташкент, Чиланзарский район",
            price: 120,
            available: false,
            ownerId: sampleUsers[0].uid,
            owner: sampleUsers[0],
            paymentMethods: ["transfer"],
            description: "Профессиональное оборудование для крупных строительных объектов."
        },
        {
            id: '4',
            category: "dump-trucks",
            name: "Shacman X3000",
            weight: 20,
            location: "Ташкент, Сергелийский район",
            price: 70,
            available: true,
            ownerId: sampleUsers[1].uid,
            owner: sampleUsers[1],
            paymentMethods: ["cash", "transfer"],
            description: "Надежный самосвал для перевозки сыпучих материалов."
        },
        {
            id: '5',
            category: "cranes",
            name: "XCMG QY25K",
            weight: 25,
            location: "Ташкент, Яшнабадский район",
            price: 150,
            available: true,
            ownerId: sampleUsers[0].uid,
            owner: sampleUsers[0],
            paymentMethods: ["transfer"],
            description: "Автомобильный кран с отличной маневренностью и грузоподъемностью."
        }
    ];
}

function saveEquipmentData() {
    const equipmentRef = database.ref('equipment');
    const equipmentData = {};
    
    allEquipment.forEach(item => {
        equipmentData[item.id] = item;
    });
    
    equipmentRef.set(equipmentData)
        .then(() => console.log('Equipment data saved successfully'))
        .catch((error) => console.error('Error saving equipment data:', error));
}

function loadCategoryEquipment(category) {
    const filteredEquipment = allEquipment.filter(item => item.category === category && item.available);
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
    
    div.addEventListener('click', () => {
        showEquipmentDetails(equipment);
    });
    
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
            <button class="contact-btn telegram" onclick="messageOwner('${equipment.owner.phone}', '${equipment.name}')">
                <i data-lucide="message-circle"></i>
                Написать
            </button>
        </div>
    `;
    
    navigateTo('details-page');
    setTimeout(() => lucide.createIcons(), 100);
}

function renderUserEquipment() {
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

function toggleFormFields() {
    const type = equipmentTypeSelect.value;
    
    // Hide all groups first
    [capacityGroup, lengthGroup, performanceGroup, weightGroup, bucketGroup].forEach(group => {
        group.classList.add('hidden');
    });
    
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
        case 'cranes':
            weightGroup.classList.remove('hidden');
            break;
        case 'excavators':
            bucketGroup.classList.remove('hidden');
            break;
    }
}

async function saveEquipment() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    const type = equipmentTypeSelect.value;
    const name = document.getElementById('equipment-name').value.trim();
    const price = document.getElementById('equipment-price').value;
    const location = document.getElementById('equipment-location').value.trim();
    const description = document.getElementById('equipment-description').value.trim();
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (!type || !name || !price || !location) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
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
                name: currentUser.name || currentUser.displayName,
                phone: currentUser.phone || currentUser.phoneNumber,
                rating: currentUser.rating || 5.0,
                reviews: currentUser.reviews || 0
            },
            paymentMethods: paymentMethod === 'both' ? ['cash', 'transfer'] : [paymentMethod],
            description: description || 'Описание не указано',
            createdAt: firebase.database.ServerValue.TIMESTAMP
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
            case 'cranes':
                newEquipment.weight = parseInt(document.getElementById('equipment-weight').value) || 0;
                break;
            case 'excavators':
                newEquipment.bucket = parseFloat(document.getElementById('equipment-bucket').value) || 0;
                break;
        }
        
        allEquipment.push(newEquipment);
        userEquipment.push(newEquipment);
        await saveEquipmentData();
        
        showNotification('Техника успешно добавлена!', 'success');
        navigateTo('profile-page');
        resetEquipmentForm();
        
    } catch (error) {
        console.error('Error saving equipment:', error);
        showNotification('Ошибка при добавлении техники', 'error');
    }
}

function resetEquipmentForm() {
    document.getElementById('equipment-name').value = '';
    document.getElementById('equipment-price').value = '';
    document.getElementById('equipment-location').value = '';
    document.getElementById('equipment-description').value = '';
    equipmentTypeSelect.value = '';
    toggleFormFields();
}

async function toggleEquipmentAvailability(equipmentId) {
    try {
        const equipmentIndex = allEquipment.findIndex(item => item.id === equipmentId);
        if (equipmentIndex !== -1) {
            allEquipment[equipmentIndex].available = !allEquipment[equipmentIndex].available;
            await saveEquipmentData();
            
            // Update user equipment
            userEquipment = allEquipment.filter(item => item.ownerId === currentUser.uid);
            
            // Reload availability page
            loadAvailabilityEquipment();
            
            showNotification(`Статус техники изменен на ${allEquipment[equipmentIndex].available ? 'доступен' : 'занят'}`, 'success');
        }
    } catch (error) {
        console.error('Error toggling availability:', error);
        showNotification('Ошибка при изменении статуса', 'error');
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

function messageOwner(phone, equipmentName) {
    const message = `Здравствуйте! Интересует ваша техника: ${equipmentName}`;
    window.open(`https://t.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
}

// Global functions for onclick handlers
window.callOwner = callOwner;
window.messageOwner = messageOwner;
window.toggleEquipmentAvailability = toggleEquipmentAvailability;

// Check for demo user on page load
window.addEventListener('load', () => {
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser && !currentUser) {
        handleUserSignedIn(JSON.parse(demoUser));
    }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);