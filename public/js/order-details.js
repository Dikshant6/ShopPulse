/**
 * ShopPulse Order Details Frontend Controller
 * Fetches single order from GET /orders/:orderId and renders snapshot details.
 */

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('orderDetailsApp');
  let orderId = appContainer ? appContainer.dataset.orderId : '';

  // If not in data attribute, parse from pathname (/orders/:orderId)
  if (!orderId) {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const ordersIndex = segments.indexOf('orders');
    if (ordersIndex !== -1 && segments[ordersIndex + 1]) {
      orderId = segments[ordersIndex + 1];
    }
  }

  if (orderId) {
    loadOrderDetails(orderId);
  } else {
    showErrorState('Invalid Order ID', 'No order identifier was found in the URL.');
  }

  const retryBtn = document.getElementById('retryDetailsBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (orderId) loadOrderDetails(orderId);
    });
  }

  const copyBtn = document.getElementById('copyOrderIdBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const fullId = copyBtn.dataset.fullId || orderId;
      if (navigator.clipboard && fullId) {
        navigator.clipboard.writeText(fullId)
          .then(() => {
            showToast('Order ID copied to clipboard', 'success');
          })
          .catch(() => {
            showToast('Could not copy Order ID', 'info');
          });
      }
    });
  }

  // Initialize Cancel Order confirmation modal
  initCancelOrderModal();
});

/**
 * Toast Notification System
 */
function showToast(message, type = 'info', duration = 3000) {
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
 * Format Date & Time
 */
function formatDateTime(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    const dateFormatted = d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Placed on ${dateFormatted} at ${timeFormatted}`;
  } catch {
    return 'Recent';
  }
}

/**
 * Show Error State UI
 */
function showErrorState(title, message) {
  const skeleton = document.getElementById('detailsLoadingSkeleton');
  const errorContainer = document.getElementById('detailsErrorContainer');
  const errorTitle = document.getElementById('detailsErrorTitle');
  const errorMessage = document.getElementById('detailsErrorMessage');
  const content = document.getElementById('detailsContent');

  if (skeleton) skeleton.style.display = 'none';
  if (content) content.style.display = 'none';
  if (errorContainer) {
    errorContainer.style.display = 'block';
    if (errorTitle) errorTitle.textContent = title || 'Order Not Found';
    if (errorMessage) errorMessage.textContent = message || 'We could not retrieve this order.';
  }
}

/**
 * Fetch and Render Order Details
 */
async function loadOrderDetails(orderId) {
  const skeleton = document.getElementById('detailsLoadingSkeleton');
  const errorContainer = document.getElementById('detailsErrorContainer');
  const content = document.getElementById('detailsContent');

  if (skeleton) skeleton.style.display = 'flex';
  if (errorContainer) errorContainer.style.display = 'none';
  if (content) content.style.display = 'none';

  try {
    const response = await fetch(`/orders/${encodeURIComponent(orderId)}`, {
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
      if (response.status === 404) {
        showErrorState('Order Not Found', 'The requested order does not exist or does not belong to your account.');
      } else {
        showErrorState('Unable to Load Order', errData.message || 'Something went wrong while fetching order details.');
      }
      return;
    }

    const data = await response.json();
    const order = data.order;

    if (!order) {
      showErrorState('Order Not Found', 'The requested order could not be found.');
      return;
    }

    // Populate the details view
    renderOrderDetails(order);

    if (skeleton) skeleton.style.display = 'none';
    if (content) content.style.display = 'block';

  } catch (error) {
    console.error('Error loading order details:', error);
    showErrorState('Connection Error', 'Failed to connect to the server. Please check your network and try again.');
  }
}

/**
 * Populate Order Details DOM
 */
function renderOrderDetails(order) {
  const orderId = order._id || '';

  // 1. Overview Header
  const overviewOrderId = document.getElementById('overviewOrderId');
  const copyBtn = document.getElementById('copyOrderIdBtn');
  const overviewOrderDate = document.getElementById('overviewOrderDate');
  const orderStatusBadgeWrap = document.getElementById('overviewOrderStatusBadge');
  const paymentStatusBadgeWrap = document.getElementById('overviewPaymentStatusBadge');

  if (overviewOrderId) {
    const shortId = orderId.length > 10 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();
    overviewOrderId.textContent = `Order #${shortId}`;
    overviewOrderId.title = `Full ID: ${orderId}`;
  }

  if (copyBtn) {
    copyBtn.dataset.fullId = orderId;
  }

  if (overviewOrderDate) {
    overviewOrderDate.textContent = formatDateTime(order.createdAt);
  }

  const orderStatus = getStatusDisplay(order.orderStatus);
  if (orderStatusBadgeWrap) {
    orderStatusBadgeWrap.innerHTML = `
      <span class="status-badge ${orderStatus.cssClass}">
        <span class="status-dot"></span>
        ${orderStatus.label}
      </span>
    `;
  }

  const paymentStatus = getStatusDisplay(order.paymentStatus);
  if (paymentStatusBadgeWrap) {
    paymentStatusBadgeWrap.innerHTML = `
      <span class="status-badge ${paymentStatus.cssClass}">
        <span class="status-dot"></span>
        ${paymentStatus.label}
      </span>
    `;
  }

  // Render Cancellation action based on status eligibility
  renderCancellationAction(order);

  // 2. Purchased Items Snapshot List
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsCountBadge = document.getElementById('detailsItemsCountBadge');
  const itemsList = document.getElementById('detailsItemsList');

  let totalItemUnits = 0;
  items.forEach((item) => {
    totalItemUnits += Number(item.quantity) || 1;
  });

  if (itemsCountBadge) {
    itemsCountBadge.textContent = `${totalItemUnits} ${totalItemUnits === 1 ? 'item' : 'items'}`;
  }

  if (itemsList) {
    itemsList.innerHTML = '';
    items.forEach((item) => {
      const unitPrice = formatCurrency(item.price);
      const subtotal = formatCurrency(item.subtotal || (item.price * (item.quantity || 1)));
      const quantity = item.quantity || 1;
      const itemName = item.name || 'Product';

      const row = document.createElement('div');
      row.className = 'order-item-row';
      row.innerHTML = `
        <!-- Product Cell -->
        <div class="order-item-product">
          <div class="order-item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div class="order-item-info">
            <span class="order-item-name">${itemName}</span>
            <span class="order-item-snapshot-tag">Historical snapshot</span>
          </div>
        </div>

        <!-- Unit Price -->
        <div class="order-item-price">
          <span class="item-col-label">Unit Price: </span>
          <span>${unitPrice}</span>
        </div>

        <!-- Quantity -->
        <div class="order-item-qty">
          <span class="item-col-label">Quantity: </span>
          <span>${quantity}</span>
        </div>

        <!-- Subtotal -->
        <div class="order-item-subtotal">
          <span class="item-col-label">Subtotal: </span>
          <span>${subtotal}</span>
        </div>
      `;
      itemsList.appendChild(row);
    });
  }

  // 3. Order Summary
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryShipping = document.getElementById('summaryShipping');
  const summaryTotal = document.getElementById('summaryTotal');

  if (summarySubtotal) {
    summarySubtotal.textContent = formatCurrency(order.subtotal);
  }

  if (summaryShipping) {
    const fee = Number(order.shippingFee) || 0;
    if (fee === 0) {
      summaryShipping.innerHTML = '<span class="summary-val-free">FREE</span>';
    } else {
      summaryShipping.textContent = formatCurrency(fee);
    }
  }

  if (summaryTotal) {
    summaryTotal.textContent = formatCurrency(order.totalAmount);
  }

  // 4. Shipping Address Card
  const shippingAddressDetails = document.getElementById('shippingAddressDetails');
  if (shippingAddressDetails) {
    const address = order.shippingAddress || {};
    const fullName = address.fullName || 'Valued Customer';
    const phone = address.phone || '';
    const addressLine = address.addressLine || '';
    const cityStateZip = [address.city, address.state, address.postalCode].filter(Boolean).join(', ');
    const country = address.country || 'India';

    shippingAddressDetails.innerHTML = `
      <div class="address-name">${fullName}</div>
      ${phone ? `
        <div class="address-phone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          ${phone}
        </div>
      ` : ''}
      <div class="address-lines">
        <span>${addressLine}</span>
        ${cityStateZip ? `<span>${cityStateZip}</span>` : ''}
        <span class="address-country">${country}</span>
      </div>
    `;
  }
}

/**
 * Global Cancellation State & Handlers
 */
let currentActiveOrderId = '';
let isCancellationSubmitting = false;

/**
 * Initialize Cancel Order Confirmation Modal
 */
function initCancelOrderModal() {
  const cancelBtn = document.getElementById('cancelOrderBtn');
  const modal = document.getElementById('cancelOrderModal');
  const keepBtn = document.getElementById('keepOrderBtn');
  const confirmBtn = document.getElementById('confirmCancelBtn');

  if (!modal) return;

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Cancel Order';
    }
    if (keepBtn) {
      keepBtn.disabled = false;
    }
  }

  function closeModal() {
    if (isCancellationSubmitting) return; // Prevent closing while request is in flight
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', openModal);
  }

  if (keepBtn) {
    keepBtn.addEventListener('click', closeModal);
  }

  // Close when clicking modal backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Confirm Cancellation Action
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (isCancellationSubmitting) return;

      const orderIdToCancel = currentActiveOrderId;
      if (!orderIdToCancel) {
        showToast('Invalid Order ID', 'error');
        return;
      }

      isCancellationSubmitting = true;
      confirmBtn.disabled = true;
      if (keepBtn) keepBtn.disabled = true;
      confirmBtn.textContent = 'Cancelling...';

      try {
        const response = await fetch(`/orders/${encodeURIComponent(orderIdToCancel)}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.status === 401) {
          window.location.href = '/auth/login';
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorMsg = data.message || "Can't cancel your order now";
          showToast(errorMsg, 'error');
          isCancellationSubmitting = false;
          confirmBtn.disabled = false;
          if (keepBtn) keepBtn.disabled = false;
          confirmBtn.textContent = 'Cancel Order';
          return;
        }

        // Cancellation succeeded
        isCancellationSubmitting = false;
        confirmBtn.disabled = false;
        if (keepBtn) keepBtn.disabled = false;
        confirmBtn.textContent = 'Cancel Order';

        // Close modal
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');

        // Hide the Cancel Order action button
        const cancelBlock = document.getElementById('orderCancelActionBlock');
        if (cancelBlock) {
          cancelBlock.style.display = 'none';
        }

        // Update the order status badge in header
        const orderStatusBadgeWrap = document.getElementById('overviewOrderStatusBadge');
        if (orderStatusBadgeWrap) {
          const cancelledStatus = getStatusDisplay('cancelled');
          orderStatusBadgeWrap.innerHTML = `
            <span class="status-badge ${cancelledStatus.cssClass}">
              <span class="status-dot"></span>
              ${cancelledStatus.label}
            </span>
          `;
        }

        showToast(data.message || 'Order cancelled successfully', 'success');

      } catch (err) {
        console.error('Error cancelling order:', err);
        showToast('Network error while cancelling order. Please check your connection.', 'error');
        isCancellationSubmitting = false;
        confirmBtn.disabled = false;
        if (keepBtn) keepBtn.disabled = false;
        confirmBtn.textContent = 'Cancel Order';
      }
    });
  }
}

/**
 * Render Cancellation Action Button based on status eligibility
 */
function renderCancellationAction(order) {
  currentActiveOrderId = order._id || '';
  const normalizedStatus = (order.orderStatus || '').toLowerCase();
  const isCancellable = normalizedStatus === 'pending' || normalizedStatus === 'confirmed';
  const cancelBlock = document.getElementById('orderCancelActionBlock');

  if (cancelBlock) {
    cancelBlock.style.display = isCancellable ? 'flex' : 'none';
  }
}
