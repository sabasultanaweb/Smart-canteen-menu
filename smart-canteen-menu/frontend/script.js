/**
 * Smart Canteen Menu - Frontend Client Logic
 * -------------------------------------------------------------
 * Vanilla JavaScript implementation for menu browsing, cart checkout,
 * real-time token board display, order status tracking, and staff dashboard.
 */

// Determine API Base URL (handles direct localhost:5000, Live Server, or file://)
const API_BASE_URL = (window.location.protocol.startsWith('http') && window.location.port === '5000')
  ? '' 
  : 'http://localhost:5000';

const WS_BASE_URL = (window.location.protocol.startsWith('http') && window.location.port === '5000')
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  : 'ws://localhost:5000';

// ============================================================================
// APPLICATION STATE
// ============================================================================
const state = {
  menuItems: [],
  orders: [],
  stats: null,
  cart: JSON.parse(localStorage.getItem('smart_canteen_cart') || '[]'),
  currentTab: 'menu-view',
  activeCategory: 'All',
  activeDiet: 'all',
  searchQuery: '',
  sortBy: 'featured',
  adminStatusFilter: 'all',
  trackedOrder: null,
  ws: null,
  reconnectAttempts: 0
};

// ============================================================================
// DOM ELEMENTS SELECTOR CACHE
// ============================================================================
const elements = {
  // Navigation
  navBtns: document.querySelectorAll('.nav-btn, .mobile-nav-link'),
  mobileToggle: document.getElementById('mobile-menu-toggle'),
  mobileTray: document.getElementById('mobile-nav-tray'),
  systemStatusPill: document.getElementById('system-status-pill'),
  statusIndicator: document.getElementById('status-indicator'),
  statusLabel: document.getElementById('status-label'),
  tabViews: document.querySelectorAll('.tab-view'),

  // Hero & Metrics
  heroActiveCount: document.getElementById('hero-active-count'),
  heroNowServing: document.getElementById('hero-now-serving'),

  // Menu Section & Controls
  searchInput: document.getElementById('menu-search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  dietBtns: document.querySelectorAll('.diet-btn'),
  sortSelect: document.getElementById('sort-select'),
  categoryPills: document.querySelectorAll('.category-pill'),
  menuGrid: document.getElementById('menu-grid'),
  menuEmptyState: document.getElementById('menu-empty-state'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),
  menuHeading: document.getElementById('menu-heading'),
  menuCaption: document.getElementById('menu-caption'),
  menuCountBadge: document.getElementById('menu-count-badge'),

  // Cart Drawer
  openCartBtn: document.getElementById('open-cart-btn'),
  closeCartBtn: document.getElementById('close-cart-btn'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartBackdrop: document.getElementById('cart-backdrop'),
  cartBadgeCount: document.getElementById('cart-badge-count'),
  navCartTotal: document.getElementById('nav-cart-total'),
  drawerItemCount: document.getElementById('drawer-item-count'),
  cartItemsContainer: document.getElementById('cart-items-container'),
  cartEmptyState: document.getElementById('cart-empty-state'),
  cartCheckoutSection: document.getElementById('cart-checkout-section'),
  summarySubtotal: document.getElementById('summary-subtotal'),
  summaryTotal: document.getElementById('summary-total'),
  checkoutForm: document.getElementById('checkout-form'),
  confirmOrderBtn: document.getElementById('confirm-order-btn'),
  cartBrowseBtn: document.getElementById('cart-browse-btn'),

  // Modals
  successModalBackdrop: document.getElementById('success-modal-backdrop'),
  receiptTokenNumber: document.getElementById('receipt-token-number'),
  receiptCounter: document.getElementById('receipt-counter'),
  receiptEstTime: document.getElementById('receipt-est-time'),
  receiptStudentInfo: document.getElementById('receipt-student-info'),
  trackThisOrderBtn: document.getElementById('track-this-order-btn'),
  closeSuccessModalBtn: document.getElementById('close-success-modal-btn'),

  // Token Board
  refreshBoardBtn: document.getElementById('refresh-board-btn'),
  prepCountBadge: document.getElementById('prep-count-badge'),
  readyCountBadge: document.getElementById('ready-count-badge'),
  preparingTokensList: document.getElementById('preparing-tokens-list'),
  readyTokensList: document.getElementById('ready-tokens-list'),

  // Order Tracker
  trackerForm: document.getElementById('tracker-search-form'),
  trackTokenInput: document.getElementById('track-token-input'),
  trackerPlaceholder: document.getElementById('tracker-placeholder'),
  trackerDetailCard: document.getElementById('tracker-detail-card'),

  // Admin Dashboard
  openAddDishBtn: document.getElementById('open-add-dish-btn'),
  adminRefreshBtn: document.getElementById('admin-refresh-btn'),
  statTotalOrders: document.getElementById('stat-total-orders'),
  statTotalRevenue: document.getElementById('stat-total-revenue'),
  statInKitchen: document.getElementById('stat-in-kitchen'),
  statReadyPickup: document.getElementById('stat-ready-pickup'),
  adminTabOrders: document.getElementById('admin-tab-orders'),
  adminTabDishes: document.getElementById('admin-tab-dishes'),
  adminOrdersBadge: document.getElementById('admin-orders-badge'),
  adminDishesBadge: document.getElementById('admin-dishes-badge'),
  ordersPanel: document.getElementById('orders-panel'),
  dishesPanel: document.getElementById('dishes-panel'),
  adminOrdersTable: document.getElementById('admin-orders-table'),
  adminOrdersTbody: document.getElementById('admin-orders-tbody'),
  adminOrdersEmpty: document.getElementById('admin-orders-empty'),
  adminMenuTbody: document.getElementById('admin-menu-tbody'),
  statusFilterPills: document.querySelectorAll('.pill-btn'),

  // Dish Modal
  dishModalBackdrop: document.getElementById('dish-modal-backdrop'),
  dishModalTitle: document.getElementById('dish-modal-title'),
  dishForm: document.getElementById('dish-form'),
  dishIdHidden: document.getElementById('dish-id-hidden'),
  dishNameInput: document.getElementById('dish-name-input'),
  dishCategorySelect: document.getElementById('dish-category-select'),
  dishPriceInput: document.getElementById('dish-price-input'),
  dishPrepInput: document.getElementById('dish-prep-input'),
  dishDescInput: document.getElementById('dish-desc-input'),
  dishImageInput: document.getElementById('dish-image-input'),
  dishIsvegCheck: document.getElementById('dish-isveg-check'),
  dishIsavailCheck: document.getElementById('dish-isavail-check'),
  closeDishModalBtn: document.getElementById('close-dish-modal-btn'),
  cancelDishBtn: document.getElementById('cancel-dish-btn'),

  // Toast Container
  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupNavigation();
  setupFiltersAndSearch();
  setupCartDrawer();
  setupCheckout();
  setupModals();
  setupOrderTracker();
  setupAdminDashboard();
  initWebSocket();

  // Load Initial Data
  fetchMenuItems();
  fetchOrders();
  fetchStats();
  updateCartUI();
});

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ============================================================================
// WEBSOCKET REAL-TIME SYNC
// ============================================================================
function initWebSocket() {
  try {
    state.ws = new WebSocket(WS_BASE_URL);

    state.ws.onopen = () => {
      state.reconnectAttempts = 0;
      updateConnectionStatus(true);
    };

    state.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleRealtimeEvent(payload);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    state.ws.onclose = () => {
      updateConnectionStatus(false);
      scheduleReconnect();
    };

    state.ws.onerror = (err) => {
      console.warn('WebSocket connection error:', err);
      updateConnectionStatus(false);
    };
  } catch (err) {
    console.warn('Could not establish WebSocket:', err.message);
    updateConnectionStatus(false);
  }
}

function scheduleReconnect() {
  const timeout = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 10000);
  state.reconnectAttempts++;
  setTimeout(() => {
    initWebSocket();
  }, timeout);
}

function updateConnectionStatus(isOnline) {
  if (elements.statusIndicator && elements.statusLabel) {
    if (isOnline) {
      elements.statusIndicator.style.background = 'var(--accent-emerald)';
      elements.statusLabel.textContent = 'Live Sync';
      elements.systemStatusPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    } else {
      elements.statusIndicator.style.background = 'var(--accent-amber)';
      elements.statusLabel.textContent = 'Reconnecting...';
      elements.systemStatusPill.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    }
  }
}

function handleRealtimeEvent(event) {
  const { type, data } = event;

  if (type === 'NEW_ORDER') {
    showToast(`🔔 New Order Token: ${data.token_number} (${data.student_name})`, 'info');
    fetchOrders();
    fetchStats();
  } else if (type === 'ORDER_STATUS_UPDATED') {
    if (data.status === 'Ready') {
      showToast(`🎉 Token ${data.token_number} is READY at ${data.pickup_counter}!`, 'success');
    }
    fetchOrders();
    fetchStats();

    // If currently tracking this token, auto-refresh tracker
    if (state.trackedOrder && state.trackedOrder.token_number === data.token_number) {
      state.trackedOrder = data;
      renderTrackedOrder(data);
    }
  } else if (type === 'MENU_UPDATED') {
    fetchMenuItems();
    fetchStats();
  }
}

// ============================================================================
// NAVIGATION & TAB SWITCHING
// ============================================================================
function setupNavigation() {
  elements.navBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Brand logo click -> go to menu view
  const brandBtn = document.getElementById('brand-home-btn');
  if (brandBtn) {
    brandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('menu-view');
    });
  }

  // Mobile menu toggle
  if (elements.mobileToggle && elements.mobileTray) {
    elements.mobileToggle.addEventListener('click', () => {
      elements.mobileTray.classList.toggle('open');
    });
  }
}

function switchTab(tabId) {
  state.currentTab = tabId;

  // Update nav buttons
  elements.navBtns.forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Switch view containers
  elements.tabViews.forEach((view) => {
    if (view.id === tabId) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Close mobile drawer if open
  if (elements.mobileTray) {
    elements.mobileTray.classList.remove('open');
  }

  // Scroll to top of view
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Tab-specific refreshes
  if (tabId === 'token-board-view') {
    fetchOrders();
  } else if (tabId === 'admin-view') {
    fetchOrders();
    fetchStats();
  }

  initIcons();
}

// ============================================================================
// MENU DATA FETCHING & RENDERING
// ============================================================================
async function fetchMenuItems() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/menu`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      state.menuItems = json.data;
      renderMenu();
      renderAdminMenuCatalog();

      const availableCount = state.menuItems.filter(i => i.is_available).length;
      if (elements.heroActiveCount) {
        elements.heroActiveCount.textContent = `${availableCount} Dishes`;
      }
    }
  } catch (err) {
    console.error('Failed to fetch menu:', err);
    showToast('Failed to connect to canteen server. Please ensure backend is running.', 'error');
  }
}

function renderMenu() {
  if (!elements.menuGrid) return;

  // Apply filters
  let filtered = [...state.menuItems];

  // 1. Category Filter
  if (state.activeCategory !== 'All') {
    filtered = filtered.filter(i => i.category.toLowerCase() === state.activeCategory.toLowerCase());
  }

  // 2. Dietary Filter
  if (state.activeDiet === 'veg') {
    filtered = filtered.filter(i => i.is_veg === true);
  } else if (state.activeDiet === 'non-veg') {
    filtered = filtered.filter(i => i.is_veg === false);
  } else if (state.activeDiet === 'budget') {
    filtered = filtered.filter(i => parseFloat(i.price) <= 50);
  }

  // 3. Search Filter
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(i => 
      i.name.toLowerCase().includes(q) || 
      (i.description && i.description.toLowerCase().includes(q))
    );
  }

  // 4. Sorting
  if (state.sortBy === 'price-low') {
    filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (state.sortBy === 'price-high') {
    filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  } else if (state.sortBy === 'prep-fast') {
    filtered.sort((a, b) => a.preparation_time - b.preparation_time);
  }

  // Update badge count
  if (elements.menuCountBadge) {
    elements.menuCountBadge.textContent = `${filtered.length} Dishes Shown`;
  }

  // Handle Empty State
  if (filtered.length === 0) {
    elements.menuGrid.innerHTML = '';
    elements.menuEmptyState.classList.remove('hidden');
    return;
  }

  elements.menuEmptyState.classList.add('hidden');

  // Render cards
  elements.menuGrid.innerHTML = filtered.map((item) => {
    const isAvailable = item.is_available !== false;
    const isVeg = item.is_veg !== false;
    const formattedPrice = parseFloat(item.price).toFixed(2);
    const imageUrl = item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

    return `
      <article class="menu-card" data-id="${item.id}">
        <div class="card-img-wrap">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'">
          
          <span class="diet-badge ${isVeg ? 'veg' : 'non-veg'}">
            <span class="diet-dot ${isVeg ? 'veg' : 'non-veg'}"></span>
            ${isVeg ? 'Pure Veg' : 'Non-Veg'}
          </span>

          <span class="stock-tag ${isAvailable ? 'in-stock' : 'sold-out'}">
            ${isAvailable ? 'In Stock' : 'Sold Out'}
          </span>
        </div>

        <div class="card-body">
          <span class="card-category-tag">${escapeHtml(item.category)}</span>
          <h3 class="card-title">${escapeHtml(item.name)}</h3>
          <p class="card-desc">${escapeHtml(item.description || 'Prepared fresh with campus hygiene standards.')}</p>

          <div class="card-meta-bar">
            <div class="meta-item">
              <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
              <span>~${item.preparation_time || 10} min</span>
            </div>
            <div class="meta-item">
              <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
              <span>Fresh Batch</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="price-tag">₹${formattedPrice}</div>
            <button class="btn-add-cart" 
                    onclick="addToCart('${item.id}')" 
                    ${!isAvailable ? 'disabled' : ''}>
              <i data-lucide="${isAvailable ? 'plus' : 'slash'}" style="width: 16px; height: 16px;"></i>
              <span>${isAvailable ? 'Add to Tray' : 'Sold Out'}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  initIcons();
}

// ============================================================================
// SEARCH & FILTER HANDLERS
// ============================================================================
function setupFiltersAndSearch() {
  // Search input
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (elements.clearSearchBtn) {
        if (state.searchQuery.length > 0) {
          elements.clearSearchBtn.classList.remove('hidden');
        } else {
          elements.clearSearchBtn.classList.add('hidden');
        }
      }
      renderMenu();
    });
  }

  // Clear search button
  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      renderMenu();
    });
  }

  // Dietary filter buttons
  elements.dietBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      elements.dietBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeDiet = btn.getAttribute('data-diet');
      renderMenu();
    });
  });

  // Sort select
  if (elements.sortSelect) {
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderMenu();
    });
  }

  // Category pills
  elements.categoryPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      elements.categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeCategory = pill.getAttribute('data-category');
      
      if (elements.menuHeading) {
        elements.menuHeading.textContent = state.activeCategory === 'All' 
          ? "Today's Canteen Specials" 
          : `${state.activeCategory} Menu`;
      }

      renderMenu();
    });
  });

  // Reset filters button in empty state
  if (elements.resetFiltersBtn) {
    elements.resetFiltersBtn.addEventListener('click', () => {
      state.searchQuery = '';
      state.activeDiet = 'all';
      state.activeCategory = 'All';
      state.sortBy = 'featured';

      if (elements.searchInput) elements.searchInput.value = '';
      if (elements.clearSearchBtn) elements.clearSearchBtn.classList.add('hidden');
      if (elements.sortSelect) elements.sortSelect.value = 'featured';

      elements.dietBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-diet') === 'all'));
      elements.categoryPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-category') === 'All'));

      renderMenu();
    });
  }
}

// ============================================================================
// CART MANAGEMENT (FOOD TRAY)
// ============================================================================
function setupCartDrawer() {
  if (elements.openCartBtn) {
    elements.openCartBtn.addEventListener('click', openCart);
  }
  if (elements.closeCartBtn) {
    elements.closeCartBtn.addEventListener('click', closeCart);
  }
  if (elements.cartBackdrop) {
    elements.cartBackdrop.addEventListener('click', closeCart);
  }
  if (elements.cartBrowseBtn) {
    elements.cartBrowseBtn.addEventListener('click', () => {
      closeCart();
      switchTab('menu-view');
    });
  }
}

function openCart() {
  elements.cartDrawer.classList.add('open');
  elements.cartBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  elements.cartDrawer.classList.remove('open');
  elements.cartBackdrop.classList.remove('open');
  document.body.style.overflow = '';
}

window.addToCart = function(itemId) {
  const item = state.menuItems.find(i => i.id === itemId);
  if (!item || !item.is_available) return;

  const existing = state.cart.find(i => i.id === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1,
      image_url: item.image_url
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added ${item.name} to food tray`, 'success');
};

window.updateCartQuantity = function(itemId, delta) {
  const itemIndex = state.cart.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return;

  state.cart[itemIndex].quantity += delta;
  if (state.cart[itemIndex].quantity <= 0) {
    state.cart.splice(itemIndex, 1);
  }

  saveCart();
  updateCartUI();
};

function saveCart() {
  localStorage.setItem('smart_canteen_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalItems = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (elements.cartBadgeCount) elements.cartBadgeCount.textContent = totalItems;
  if (elements.drawerItemCount) elements.drawerItemCount.textContent = `${totalItems} items`;
  if (elements.navCartTotal) elements.navCartTotal.textContent = `₹${subtotal.toFixed(2)}`;
  if (elements.summarySubtotal) elements.summarySubtotal.textContent = `₹${subtotal.toFixed(2)}`;
  if (elements.summaryTotal) elements.summaryTotal.textContent = `₹${subtotal.toFixed(2)}`;

  if (totalItems === 0) {
    elements.cartItemsContainer.innerHTML = '';
    elements.cartEmptyState.classList.remove('hidden');
    elements.cartCheckoutSection.classList.add('hidden');
    return;
  }

  elements.cartEmptyState.classList.add('hidden');
  elements.cartCheckoutSection.classList.remove('hidden');

  elements.cartItemsContainer.innerHTML = state.cart.map((item) => `
    <div class="cart-item-card">
      <div class="cart-item-info">
        <span class="cart-item-name">${escapeHtml(item.name)}</span>
        <span class="cart-item-price">₹${item.price.toFixed(2)} each</span>
      </div>

      <div class="cart-qty-controls">
        <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)" title="Decrease">
          <i data-lucide="${item.quantity === 1 ? 'trash-2' : 'minus'}" style="width: 14px; height: 14px;"></i>
        </button>
        <span class="qty-val">${item.quantity}</span>
        <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)" title="Increase">
          <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
    </div>
  `).join('');

  initIcons();
}

// ============================================================================
// CHECKOUT & ORDER SUBMISSION
// ============================================================================
function setupCheckout() {
  if (!elements.checkoutForm) return;

  elements.checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (state.cart.length === 0) {
      showToast('Your tray is empty!', 'error');
      return;
    }

    const studentName = document.getElementById('student-name-input').value.trim();
    const studentId = document.getElementById('student-id-input').value.trim();
    const phone = document.getElementById('student-phone-input').value.trim();
    const pickupCounter = document.getElementById('pickup-counter-select').value;
    const instructions = document.getElementById('order-notes-input').value.trim();

    if (!studentName || !studentId || !phone) {
      showToast('Please fill in all required student details.', 'error');
      return;
    }

    // Toggle button spinner
    const btnText = elements.confirmOrderBtn.querySelector('.btn-text');
    const btnSpinner = elements.confirmOrderBtn.querySelector('.btn-spinner');
    elements.confirmOrderBtn.disabled = true;
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');

    try {
      const orderPayload = {
        student_name: studentName,
        student_id: studentId,
        phone: phone,
        pickup_counter: pickupCounter,
        special_instructions: instructions,
        items: state.cart.map(c => ({
          menu_item_id: c.id,
          name: c.name,
          price: c.price,
          quantity: c.quantity
        }))
      };

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to place order');
      }

      // Order Success!
      const createdOrder = json.data;

      // Clear Cart
      state.cart = [];
      saveCart();
      updateCartUI();
      closeCart();

      // Show Success Modal
      showOrderSuccessModal(createdOrder);

      // Auto update active token in tracking tab
      state.trackedOrder = createdOrder;
      renderTrackedOrder(createdOrder);
      if (elements.trackTokenInput) {
        elements.trackTokenInput.value = createdOrder.token_number;
      }

    } catch (err) {
      console.error('Order error:', err);
      showToast(err.message, 'error');
    } finally {
      elements.confirmOrderBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
    }
  });
}

function showOrderSuccessModal(order) {
  if (!elements.successModalBackdrop) return;

  elements.receiptTokenNumber.textContent = order.token_number;
  elements.receiptCounter.textContent = `Pickup at: ${order.pickup_counter}`;
  elements.receiptEstTime.textContent = `Est. Ready in: ~10-12 mins`;

  elements.receiptStudentInfo.innerHTML = `
    <p><strong>Student:</strong> ${escapeHtml(order.student_name)} (${escapeHtml(order.student_id)})</p>
    <p><strong>Total Amount:</strong> ₹${parseFloat(order.total_amount).toFixed(2)} &bull; <em>Pay at counter via UPI or Cash</em></p>
  `;

  elements.successModalBackdrop.classList.add('open');
  initIcons();
}

function setupModals() {
  if (elements.closeSuccessModalBtn) {
    elements.closeSuccessModalBtn.addEventListener('click', () => {
      elements.successModalBackdrop.classList.remove('open');
    });
  }

  if (elements.trackThisOrderBtn) {
    elements.trackThisOrderBtn.addEventListener('click', () => {
      elements.successModalBackdrop.classList.remove('open');
      switchTab('track-view');
    });
  }

  // Dish modal close
  if (elements.closeDishModalBtn) {
    elements.closeDishModalBtn.addEventListener('click', closeDishModal);
  }
  if (elements.cancelDishBtn) {
    elements.cancelDishBtn.addEventListener('click', closeDishModal);
  }
}

function openDishModal(editItem = null) {
  if (!elements.dishModalBackdrop) return;

  if (editItem) {
    elements.dishModalTitle.textContent = 'Edit Canteen Dish';
    elements.dishIdHidden.value = editItem.id;
    elements.dishNameInput.value = editItem.name;
    elements.dishCategorySelect.value = editItem.category;
    elements.dishPriceInput.value = editItem.price;
    elements.dishPrepInput.value = editItem.preparation_time || 10;
    elements.dishDescInput.value = editItem.description || '';
    elements.dishImageInput.value = editItem.image_url || '';
    elements.dishIsvegCheck.checked = editItem.is_veg !== false;
    elements.dishIsavailCheck.checked = editItem.is_available !== false;
  } else {
    elements.dishModalTitle.textContent = 'Add New Canteen Dish';
    elements.dishForm.reset();
    elements.dishIdHidden.value = '';
    elements.dishIsvegCheck.checked = true;
    elements.dishIsavailCheck.checked = true;
  }

  elements.dishModalBackdrop.classList.add('open');
  initIcons();
}

function closeDishModal() {
  elements.dishModalBackdrop.classList.remove('open');
}

// ============================================================================
// LIVE DIGITAL TOKEN BOARD
// ============================================================================
async function fetchOrders() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      state.orders = json.data;
      renderTokenBoard();
      renderAdminOrders();

      // Update hero latest serving
      const readyOrders = state.orders.filter(o => o.status === 'Ready');
      if (elements.heroNowServing) {
        elements.heroNowServing.textContent = readyOrders.length > 0 
          ? readyOrders[0].token_number 
          : (state.orders.length > 0 ? state.orders[0].token_number : 'CAN-101');
      }
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
  }
}

function renderTokenBoard() {
  if (!elements.preparingTokensList || !elements.readyTokensList) return;

  // Preparing Tokens (status: Pending or Preparing)
  const preparing = state.orders.filter(o => o.status === 'Pending' || o.status === 'Preparing');
  // Ready Tokens
  const ready = state.orders.filter(o => o.status === 'Ready');

  if (elements.prepCountBadge) elements.prepCountBadge.textContent = preparing.length;
  if (elements.readyCountBadge) elements.readyCountBadge.textContent = ready.length;

  // Render Preparing List
  if (preparing.length === 0) {
    elements.preparingTokensList.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-faint);">
        <i data-lucide="coffee" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
        <p>No tokens currently cooking in the kitchen.</p>
      </div>
    `;
  } else {
    elements.preparingTokensList.innerHTML = preparing.map(o => `
      <div class="token-board-card">
        <div class="token-big-id">${o.token_number}</div>
        <div class="token-sub-counter">${escapeHtml(o.pickup_counter || 'Counter 1')}</div>
        <div class="token-timer">${o.status === 'Preparing' ? '🔥 Cooking in Kitchen' : '⏳ Order Queued'}</div>
      </div>
    `).join('');
  }

  // Render Ready List
  if (ready.length === 0) {
    elements.readyTokensList.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-faint);">
        <i data-lucide="bell" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
        <p>No tokens waiting at pickup counter.</p>
      </div>
    `;
  } else {
    elements.readyTokensList.innerHTML = ready.map(o => `
      <div class="token-board-card ready-token">
        <div class="token-big-id">${o.token_number}</div>
        <div class="token-sub-counter">👉 ${escapeHtml(o.pickup_counter || 'Counter 1')}</div>
        <div class="token-timer" style="color: #34d399; font-weight: 700;">READY FOR PICKUP!</div>
      </div>
    `).join('');
  }

  initIcons();
}

if (elements.refreshBoardBtn) {
  elements.refreshBoardBtn.addEventListener('click', () => {
    fetchOrders();
    showToast('Token board refreshed', 'info');
  });
}

// ============================================================================
// ORDER TRACKER LOGIC
// ============================================================================
function setupOrderTracker() {
  if (!elements.trackerForm) return;

  elements.trackerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = elements.trackTokenInput.value.trim().toUpperCase();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/token/${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `No active order found with token ${token}`);
      }

      state.trackedOrder = json.data;
      renderTrackedOrder(json.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function renderTrackedOrder(order) {
  if (!elements.trackerDetailCard || !elements.trackerPlaceholder) return;

  elements.trackerPlaceholder.classList.add('hidden');
  elements.trackerDetailCard.classList.remove('hidden');

  // Status mapping to 4 steps
  // 1: Pending (Order Placed)
  // 2: Preparing (Chef Cooking)
  // 3: Ready (At Counter)
  // 4: Completed (Collected)
  let currentStep = 1;
  let progressWidth = '0%';

  if (order.status === 'Pending') {
    currentStep = 1;
    progressWidth = '15%';
  } else if (order.status === 'Preparing') {
    currentStep = 2;
    progressWidth = '48%';
  } else if (order.status === 'Ready') {
    currentStep = 3;
    progressWidth = '80%';
  } else if (order.status === 'Completed') {
    currentStep = 4;
    progressWidth = '100%';
  }

  const itemsHtml = (order.order_items || []).map(it => `
    <div class="receipt-item-row">
      <span>${escapeHtml(it.item_name)} × ${it.quantity}</span>
      <span style="font-family: var(--font-mono);">₹${(parseFloat(it.price) * it.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  elements.trackerDetailCard.innerHTML = `
    <!-- Stepper -->
    <div class="status-timeline">
      <div class="timeline-progress-bar" style="width: ${progressWidth};"></div>

      <div class="timeline-step ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}">
        <div class="step-circle"><i data-lucide="clipboard-check" style="width: 18px; height: 18px;"></i></div>
        <span class="step-label">Order Received</span>
      </div>

      <div class="timeline-step ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}">
        <div class="step-circle"><i data-lucide="flame" style="width: 18px; height: 18px;"></i></div>
        <span class="step-label">In Kitchen</span>
      </div>

      <div class="timeline-step ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}">
        <div class="step-circle"><i data-lucide="bell" style="width: 18px; height: 18px;"></i></div>
        <span class="step-label">Ready at Counter</span>
      </div>

      <div class="timeline-step ${currentStep >= 4 ? 'completed' : ''}">
        <div class="step-circle"><i data-lucide="check" style="width: 18px; height: 18px;"></i></div>
        <span class="step-label">Picked Up</span>
      </div>
    </div>

    <!-- Details Box -->
    <div class="order-receipt-summary">
      <div class="receipt-header-row">
        <div>
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Live Pickup Token</span>
          <div class="receipt-token-badge">${order.token_number}</div>
        </div>
        <div style="text-align: right;">
          <span class="status-badge ${order.status}">${order.status}</span>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem;">${escapeHtml(order.pickup_counter || 'Counter 1')}</div>
        </div>
      </div>

      <div class="receipt-items-list">
        ${itemsHtml}
      </div>

      <div class="summary-divider"></div>

      <div class="summary-line total-line" style="margin-top: 0.5rem;">
        <span>Total Payable</span>
        <span>₹${parseFloat(order.total_amount).toFixed(2)}</span>
      </div>
      
      <p style="font-size: 0.78rem; color: var(--text-faint); margin-top: 0.75rem;">
        Student: <strong>${escapeHtml(order.student_name)}</strong> &bull; ID: <strong>${escapeHtml(order.student_id)}</strong>
      </p>
    </div>
  `;

  initIcons();
}

// ============================================================================
// CANTEEN STAFF / ADMIN DASHBOARD
// ============================================================================
function setupAdminDashboard() {
  if (elements.openAddDishBtn) {
    elements.openAddDishBtn.addEventListener('click', () => openDishModal());
  }

  if (elements.adminRefreshBtn) {
    elements.adminRefreshBtn.addEventListener('click', () => {
      fetchOrders();
      fetchStats();
      fetchMenuItems();
      showToast('Dashboard refreshed', 'info');
    });
  }

  // Admin sub-tabs (Orders Queue vs Menu Items)
  if (elements.adminTabOrders && elements.adminTabDishes) {
    elements.adminTabOrders.addEventListener('click', () => {
      elements.adminTabOrders.classList.add('active');
      elements.adminTabDishes.classList.remove('active');
      elements.ordersPanel.classList.add('active');
      elements.dishesPanel.classList.remove('active');
    });

    elements.adminTabDishes.addEventListener('click', () => {
      elements.adminTabDishes.classList.add('active');
      elements.adminTabOrders.classList.remove('active');
      elements.dishesPanel.classList.add('active');
      elements.ordersPanel.classList.remove('active');
    });
  }

  // Status Filter Pills
  elements.statusFilterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      elements.statusFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.adminStatusFilter = pill.getAttribute('data-status-filter');
      renderAdminOrders();
    });
  });

  // Dish Form Submission
  if (elements.dishForm) {
    elements.dishForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const dishId = elements.dishIdHidden.value;
      const isEditing = Boolean(dishId);

      const dishPayload = {
        name: elements.dishNameInput.value.trim(),
        category: elements.dishCategorySelect.value,
        price: parseFloat(elements.dishPriceInput.value),
        preparation_time: parseInt(elements.dishPrepInput.value, 10) || 10,
        description: elements.dishDescInput.value.trim(),
        image_url: elements.dishImageInput.value.trim(),
        is_veg: elements.dishIsvegCheck.checked,
        is_available: elements.dishIsavailCheck.checked
      };

      try {
        const url = isEditing ? `${API_BASE_URL}/api/menu/${dishId}` : `${API_BASE_URL}/api/menu`;
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dishPayload)
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to save dish');
        }

        showToast(isEditing ? 'Dish updated successfully!' : 'New dish added to canteen menu!', 'success');
        closeDishModal();
        fetchMenuItems();
        fetchStats();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stats`);
    const json = await res.json();
    if (json.success && json.data) {
      state.stats = json.data;
      renderStats();
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function renderStats() {
  if (!state.stats) return;
  const { totalOrders, totalRevenue, pendingCount, preparingCount, readyCount, totalMenuItems } = state.stats;

  if (elements.statTotalOrders) elements.statTotalOrders.textContent = totalOrders;
  if (elements.statTotalRevenue) elements.statTotalRevenue.textContent = `₹${parseFloat(totalRevenue || 0).toFixed(0)}`;
  if (elements.statInKitchen) elements.statInKitchen.textContent = (pendingCount || 0) + (preparingCount || 0);
  if (elements.statReadyPickup) elements.statReadyPickup.textContent = readyCount || 0;

  if (elements.adminOrdersBadge) elements.adminOrdersBadge.textContent = totalOrders;
  if (elements.adminDishesBadge) elements.adminDishesBadge.textContent = totalMenuItems;
}

function renderAdminOrders() {
  if (!elements.adminOrdersTbody) return;

  let filtered = [...state.orders];
  if (state.adminStatusFilter !== 'all') {
    filtered = filtered.filter(o => o.status.toLowerCase() === state.adminStatusFilter.toLowerCase());
  }

  if (filtered.length === 0) {
    elements.adminOrdersTbody.innerHTML = '';
    elements.adminOrdersEmpty.classList.remove('hidden');
    return;
  }

  elements.adminOrdersEmpty.classList.add('hidden');

  elements.adminOrdersTbody.innerHTML = filtered.map((o) => {
    const itemsSummary = (o.order_items || []).map(i => `${i.item_name} (×${i.quantity})`).join(', ');

    // Next action button logic
    let actionBtnHtml = '';
    if (o.status === 'Pending') {
      actionBtnHtml = `
        <button class="btn-status-advance" onclick="updateOrderStatus('${o.id}', 'Preparing')">
          <i data-lucide="flame" style="width: 14px; height: 14px;"></i> Cook
        </button>
      `;
    } else if (o.status === 'Preparing') {
      actionBtnHtml = `
        <button class="btn-status-advance" onclick="updateOrderStatus('${o.id}', 'Ready')">
          <i data-lucide="bell" style="width: 14px; height: 14px;"></i> Ready
        </button>
      `;
    } else if (o.status === 'Ready') {
      actionBtnHtml = `
        <button class="btn-status-advance" onclick="updateOrderStatus('${o.id}', 'Completed')">
          <i data-lucide="check" style="width: 14px; height: 14px;"></i> Collect
        </button>
      `;
    } else {
      actionBtnHtml = `<span style="color: var(--text-faint); font-size: 0.75rem;">Done</span>`;
    }

    return `
      <tr>
        <td>
          <strong style="font-family: var(--font-mono); color: var(--accent-amber); font-size: 1rem;">${o.token_number}</strong>
        </td>
        <td>
          <div><strong>${escapeHtml(o.student_name)}</strong></div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(o.student_id)} &bull; ${escapeHtml(o.phone)}</div>
        </td>
        <td>
          <span style="font-size: 0.8rem; font-weight: 600;">${escapeHtml(o.pickup_counter || 'Counter 1')}</span>
        </td>
        <td style="max-width: 260px;">
          <div style="font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(itemsSummary)}">
            ${escapeHtml(itemsSummary || 'Standard Canteen Items')}
          </div>
          ${o.special_instructions ? `<div style="font-size: 0.72rem; color: var(--accent-amber);">Note: ${escapeHtml(o.special_instructions)}</div>` : ''}
        </td>
        <td>
          <span style="font-weight: 700; font-family: var(--font-mono);">₹${parseFloat(o.total_amount).toFixed(2)}</span>
        </td>
        <td>
          <span class="status-badge ${o.status}">${o.status}</span>
        </td>
        <td>
          <div class="action-btn-group">
            ${actionBtnHtml}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initIcons();
}

window.updateOrderStatus = async function(orderId, nextStatus) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update order status');
    }

    showToast(`Order status updated to ${nextStatus}`, 'success');
    fetchOrders();
    fetchStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

function renderAdminMenuCatalog() {
  if (!elements.adminMenuTbody) return;

  elements.adminMenuTbody.innerHTML = state.menuItems.map((item) => {
    const isAvail = item.is_available !== false;
    const isVeg = item.is_veg !== false;

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${escapeHtml(item.image_url || '')}" style="width: 36px; height: 36px; border-radius: var(--radius-sm); object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'">
            <strong>${escapeHtml(item.name)}</strong>
          </div>
        </td>
        <td>${escapeHtml(item.category)}</td>
        <td>
          <span class="diet-dot ${isVeg ? 'veg' : 'non-veg'}" style="display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
          ${isVeg ? 'Veg' : 'Non-Veg'}
        </td>
        <td><strong style="font-family: var(--font-mono);">₹${parseFloat(item.price).toFixed(2)}</strong></td>
        <td>~${item.preparation_time || 10} min</td>
        <td>
          <button class="btn-toggle-stock ${isAvail ? 'active' : 'out'}" onclick="toggleDishAvailability('${item.id}')">
            ${isAvail ? '● In Stock' : '○ Sold Out'}
          </button>
        </td>
        <td>
          <div class="action-btn-group">
            <button class="btn-status-advance" onclick="editDish('${item.id}')" title="Edit Dish">
              <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="btn-icon-danger" onclick="deleteDish('${item.id}', '${escapeHtml(item.name)}')" title="Delete Dish">
              <i data-lucide="trash" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initIcons();
}

window.toggleDishAvailability = async function(itemId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/menu/${itemId}/toggle`, {
      method: 'PATCH'
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to toggle status');

    showToast('Dish stock status updated', 'success');
    fetchMenuItems();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.editDish = function(itemId) {
  const item = state.menuItems.find(i => i.id === itemId);
  if (item) {
    openDishModal(item);
  }
};

window.deleteDish = async function(itemId, name) {
  if (!confirm(`Are you sure you want to remove "${name}" from the canteen menu?`)) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/menu/${itemId}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete dish');

    showToast(`Removed "${name}" from menu`, 'info');
    fetchMenuItems();
    fetchStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ============================================================================
// TOAST NOTIFICATIONS & UTILITIES
// ============================================================================
function showToast(message, type = 'info') {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
    <span>${escapeHtml(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);
  initIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
