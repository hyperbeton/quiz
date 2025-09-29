// admin-script.js
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

let currentAdmin = null;
let allEquipment = [];
let currentFilter = 'pending';

// Admin IDs
const ADMIN_IDS = [543221724];

// Check if user is admin
function checkAdminAccess() {
    const tg = window.Telegram.WebApp;
    const initData = tg.initDataUnsafe;
    
    console.log('Telegram init data:', initData);
    
    if (initData && initData.user) {
        const userId = initData.user.id;
        console.log('User ID:', userId, 'Admin IDs:', ADMIN_IDS);
        
        if (ADMIN_IDS.includes(userId)) {
            currentAdmin = initData.user;
            document.getElementById('admin-panel').classList.remove('hidden');
            document.getElementById('access-denied').classList.add('hidden');
            document.getElementById('loading-screen').classList.add('hidden');
            console.log('Admin access granted');
            return true;
        }
    }
    
    // Если не админ, показываем сообщение
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('access-denied').classList.remove('hidden');
    document.getElementById('loading-screen').classList.add('hidden');
    console.log('Admin access denied');
    return false;
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Initialize icons
    lucide.createIcons();
    
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Check admin access
    if (checkAdminAccess()) {
        // Load equipment data
        loadEquipmentData();
        
        // Tab event listeners
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderEquipmentList();
            });
        });
        
        // Close modal on background click
        document.getElementById('equipment-modal').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
});

// Navigation
function goBack() {
    window.history.back();
}

// Load equipment data
function loadEquipmentData() {
    const equipmentRef = database.ref('equipment');
    
    equipmentRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const equipmentData = snapshot.val();
            allEquipment = Object.entries(equipmentData).map(([key, value]) => ({
                id: key,
                ...value
            })).filter(item => item !== null);
            console.log('Equipment loaded:', allEquipment.length, 'items');
            updateStatistics();
            renderEquipmentList();
        } else {
            allEquipment = [];
            renderEquipmentList();
        }
    });
}

// Update statistics
function updateStatistics() {
    const pending = allEquipment.filter(item => item.status === 'pending').length;
    const approved = allEquipment.filter(item => item.status === 'approved').length;
    const rejected = allEquipment.filter(item => item.status === 'rejected').length;
    
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-rejected').textContent = rejected;
}

// Render equipment list
function renderEquipmentList() {
    const listElement = document.getElementById('admin-equipment-list');
    const filteredEquipment = allEquipment.filter(item => item.status === currentFilter);
    
    if (filteredEquipment.length === 0) {
        listElement.innerHTML = `
            <div class="no-data">
                <i data-lucide="inbox"></i>
                <p>Нет заявок со статусом "${getStatusText(currentFilter)}"</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    listElement.innerHTML = filteredEquipment.map(equipment => `
        <div class="equipment-item ${equipment.status}" onclick="showEquipmentDetails('${equipment.id}')">
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
                    <span>${equipment.owner?.name || 'Неизвестно'}</span>
                </div>
            </div>
            <div class="equipment-status ${equipment.status}">
                ${getStatusBadge(equipment.status)}
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// Show equipment details in modal
function showEquipmentDetails(equipmentId) {
    const equipment = allEquipment.find(item => item.id === equipmentId);
    if (!equipment) return;
    
    document.getElementById('modal-title').textContent = equipment.name;
    
    const modalContent = document.getElementById('modal-content');
    const status = equipment.status || 'pending';
    const ownerName = equipment.owner?.name || 'Неизвестно';
    const ownerPhone = equipment.ownerPhone || 'Не указан';
    
    modalContent.innerHTML = `
        <div class="equipment-details">
            <div class="detail-row">
                <strong>ID заявки:</strong> 
                <span style="font-family: monospace; background: var(--surface-dark); padding: 2px 6px; border-radius: 4px;">${equipment.id}</span>
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
                <strong>Владелец:</strong> ${ownerName}
            </div>
            <div class="detail-row">
                <strong>Телефон:</strong> ${ownerPhone}
            </div>
            <div class="detail-row">
                <strong>Статус:</strong> 
                <span class="equipment-status ${status}">${getStatusBadge(status)}</span>
            </div>
            <div class="detail-row">
                <strong>Описание:</strong> 
                <div style="margin-top: 5px; padding: 10px; background: var(--surface-dark); border-radius: 6px;">
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
                ${equipment.createdAt ? new Date(equipment.createdAt).toLocaleString('ru-RU') : 'Неизвестно'}
            </div>
        </div>
    `;
    
    const modalControls = document.getElementById('modal-controls');
    if (equipment.status === 'pending') {
        modalControls.innerHTML = `
            <button class="btn btn-approve" onclick="approveEquipment('${equipment.id}')">
                ✅ Одобрить заявку
            </button>
            <button class="btn btn-reject" onclick="showRejectionForm()">
                ❌ Отклонить заявку
            </button>
            <div class="rejection-reason" id="rejection-form" style="display: none;">
                <textarea id="rejection-reason" placeholder="Укажите причину отклонения заявки..."></textarea>
                <button class="btn btn-reject" onclick="rejectEquipment('${equipment.id}')" style="margin-top: 10px; width: 100%;">
                    📨 Отправить отклонение
                </button>
            </div>
        `;
    } else {
        modalControls.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                Заявка уже обработана
            </div>
        `;
    }
    
    document.getElementById('equipment-modal').classList.remove('hidden');
}

// Close modal
function closeModal() {
    document.getElementById('equipment-modal').classList.add('hidden');
}

// Show rejection form
function showRejectionForm() {
    document.getElementById('rejection-form').style.display = 'block';
}

// Approve equipment
function approveEquipment(equipmentId) {
    if (!confirm('Вы уверены, что хотите одобрить эту заявку?')) return;
    
    const equipmentRef = database.ref(`equipment/${equipmentId}`);
    equipmentRef.update({
        status: 'approved',
        moderatedBy: currentAdmin.id,
        moderatedAt: Date.now(),
        rejectionReason: null
    }).then(() => {
        showNotification('✅ Заявка одобрена!', 'success');
        closeModal();
    }).catch(error => {
        showNotification('❌ Ошибка при одобрении заявки: ' + error.message, 'error');
    });
}

// Reject equipment
function rejectEquipment(equipmentId) {
    const reason = document.getElementById('rejection-reason').value.trim();
    if (!reason) {
        showNotification('📝 Пожалуйста, укажите причину отклонения', 'error');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите отклонить эту заявку?')) return;
    
    const equipmentRef = database.ref(`equipment/${equipmentId}`);
    equipmentRef.update({
        status: 'rejected',
        rejectionReason: reason,
        moderatedBy: currentAdmin.id,
        moderatedAt: Date.now()
    }).then(() => {
        showNotification('❌ Заявка отклонена!', 'success');
        closeModal();
    }).catch(error => {
        showNotification('❌ Ошибка при отклонении заявки: ' + error.message, 'error');
    });
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    lucide.createIcons();
}

// Helper functions
function getStatusText(status) {
    const statuses = {
        'pending': 'На модерации',
        'approved': 'Одобренные',
        'rejected': 'Отклоненные'
    };
    return statuses[status] || status;
}

function getStatusBadge(status) {
    const badges = {
        'pending': '⏳ На модерации',
        'approved': '✅ Одобрено',
        'rejected': '❌ Отклонено'
    };
    return badges[status] || status;
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
    return icons[category] || 'truck';
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