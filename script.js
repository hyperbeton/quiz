// Конфигурация
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWxpbW92ZSIsImEiOiJjbTlpa3RjeG0wM2FtMmpweHppbzgzcGlmIn0.ZwOAvSETInXLzNHG0l1Q_A';
const TELEGRAM_BOT_TOKEN = '7966741167:AAHSGufTD93Dew1P4jEMJsQcXZZs_WEfjfQ';
const TELEGRAM_CHAT_ID = '-1002334913768';

// Глобальные переменные
let map;
let locationMap;
let currentStep = 1;
let selectedLocation = null;
let uploadedPhotos = [];
let properties = [];
let markers = [];
let activePopup = null;
let currentPropertyView = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentSection = localStorage.getItem('currentSection') || 'main';
let selectedRooms = [];
let priceRange = { min: 0, max: 2000 };

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
  // Показываем лоадер на 2 секунды
  setTimeout(() => {
    document.getElementById('loader').style.display = 'none';
    
    // Проверяем, нужно ли показывать главный экран
    if (currentSection === 'landing') {
      document.getElementById('landing').style.display = 'flex';
    } else {
      showApp();
      if (currentSection === 'favorites') {
        showFavorites();
      }
    }
  }, 2000);

  // Обработчики кнопок главного экрана
  document.getElementById('find-btn').addEventListener('click', () => {
    localStorage.setItem('currentSection', 'main');
    showApp();
  });
  document.getElementById('add-btn').addEventListener('click', showAppAndOpenForm);

  // Инициализация карты
  initMapbox();

  // Загрузка объявлений
  loadProperties();

  // Обработчики меню
  document.getElementById('menu-btn').addEventListener('click', openSideMenu);
  document.getElementById('close-menu').addEventListener('click', closeSideMenu);
  document.getElementById('add-btn-menu').addEventListener('click', openAdModal);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('back-to-home').addEventListener('click', () => {
    localStorage.setItem('currentSection', 'landing');
    document.getElementById('app').style.display = 'none';
    document.getElementById('landing').style.display = 'flex';
  });

  // Обработчики ссылок меню
  document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      localStorage.setItem('currentSection', section);
      
      if (section === 'favorites') {
        showFavorites();
      } else if (section === 'main') {
        loadProperties();
      }
      closeSideMenu();
    });
  });

  // Обработчики фильтров
  document.getElementById('filter-btn').addEventListener('click', openFilters);
  document.getElementById('close-filters').addEventListener('click', closeFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('property-type').addEventListener('change', updateFilterSections);

  // Обработчики выбора количества комнат
  document.querySelectorAll('.room-selector button').forEach(btn => {
    btn.addEventListener('click', function() {
      const rooms = this.getAttribute('data-rooms');
      this.classList.toggle('active');
      if (this.classList.contains('active')) {
        if (!selectedRooms.includes(rooms)) {
          selectedRooms.push(rooms);
        }
      } else {
        selectedRooms = selectedRooms.filter(r => r !== rooms);
      }
    });
  });

  // Инициализация слайдера цены
  initPriceSlider();

  // Обработчики формы добавления объявления
  initAdForm();

  // Переключение между жилыми/нежилыми помещениями
  document.querySelectorAll('input[name="property-category"]').forEach(radio => {
    radio.addEventListener('change', function() {
      updateFormFieldsByCategory();
    });
  });

  // Адаптация для мобильных устройств
  setupMobileLayout();
  window.addEventListener('resize', setupMobileLayout);
});

function setupMobileLayout() {
  if (window.innerWidth <= 768) {
    document.getElementById('map').style.height = '40vh';
    document.getElementById('properties-list').style.height = '60vh';
  } else {
    document.getElementById('map').style.height = '60vh';
    document.getElementById('properties-list').style.height = '40vh';
  }
}

function logout() {
  localStorage.setItem('currentSection', 'landing');
  document.getElementById('app').style.display = 'none';
  document.getElementById('landing').style.display = 'flex';
  closeSideMenu();
}

// Загрузка объявлений
function loadProperties() {
  // В реальном приложении здесь будет запрос к API
  properties = [
    {
      id: 1,
      title: "2-комнатная квартира в центре",
      description: "Светлая просторная квартира с ремонтом, все удобства. Рядом парк, метро и магазины. Идеально для семьи или пары.",
      price: 450,
      type: "flat",
      category: "residential",
      rooms: 2,
      area: 65,
      address: "Ташкент, Мирабадский район, ул. Навои 12",
      location: [69.2401, 41.2995],
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      amenities: ["internet", "ac", "washer", "fridge", "tv"],
      images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ]
    },
    {
      id: 2,
      title: "Офисное помещение 50 м²",
      description: "Готовый офис в бизнес-центре, отдельный вход. Кондиционер, интернет, охрана. Отличное расположение в центре города.",
      price: 800,
      type: "office",
      category: "commercial",
      area: 50,
      address: "Ташкент, Шайхантахурский район, ул. Амира Темура 108",
      location: [69.2450, 41.3050],
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      amenities: ["internet", "ac", "phone"],
      images: [
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ]
    },
    {
      id: 3,
      title: "1-комнатная квартира",
      description: "Уютная квартира в новом доме. Ремонт, мебель, техника. Рядом метро и парк.",
      price: 350,
      type: "flat",
      category: "residential",
      rooms: 1,
      area: 42,
      address: "Ташкент, Чиланзарский район, ул. Бунёдкор 25",
      location: [69.2350, 41.2950],
      image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      amenities: ["internet", "ac", "fridge", "tv"],
      images: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ]
    }
  ];

  // Отображаем объявления
  renderProperties();
  // Добавляем маркеры на карту
  addMarkersToMap();
}

// Показать избранные объявления
function showFavorites() {
  const container = document.getElementById('properties-list');
  container.innerHTML = '<h2 class="section-title">Избранное</h2>';

  if (favorites.length === 0) {
    container.innerHTML += '<div class="empty-state">У вас пока нет избранных объявлений</div>';
    return;
  }

  const favoriteProperties = properties.filter(property => favorites.includes(property.id));
  
  if (favoriteProperties.length === 0) {
    container.innerHTML += '<div class="empty-state">У вас пока нет избранных объявлений</div>';
    return;
  }

  favoriteProperties.forEach(property => {
    const propertyElement = document.createElement('div');
    propertyElement.className = 'property-card';
    propertyElement.setAttribute('data-id', property.id);
    
    propertyElement.innerHTML = `
      <div class="property-image">
        <img src="${property.image}" alt="${property.title}">
      </div>
      <div class="property-details">
        <div class="property-price">$${property.price}</div>
        <h3 class="property-title">${property.title}</h3>
        <div class="property-address">
          <i class="fas fa-map-marker-alt"></i> ${property.address}
        </div>
        <div class="property-features">
          ${property.category === 'residential' ? `
            <div class="property-feature">
              <i class="fas fa-door-open"></i> ${property.rooms} комнаты
            </div>
          ` : `
            <div class="property-feature">
              <i class="fas fa-building"></i> ${property.type === 'office' ? 'Офис' : 'Коммерческое'}
            </div>
          `}
          <div class="property-feature">
            <i class="fas fa-ruler-combined"></i> ${property.area} м²
          </div>
        </div>
        <p class="property-description">${property.description.substring(0, 100)}...</p>
        <div class="property-actions">
          <button class="btn-secondary btn-favorite active" data-id="${property.id}">
            <i class="fas fa-heart"></i> В избранном
          </button>
          <button class="btn-primary btn-view" data-id="${property.id}">
            <i class="fas fa-eye"></i> Подробнее
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(propertyElement);
  });

  // Добавляем обработчики для кнопок
  setupPropertyButtons();
}

// Отображение списка объявлений
function renderProperties() {
  const container = document.getElementById('properties-list');
  container.innerHTML = '<h2 class="section-title">Все объявления</h2>';
  
  if (properties.length === 0) {
    container.innerHTML += '<div class="empty-state">Объявления не найдены</div>';
    return;
  }

  properties.forEach(property => {
    const isFavorite = favorites.includes(property.id);
    const propertyElement = document.createElement('div');
    propertyElement.className = 'property-card';
    propertyElement.setAttribute('data-id', property.id);
    
    propertyElement.innerHTML = `
      <div class="property-image">
        <img src="${property.image}" alt="${property.title}">
      </div>
      <div class="property-details">
        <div class="property-price">$${property.price}</div>
        <h3 class="property-title">${property.title}</h3>
        <div class="property-address">
          <i class="fas fa-map-marker-alt"></i> ${property.address}
        </div>
        <div class="property-features">
          ${property.category === 'residential' ? `
            <div class="property-feature">
              <i class="fas fa-door-open"></i> ${property.rooms} комнаты
            </div>
          ` : `
            <div class="property-feature">
              <i class="fas fa-building"></i> ${property.type === 'office' ? 'Офис' : 'Коммерческое'}
            </div>
          `}
          <div class="property-feature">
            <i class="fas fa-ruler-combined"></i> ${property.area} м²
          </div>
        </div>
        <p class="property-description">${property.description.substring(0, 100)}...</p>
        <div class="property-actions">
          <button class="btn-secondary btn-favorite ${isFavorite ? 'active' : ''}" data-id="${property.id}">
            <i class="fas fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
          </button>
          <button class="btn-primary btn-view" data-id="${property.id}">
            <i class="fas fa-eye"></i> Подробнее
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(propertyElement);
  });

  // Добавляем обработчики для кнопок
  setupPropertyButtons();
}

// Настройка обработчиков кнопок объявлений
function setupPropertyButtons() {
  // Обработчики для кнопок "Подробнее"
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      viewPropertyDetails(id);
    });
  });

  // Обработчики для кнопок "Избранное"
  document.querySelectorAll('.btn-favorite').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      toggleFavorite(id, this);
    });
  });
}

// Добавление/удаление из избранного
function toggleFavorite(id, button) {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
    button.classList.add('active');
    button.innerHTML = '<i class="fas fa-heart"></i> В избранном';
  } else {
    favorites.splice(index, 1);
    button.classList.remove('active');
    button.innerHTML = '<i class="fas fa-heart"></i> В избранное';
    
    // Если находимся в разделе избранного, обновляем список
    if (currentSection === 'favorites') {
      showFavorites();
    }
  }
  
  // Сохраняем в localStorage
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Добавление маркеров на карту (оптимизированная версия)
function addMarkersToMap() {
  // Удаляем старые маркеры
  markers.forEach(marker => marker.remove());
  markers = [];

  // Кластеризация для большого количества объявлений
  const clusterMarkers = {};
  const clusterRadius = 0.0005; // Радиус кластеризации в градусах

  properties.forEach(property => {
    // Проверяем, можно ли объединить маркер с существующим кластером
    let clustered = false;
    for (const key in clusterMarkers) {
      const cluster = clusterMarkers[key];
      const distance = Math.sqrt(
        Math.pow(property.location[0] - cluster.center[0], 2) + 
        Math.pow(property.location[1] - cluster.center[1], 2)
      );

      if (distance < clusterRadius) {
        cluster.properties.push(property);
        clustered = true;
        break;
      }
    }

    // Если не объединили в кластер, создаем новый
    if (!clustered) {
      const key = `${property.location[0]}_${property.location[1]}`;
      clusterMarkers[key] = {
        center: property.location,
        properties: [property]
      };
    }
  });

  // Создаем маркеры для кластеров
  for (const key in clusterMarkers) {
    const cluster = clusterMarkers[key];
    const count = cluster.properties.length;
    const property = cluster.properties[0]; // Берем первое свойство для отображения

    // Создаем элемент маркера
    const markerElement = document.createElement('div');
    markerElement.className = 'property-marker';
    markerElement.innerHTML = count > 1 ? 
      `<div class="marker-cluster">${count}</div>` : 
      `<div class="marker-price ${property.category === 'commercial' ? 'commercial' : ''}">$${property.price}</div>`;

    // Создаем попап с информацией
    const popupContent = document.createElement('div');
    popupContent.className = 'map-popup';
    
    if (count > 1) {
      popupContent.innerHTML = `
        <div class="popup-header">
          <h4>${count} объявлений в этом районе</h4>
        </div>
        <div class="popup-list">
          ${cluster.properties.slice(0, 3).map(p => `
            <div class="popup-item" data-id="${p.id}">
              <div class="popup-item-price">$${p.price}</div>
              <div class="popup-item-title">${p.title}</div>
            </div>
          `).join('')}
          ${count > 3 ? `<div class="popup-more">+${count - 3} ещё</div>` : ''}
        </div>
      `;
    } else {
      popupContent.innerHTML = `
        <div class="popup-image" style="background-image: url('${property.image}')"></div>
        <div class="popup-details">
          <h4>${property.title}</h4>
          <div class="popup-price">$${property.price}</div>
          <div class="popup-address">
            <i class="fas fa-map-marker-alt"></i> ${property.address}
          </div>
          <div class="popup-features">
            ${property.category === 'residential' ? 
              `<span><i class="fas fa-door-open"></i> ${property.rooms} комн.</span>` : 
              `<span><i class="fas fa-building"></i> ${property.type === 'office' ? 'Офис' : 'Коммерческое'}</span>`}
            <span><i class="fas fa-ruler-combined"></i> ${property.area} м²</span>
          </div>
          <button class="btn-primary btn-sm btn-view" data-id="${property.id}">Подробнее</button>
        </div>
      `;
    }

    // Создаем попап
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      className: 'custom-popup'
    }).setDOMContent(popupContent);

    // Создаем маркер
    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'bottom'
    })
      .setLngLat(cluster.center)
      .setPopup(popup)
      .addTo(map);

    // Добавляем обработчики событий для маркера
    markerElement.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activePopup) activePopup.remove();
      marker.togglePopup();
      activePopup = popup;
      
      // Обработка клика по элементам в попапе
      setTimeout(() => {
        document.querySelectorAll('.popup-item, .btn-view').forEach(el => {
          el.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (id) viewPropertyDetails(id);
          });
        });
      }, 100);
    });

    markers.push(marker);
  }
}

// Просмотр деталей объявления
function viewPropertyDetails(id) {
  const property = properties.find(p => p.id == id);
  if (!property) return;

  currentPropertyView = id;

  // Скрываем карту на мобильных устройствах
  if (window.innerWidth <= 768) {
    document.getElementById('map').style.display = 'none';
    document.getElementById('properties-list').style.height = '100vh';
  }

  const isFavorite = favorites.includes(property.id);
  
  // Создаем детальное представление
  const container = document.getElementById('properties-list');
  container.innerHTML = `
    <div class="property-detail">
      <button class="btn-back" id="back-to-list">
        <i class="fas fa-arrow-left"></i> Назад к списку
      </button>
      
      <div class="detail-gallery">
        <div class="main-image" style="background-image: url('${property.image}')"></div>
        <div class="thumbnails">
          ${property.images.map(img => `
            <div class="thumbnail" style="background-image: url('${img}')"></div>
          `).join('')}
        </div>
      </div>
      
      <div class="detail-content">
        <div class="detail-header">
          <h2>${property.title}</h2>
          <div class="detail-price">$${property.price}</div>
        </div>
        
        <div class="detail-address">
          <i class="fas fa-map-marker-alt"></i> ${property.address}
        </div>
        
        <div class="detail-features">
          ${property.category === 'residential' ? `
            <div class="feature">
              <i class="fas fa-door-open"></i>
              <span>${property.rooms} комнаты</span>
            </div>
          ` : `
            <div class="feature">
              <i class="fas fa-building"></i>
              <span>${property.type === 'office' ? 'Офис' : 'Коммерческое'}</span>
            </div>
          `}
          <div class="feature">
            <i class="fas fa-ruler-combined"></i>
            <span>${property.area} м²</span>
          </div>
        </div>
        
        <div class="detail-description">
          <h3>Описание</h3>
          <p>${property.description}</p>
        </div>
        
        <div class="detail-amenities">
          <h3>Удобства</h3>
          <div class="amenities-grid">
            ${property.amenities.map(amenity => `
              <div class="amenity">
                <i class="fas fa-check"></i> ${getAmenityName(amenity)}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="detail-actions">
          <button class="btn-secondary btn-favorite ${isFavorite ? 'active' : ''}" data-id="${property.id}">
            <i class="fas fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
          </button>
          <button class="btn-primary"><i class="fas fa-phone"></i> Позвонить</button>
        </div>
      </div>
    </div>
  `;

  // Обработчик кнопки "Назад"
  document.getElementById('back-to-list').addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      document.getElementById('map').style.display = 'block';
      document.getElementById('properties-list').style.height = '60vh';
    }
    
    if (currentSection === 'favorites') {
      showFavorites();
    } else {
      renderProperties();
    }
  });

  // Обработчики для миниатюр изображений
  document.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.addEventListener('click', function() {
      const imgUrl = this.style.backgroundImage.replace('url("', '').replace('")', '');
      document.querySelector('.main-image').style.backgroundImage = `url('${imgUrl}')`;
    });
  });

  // Обработчик кнопки "Избранное"
  document.querySelector('.btn-favorite').addEventListener('click', function() {
    const id = parseInt(this.getAttribute('data-id'));
    toggleFavorite(id, this);
  });
}

function getAmenityName(amenity) {
  const names = {
    'internet': 'Интернет',
    'ac': 'Кондиционер',
    'washer': 'Стиральная машина',
    'fridge': 'Холодильник',
    'tv': 'Телевизор',
    'phone': 'Телефон'
  };
  return names[amenity] || amenity;
}

// Инициализация Mapbox (оптимизированная)
function initMapbox() {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [69.2401, 41.2995],
    zoom: 12,
    interactive: true,
    renderWorldCopies: false // Отключаем дублирование карты мира
  });

  // Добавление элементов управления
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    fitBoundsOptions: { maxZoom: 14 }
  }));

  // Оптимизация производительности
  map.on('load', function() {
    map.resize();
    addMarkersToMap();
    
    // Обработчик клика по карте (закрытие попапов)
    map.on('click', () => {
      if (activePopup) {
        activePopup.remove();
        activePopup = null;
      }
    });
  });
}

// Показать основное приложение
function showApp() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  currentSection = 'main';
  localStorage.setItem('currentSection', 'main');
  
  setTimeout(() => {
    if (map) map.resize();
    setupMobileLayout();
  }, 300);
}

// Показать приложение и открыть форму
function showAppAndOpenForm() {
  showApp();
  openAdModal();
}

// Открытие бокового меню
function openSideMenu() {
  document.getElementById('side-menu').classList.add('active');
}

// Закрытие бокового меню
function closeSideMenu() {
  document.getElementById('side-menu').classList.remove('active');
}

// Открытие фильтров
function openFilters() {
  document.getElementById('filters-panel').classList.add('active');
}

// Закрытие фильтров
function closeFilters() {
  document.getElementById('filters-panel').classList.remove('active');
}

// Обновление секций фильтров
function updateFilterSections() {
  const type = document.getElementById('property-type').value;
  
  if (type === 'commercial') {
    document.querySelectorAll('.residential-filters').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.commercial-filters').forEach(el => {
      el.style.display = 'block';
    });
  } else {
    document.querySelectorAll('.residential-filters').forEach(el => {
      el.style.display = 'block';
    });
    document.querySelectorAll('.commercial-filters').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// Сброс фильтров
function resetFilters() {
  const inputs = document.querySelectorAll('#filters-panel input:not([type="checkbox"])');
  const selects = document.querySelectorAll('#filters-panel select');
  const checkboxes = document.querySelectorAll('#filters-panel input[type="checkbox"]');
  
  inputs.forEach(input => input.value = '');
  selects.forEach(select => select.selectedIndex = 0);
  checkboxes.forEach(checkbox => checkbox.checked = false);
  
  document.querySelectorAll('.room-selector button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.getElementById('price-min').value = 500;
  document.getElementById('price-max').value = 1500;
  document.getElementById('min-value').textContent = '500';
  document.getElementById('max-value').textContent = '1500';
  
  selectedRooms = [];
  priceRange = { min: 0, max: 2000 };
}

// Применение фильтров
function applyFilters() {
  const minPrice = parseInt(document.getElementById('price-min').value);
  const maxPrice = parseInt(document.getElementById('price-max').value);
  const minArea = document.getElementById('area-min').value ? parseInt(document.getElementById('area-min').value) : null;
  const maxArea = document.getElementById('area-max').value ? parseInt(document.getElementById('area-max').value) : null;
  const propertyType = document.getElementById('property-type').value;
  
  priceRange = { min: minPrice, max: maxPrice };
  
  // Фильтрация объявлений
  let filteredProperties = properties.filter(property => {
    // Фильтр по цене
    if (property.price < minPrice || property.price > maxPrice) return false;
    
    // Фильтр по типу недвижимости
    if (propertyType && property.category !== propertyType) return false;
    
    // Фильтр по площади
    if (minArea && property.area < minArea) return false;
    if (maxArea && property.area > maxArea) return false;
    
    // Фильтр по количеству комнат (для жилой недвижимости)
    
if (property.category === 'residential' && selectedRooms.length > 0) {
  if (selectedRooms.includes('studio') && property.rooms === 0) return true;
  if (!selectedRooms.includes(property.rooms.toString())) {
    if (!(selectedRooms.includes('4+') && property.rooms >= 4)) return false;
  }
}

return true;
  });
  
  // Обновляем список объявлений
  properties = filteredProperties.length > 0 ? filteredProperties : properties;
  renderProperties();
  addMarkersToMap();
  
  closeFilters();
}

// Инициализация слайдера цены
function initPriceSlider() {
  const priceMin = document.getElementById('price-min');
  const priceMax = document.getElementById('price-max');
  const minValue = document.getElementById('min-value');
  const maxValue = document.getElementById('max-value');
  
  minValue.textContent = priceMin.value;
  maxValue.textContent = priceMax.value;
  
  priceMin.addEventListener('input', function() {
    if (parseInt(priceMin.value) > parseInt(priceMax.value)) {
      priceMin.value = priceMax.value;
    }
    minValue.textContent = priceMin.value;
  });
  
  priceMax.addEventListener('input', function() {
    if (parseInt(priceMax.value) < parseInt(priceMin.value)) {
      priceMax.value = priceMin.value;
    }
    maxValue.textContent = priceMax.value;
  });
}

// Инициализация формы добавления объявления
function initAdForm() {
  document.getElementById('add-btn').addEventListener('click', openAdModal);
  document.getElementById('close-ad-modal').addEventListener('click', closeAdModal);
  document.getElementById('next-step').addEventListener('click', nextStep);
  document.getElementById('prev-step').addEventListener('click', prevStep);
  document.getElementById('open-map-btn').addEventListener('click', openMapModal);
  document.getElementById('cancel-location').addEventListener('click', closeMapModal);
  document.getElementById('confirm-location').addEventListener('click', confirmLocation);
  document.getElementById('title').addEventListener('input', function() {
    document.getElementById('title-counter').textContent = this.value.length;
  });
  document.getElementById('photos').addEventListener('change', handleFileUpload);
  document.getElementById('ad-form').addEventListener('submit', submitForm);
}

// Открытие формы добавления объявления
function openAdModal() {
  document.getElementById('ad-modal').classList.add('active');
  currentStep = 1;
  updateFormSteps();
}

// Закрытие формы добавления объявления
function closeAdModal() {
  document.getElementById('ad-modal').classList.remove('active');
  // Сброс формы
  document.getElementById('ad-form').reset();
  uploadedPhotos = [];
  document.getElementById('preview-grid').innerHTML = '';
  document.getElementById('title-counter').textContent = '0';
  selectedLocation = null;
  document.getElementById('location').value = '';
  document.getElementById('address').value = '';
  document.getElementById('location-map-preview').style.backgroundImage = 'none';
  document.getElementById('location-map-preview').innerHTML = '<i class="fas fa-map-marked-alt"></i>';
}

// Следующий шаг формы
function nextStep() {
  if (validateStep(currentStep)) {
    currentStep++;
    updateFormSteps();
  }
}

// Предыдущий шаг формы
function prevStep() {
  currentStep--;
  updateFormSteps();
}

// Валидация шага формы
function validateStep(step) {
  let isValid = true;
  const activeStep = document.querySelector(`.form-step[data-step="${step}"]`);
  
  // Очищаем предыдущие ошибки
  activeStep.querySelectorAll('.error').forEach(el => {
    el.classList.remove('error');
  });
  
  activeStep.querySelectorAll('.error-message').forEach(el => {
    el.remove();
  });
  
  // Проверяем поля в зависимости от шага
  switch(step) {
    case 1:
      const title = document.getElementById('title');
      const price = document.getElementById('price');
      const category = document.getElementById('category');
      
      if (!title.value.trim()) {
        showError(title, 'Пожалуйста, укажите заголовок объявления');
        isValid = false;
      }
      
      if (!price.value.trim()) {
        showError(price, 'Пожалуйста, укажите цену');
        isValid = false;
      } else if (parseInt(price.value) <= 0) {
        showError(price, 'Цена должна быть больше 0');
        isValid = false;
      }
      
      if (!category.value) {
        showError(category, 'Пожалуйста, выберите категорию');
        isValid = false;
      }
      break;
      
    case 2:
      const isCommercial = document.querySelector('input[name="property-category"]:checked').value === 'commercial';
      
      if (isCommercial) {
        const commercialArea = document.getElementById('commercial-area');
        if (!commercialArea.value.trim()) {
          showError(commercialArea, 'Пожалуйста, укажите площадь');
          isValid = false;
        } else if (parseInt(commercialArea.value) <= 0) {
          showError(commercialArea, 'Площадь должна быть больше 0');
          isValid = false;
        }
      } else {
        const totalArea = document.getElementById('total-area');
        if (!totalArea.value.trim()) {
          showError(totalArea, 'Пожалуйста, укажите общую площадь');
          isValid = false;
        } else if (parseInt(totalArea.value) <= 0) {
          showError(totalArea, 'Площадь должна быть больше 0');
          isValid = false;
        }
      }
      break;
      
    case 4:
      if (uploadedPhotos.length < 3) {
        alert('Пожалуйста, загрузите минимум 3 фотографии');
        isValid = false;
      }
      break;
      
    case 5:
      const contactName = document.getElementById('contact-name');
      const contactPhone = document.getElementById('contact-phone');
      
      if (!contactName.value.trim()) {
        showError(contactName, 'Пожалуйста, укажите ваше имя');
        isValid = false;
      }
      
      if (!contactPhone.value.trim()) {
        showError(contactPhone, 'Пожалуйста, укажите номер телефона');
        isValid = false;
      }
      break;
  }
  
  return isValid;
}

// Показать ошибку валидации
function showError(element, message) {
  element.classList.add('error');
  
  // Создаем или обновляем сообщение об ошибке
  let errorElement = element.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains('error-message')) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    element.parentNode.insertBefore(errorElement, element.nextSibling);
  }
  
  errorElement.textContent = message;
  errorElement.style.color = 'var(--red)';
  errorElement.style.fontSize = '0.8rem';
  errorElement.style.marginTop = '0.2rem';
}

// Обновление отображения шагов формы
function updateFormSteps() {
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
  
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
  });
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
  
  document.getElementById('prev-step').disabled = currentStep === 1;
  
  if (currentStep < 5) {
    document.getElementById('next-step').style.display = 'block';
    document.getElementById('submit-form').style.display = 'none';
  } else {
    document.getElementById('next-step').style.display = 'none';
    document.getElementById('submit-form').style.display = 'block';
  }
}

// Обновление полей формы в зависимости от категории
function updateFormFieldsByCategory() {
  const isCommercial = document.querySelector('input[name="property-category"]:checked').value === 'commercial';
  
  if (isCommercial) {
    document.querySelectorAll('.residential-fields').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.commercial-fields').forEach(el => {
      el.style.display = 'block';
    });
    
    // Обновляем опции в select категории
    document.querySelectorAll('#category option').forEach(opt => {
      if (opt.classList.contains('commercial-option')) {
        opt.style.display = 'block';
      } else {
        opt.style.display = 'none';
      }
    });
    document.getElementById('category').value = '';
  } else {
    document.querySelectorAll('.residential-fields').forEach(el => {
      el.style.display = 'block';
    });
    document.querySelectorAll('.commercial-fields').forEach(el => {
      el.style.display = 'none';
    });
    
    // Обновляем опции в select категории
    document.querySelectorAll('#category option').forEach(opt => {
      if (opt.classList.contains('commercial-option')) {
        opt.style.display = 'none';
      } else {
        opt.style.display = 'block';
      }
    });
    document.getElementById('category').value = '';
  }
}

// Открытие модального окна карты
function openMapModal() {
  document.getElementById('map-modal').classList.add('active');
  
  if (!locationMap) {
    locationMap = new mapboxgl.Map({
      container: 'location-map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [69.2401, 41.2995],
      zoom: 12
    });
    
    // Добавляем поиск по адресу
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: 'Поиск адреса',
      language: 'ru'
    });
    
    document.getElementById('location-map').appendChild(geocoder.onAdd(locationMap));
    
    const marker = new mapboxgl.Marker({
      draggable: true
    })
      .setLngLat([69.2401, 41.2995])
      .addTo(locationMap);
    
    marker.on('dragend', function() {
      const lngLat = marker.getLngLat();
      selectedLocation = {
        lng: lngLat.lng,
        lat: lngLat.lat
      };
      
      // Получаем адрес по координатам
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${MAPBOX_TOKEN}&language=ru`)
        .then(response => response.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            document.getElementById('address').value = data.features[0].place_name;
          }
        });
    });
    
    locationMap.on('click', function(e) {
      marker.setLngLat(e.lngLat);
      selectedLocation = {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat
      };
      
      // Получаем адрес по координатам
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?access_token=${MAPBOX_TOKEN}&language=ru`)
        .then(response => response.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            document.getElementById('address').value = data.features[0].place_name;
          }
        });
    });
    
    // Обработчик выбора адреса из поиска
    geocoder.on('result', function(e) {
      selectedLocation = {
        lng: e.result.center[0],
        lat: e.result.center[1]
      };
      marker.setLngLat(e.result.center);
      document.getElementById('address').value = e.result.place_name;
    });
  }
}

// Закрытие модального окна карты
function closeMapModal() {
  document.getElementById('map-modal').classList.remove('active');
}

// Подтверждение выбора местоположения
function confirmLocation() {
  if (selectedLocation) {
    document.getElementById('location').value = `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
    
    const preview = document.getElementById('location-map-preview');
    preview.innerHTML = '';
    preview.style.backgroundImage = `url(https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${selectedLocation.lng},${selectedLocation.lat})/${selectedLocation.lng},${selectedLocation.lat},15,0/300x200?access_token=${MAPBOX_TOKEN})`;
    preview.style.backgroundSize = 'cover';
  }
  closeMapModal();
}

// Обработка загрузки файлов
function handleFileUpload(e) {
  const files = e.target.files;
  const previewGrid = document.getElementById('preview-grid');
  
  previewGrid.innerHTML = '';
  uploadedPhotos = [];
  
  if (files.length > 10) {
    alert('Можно загрузить не более 10 фотографий');
    return;
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (file.size > 10 * 1024 * 1024) {
      alert(`Файл "${file.name}" слишком большой (макс. 10 МБ)`);
      continue;
    }
    
    if (!file.type.match('image.*')) {
      alert(`Файл "${file.name}" не является изображением`);
      continue;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button class="remove-btn" data-index="${uploadedPhotos.length}">&times;</button>
      `;
      
      previewGrid.appendChild(previewItem);
      
      previewItem.querySelector('.remove-btn').addEventListener('click', function() {
        removePhoto(parseInt(this.getAttribute('data-index')));
      });
      
      uploadedPhotos.push(file);
    };
    
    reader.readAsDataURL(file);
  }
}

// Удаление фотографии
function removePhoto(index) {
  uploadedPhotos.splice(index, 1);
  
  const previewGrid = document.getElementById('preview-grid');
  previewGrid.innerHTML = '';
  
  uploadedPhotos.forEach((file, i) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.innerHTML = `
      <img src="${URL.createObjectURL(file)}" alt="Preview">
      <button class="remove-btn" data-index="${i}">&times;</button>
    `;
    
    previewGrid.appendChild(previewItem);
    
    previewItem.querySelector('.remove-btn').addEventListener('click', function() {
      removePhoto(parseInt(this.getAttribute('data-index')));
    });
  });
}

// Отправка формы
function submitForm(e) {
  e.preventDefault();
  
  if (!validateStep(currentStep)) return;
  
  const isCommercial = document.querySelector('input[name="property-category"]:checked').value === 'commercial';
  const formData = {
    category: document.getElementById('category').value,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    price: document.getElementById('price').value,
    additionalInfo: document.getElementById('additional-info').value,
    adType: document.querySelector('input[name="ad-type"]:checked').value,
    address: document.getElementById('address').value,
    location: document.getElementById('location').value,
    contactName: document.getElementById('contact-name').value,
    contactPhone: document.getElementById('contact-phone').value,
    contactEmail: document.getElementById('contact-email').value,
    contactTelegram: document.getElementById('contact-telegram').value,
    contactWhatsapp: document.getElementById('contact-whatsapp').value,
    callTime: document.querySelector('input[name="call-time"]:checked').value,
    amenities: getSelectedCheckboxes('amenities'),
    infrastructure: getSelectedCheckboxes('infrastructure'),
    photos: uploadedPhotos.length
  };

  if (isCommercial) {
    formData.businessType = document.getElementById('business-type').value;
    formData.totalArea = document.getElementById('commercial-area').value;
    formData.propertyClass = document.getElementById('property-class').value;
    formData.floor = document.getElementById('commercial-floor').value;
    formData.totalFloors = document.getElementById('commercial-total-floors').value;
    formData.finish = document.getElementById('commercial-finish').value;
    formData.utilities = document.getElementById('utilities').value;
    formData.ceilingHeight = document.getElementById('commercial-ceiling-height').value;
    formData.buildYear = document.getElementById('commercial-build-year').value;
    formData.parking = document.getElementById('parking').value;
    formData.entrance = document.getElementById('entrance').value;
    formData.security = document.getElementById('security').value;
    formData.commission = document.getElementById('commercial-commission').value;
    formData.commercialFeatures = getSelectedCheckboxes('commercial-features');
  } else {
    formData.rooms = document.getElementById('rooms').value;
    formData.livingArea = document.getElementById('living-area').value;
    formData.totalArea = document.getElementById('total-area').value;
    formData.kitchenArea = document.getElementById('kitchen-area').value;
    formData.floor = document.getElementById('floor').value;
    formData.totalFloors = document.getElementById('total-floors').value;
    formData.buildingType = document.getElementById('building-type').value;
    formData.layout = document.getElementById('layout').value;
    formData.buildYear = document.getElementById('build-year').value;
    formData.bathroom = document.getElementById('bathroom').value;
    formData.furnished = document.getElementById('furnished').value;
    formData.ceilingHeight = document.getElementById('ceiling-height').value;
    formData.repair = document.getElementById('repair').value;
    formData.commission = document.getElementById('commission').value;
  }
  
  const message = formatTelegramMessage(formData);
  sendToTelegram(message);
}

// Получение выбранных чекбоксов
function getSelectedCheckboxes(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

// Форматирование сообщения для Telegram
function formatTelegramMessage(data) {
  const isCommercial = data.category === 'commercial' || 
                      data.category === 'office' || 
                      data.category === 'restaurant' || 
                      data.category === 'warehouse';
  
  let message = `🏠 *Новое объявление: ${data.title}*\n\n`;
  message += `💰 *Цена:* ${data.price} $\n`;
  message += `📌 *Тип:* ${isCommercial ? 'Нежилое' : 'Жилое'}\n`;
  message += `🏷 *Категория:* ${getOptionText('category', data.category)}\n`;
  message += `📍 *Адрес:* ${data.address || 'Не указан'}\n`;
  message += `📝 *Описание:* ${data.description || 'Не указано'}\n\n`;
  
  if (isCommercial) {
    message += `🔹 *Характеристики коммерческого помещения*\n`;
    message += `📐 *Площадь:* ${data.totalArea || '?'} м²\n`;
    message += `🏢 *Тип бизнеса:* ${data.businessType ? getOptionText('business-type', data.businessType) : 'Не указано'}\n`;
    message += `⭐ *Класс:* ${data.propertyClass || 'Не указан'}\n`;
    message += `🏗 *Отделка:* ${data.finish || 'Не указана'}\n`;
    message += `⚡ *Коммуникации:* ${data.utilities || 'Не указаны'}\n`;
    message += `📏 *Высота потолков:* ${data.ceilingHeight || '?'} м\n`;
    message += `📅 *Год постройки:* ${data.buildYear || 'Не указан'}\n`;
    message += `🅿 *Парковка:* ${data.parking || 'Не указана'}\n`;
    message += `🚪 *Вход:* ${data.entrance || 'Не указан'}\n`;
    message += `👮 *Охрана:* ${data.security || 'Не указана'}\n`;
    message += `💼 *Комиссионные:* ${data.commission === 'yes' ? 'Да' : 'Нет'}\n\n`;
    
    if (data.commercialFeatures && data.commercialFeatures.length > 0) {
      message += `🔹 *Особенности помещения*\n`;
      message += `${data.commercialFeatures.join(', ')}\n\n`;
    }
  } else {
    message += `🔹 *Характеристики жилья*\n`;
    message += `🛏 *Комнат:* ${data.rooms || 'Не указано'}\n`;
    message += `📐 *Площадь:* ${data.livingArea || '?'} м² (жилая), ${data.totalArea || '?'} м² (общая)\n`;
    message += `🍳 *Кухня:* ${data.kitchenArea || '?'} м²\n`;
    message += `🏢 *Этаж:* ${data.floor || '?'}/${data.totalFloors || '?'}\n`;
    message += `🧱 *Тип дома:* ${getOptionText('building-type', data.buildingType)}\n`;
    message += `🚪 *Планировка:* ${getOptionText('layout', data.layout)}\n`;
    message += `📅 *Год постройки:* ${data.buildYear || 'Не указан'}\n`;
    message += `🚽 *Санузел:* ${getOptionText('bathroom', data.bathroom)}\n`;
    message += `🛋 *Меблирована:* ${data.furnished === 'yes' ? 'Да' : 'Нет'}\n`;
    message += `📏 *Высота потолков:* ${data.ceilingHeight || '?'} м\n`;
    message += `🛠 *Ремонт:* ${getOptionText('repair', data.repair)}\n`;
    message += `💼 *Комиссионные:* ${data.commission === 'yes' ? 'Да' : 'Нет'}\n\n`;
    
    if (data.amenities && data.amenities.length > 0) {
      message += `🔹 *Удобства в квартире*\n`;
      message += `${data.amenities.join(', ')}\n\n`;
    }
  }
  
  message += `📍 *Координаты:* ${data.location || 'Не указаны'}\n\n`;
  
  message += `🔹 *Рядом есть*\n`;
  if (data.infrastructure && data.infrastructure.length > 0) {
    message += `${data.infrastructure.join(', ')}\n\n`;
  } else {
    message += `Не указано\n\n`;
  }
  
  message += `📞 *Контактная информация*\n`;
  message += `👤 *Имя:* ${data.contactName}\n`;
  message += `📱 *Телефон:* ${data.contactPhone}\n`;
  if (data.contactEmail) message += `📧 *Email:* ${data.contactEmail}\n`;
  if (data.contactTelegram) message += `✈️ *Telegram:* ${data.contactTelegram}\n`;
  if (data.contactWhatsapp) message += `💚 *WhatsApp:* ${data.contactWhatsapp}\n`;
  message += `⏰ *Когда звонить:* ${getCallTimeText(data.callTime)}\n\n`;
  
  message += `📷 *Фотографии:* ${data.photos} шт.`;
  
  return message;
}

// Получение текста для выбранного значения select
function getOptionText(selectId, value) {
  if (!value) return 'Не указано';
  const select = document.getElementById(selectId);
  const options = select.options;
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      return options[i].text;
    }
  }
  return value;
}

// Получение текста для времени звонков
function getCallTimeText(value) {
  switch(value) {
    case 'anytime': return 'В любое время';
    case 'daytime': return 'Только днем (9:00-18:00)';
    case 'evening': return 'Только вечером (18:00-21:00)';
    default: return 'Не указано';
  }
}

// Отправка сообщения в Telegram
function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
  
  fetch(url)
    .then(response => {
      if (response.ok) {
        alert('✅ Объявление успешно отправлено в Telegram!');
        closeAdModal();
        loadProperties();
      } else {
        throw new Error('Ошибка отправки');
      }
    })
    .catch(error => {
      console.error('Ошибка:', error);
      alert('❌ Произошла ошибка при отправке объявления');
    });
}

