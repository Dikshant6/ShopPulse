/**
 * ShopPulse Orders Frontend Controller
 * Fetches user orders from GET /orders and renders production-grade order cards.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadUserOrders();

  const retryBtn = document.getElementById('retryOrdersBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      loadUserOrders();
    });
  }
});

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  const safeMsg = document.createElement('span');
  safeMsg.className = 'toast-message';
  safeMsg.textContent = message;

  toast.innerHTML = iconSvg;
  toast.appendChild(safeMsg);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, duration);
}

/**
 * Format Status Text and Theme Mapping
 */
function getStatusDisplay(status) {
  const normalized = (status || 'pending').toLowerCase();
  const labelMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  };

  return {
    label: labelMap[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1),
    cssClass: `status-${normalized}`,
  };
}

/**
 * Format Currency in Indian Rupee format
 */
function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format Date to Human-readable format
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

/**
 * Shorten Order ID for Display
 */
function formatShortOrderId(orderId) {
  if (!orderId) return 'ORDER';
  const str = String(orderId);
  if (str.length <= 10) return '#' + str.toUpperCase();
  return '#' + str.slice(-8).toUpperCase();
}

/**
 * Fetch and Render Orders
 */
async function loadUserOrders() {
  const skeleton = document.getElementById('ordersLoadingSkeleton');
  const errorContainer = document.getElementById('ordersErrorContainer');
  const errorMessage = document.getElementById('ordersErrorMessage');
  const ordersList = document.getElementById('ordersList');
  const emptyContainer = document.getElementById('emptyOrdersContainer');
  const countBadge = document.getElementById('ordersCountBadge');

  // Reset UI State to Loading
  if (skeleton) skeleton.style.display = 'flex';
  if (errorContainer) errorContainer.style.display = 'none';
  if (ordersList) {
    ordersList.style.display = 'none';
    ordersList.innerHTML = '';
  }
  if (emptyContainer) emptyContainer.style.display = 'none';
  if (countBadge) countBadge.style.display = 'none';

  try {
    const response = await fetch('/orders', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 401) {
      window.location.href = '/auth/login';
      return;
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const orders = Array.isArray(data.orders) ? data.orders : [];

    // Hide Loading Skeleton
    if (skeleton) skeleton.style.display = 'none';

    // Handle Empty Orders
    if (orders.length === 0) {
      if (emptyContainer) emptyContainer.style.display = 'block';
      if (countBadge) {
        countBadge.textContent = '0 orders';
        countBadge.style.display = 'inline-flex';
      }
      return;
    }

    // Update Badge
    if (countBadge) {
      countBadge.textContent = `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`;
      countBadge.style.display = 'inline-flex';
    }

    // Render Orders
    renderOrders(orders, ordersList);
    if (ordersList) ordersList.style.display = 'flex';

  } catch (error) {
    console.error('Error fetching user orders:', error);
    if (skeleton) skeleton.style.display = 'none';
    if (errorContainer) {
      errorContainer.style.display = 'block';
      if (errorMessage) {
        errorMessage.textContent = error.message || 'We could not load your orders. Please try again.';
      }
    }
  }
}

/**
 * Render List of Order Cards
 */
function renderOrders(orders, container) {
  if (!container) return;

  orders.forEach((order) => {
    const orderId = order._id;
    const shortId = formatShortOrderId(orderId);
    const dateFormatted = formatDate(order.createdAt);
    const totalAmount = formatCurrency(order.totalAmount);
    
    // Calculate total item units and construct names preview
    const items = Array.isArray(order.items) ? order.items : [];
    let totalUnits = 0;
    const itemNames = [];

    items.forEach((item) => {
      const qty = Number(item.quantity) || 1;
      totalUnits += qty;
      if (item.name) {
        itemNames.push(item.name);
      }
    });

    const itemsSummaryText = itemNames.length > 0 ? itemNames.join(' • ') : 'Ordered products';
    const unitsCountText = `${totalUnits} ${totalUnits === 1 ? 'item' : 'items'}`;

    const orderStatusInfo = getStatusDisplay(order.orderStatus);
    const paymentStatusInfo = getStatusDisplay(order.paymentStatus);

    const card = document.createElement('article');
    card.className = 'order-card';
    card.setAttribute('data-order-id', orderId);

    card.innerHTML = `
      <!-- Card Header -->
      <div class="order-card-header">
        <div class="order-meta-primary">
          <span class="order-id-label" title="Full Order ID: ${orderId}">ORDER ${shortId}</span>
          <span class="order-date-text">${dateFormatted}</span>
        </div>
        <div class="order-badges-wrap">
          <div class="order-badge-group">
            <span class="badge-label-subtle">Order</span>
            <span class="status-badge ${orderStatusInfo.cssClass}">
              <span class="status-dot"></span>
              ${orderStatusInfo.label}
            </span>
          </div>
          <div class="order-badge-group">
            <span class="badge-label-subtle">Payment</span>
            <span class="status-badge ${paymentStatusInfo.cssClass}">
              <span class="status-dot"></span>
              ${paymentStatusInfo.label}
            </span>
          </div>
        </div>
      </div>

      <!-- Card Body -->
      <div class="order-card-body">
        <div class="order-items-preview">
          <span class="order-items-count">${unitsCountText}</span>
          <p class="order-items-names" title="${itemNames.join(', ')}">${itemsSummaryText}</p>
        </div>
        <div class="order-card-financials">
          <span class="order-total-label">Total Amount</span>
          <span class="order-total-amount">${totalAmount}</span>
        </div>
      </div>

      <!-- Card Footer -->
      <div class="order-card-footer">
        <a href="/orders/${orderId}" class="btn-view-details" aria-label="View details for order ${shortId}">
          View Details
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}
