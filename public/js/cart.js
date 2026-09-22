/**
 * ShopPulse Cart Frontend Controller
 * Connects EJS Cart UI to Existing Backend Cart APIs
 * 
 * Endpoints:
 * - PATCH  /cart/items/:productId (body: { quantity })
 * - DELETE /cart/items/:productId
 * - DELETE /cart
 */

document.addEventListener('DOMContentLoaded', () => {
  initQuantityButtons();
  initRemoveButtons();
  initClearCartModal();
});

/**
 * Format numeric value as Indian Rupee (INR) currency string
 * @param {number} amount 
 * @returns {string} e.g. "₹2,499.00"
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Recalculate totals and update all summary and counter UI badges
 */
function recalculateCartSummary() {
  const items = document.querySelectorAll('.cart-item');
  let subtotal = 0;
  let totalUnits = 0;

  items.forEach((item) => {
    const price = parseFloat(item.dataset.price) || 0;
    const qtyInput = item.querySelector('.qty-input');
    const qty = parseInt(qtyInput ? qtyInput.value : '0', 10) || 0;

    subtotal += price * qty;
    totalUnits += qty;
  });

  // Update summary fields
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryTotal = document.getElementById('summaryTotal');
  const summaryUnitsCount = document.getElementById('summaryUnitsCount');
  const cartCountBadge = document.getElementById('cartCountBadge');

  if (summarySubtotal) summarySubtotal.textContent = formatCurrency(subtotal);
  if (summaryTotal) summaryTotal.textContent = formatCurrency(subtotal);
  if (summaryUnitsCount) summaryUnitsCount.textContent = totalUnits;
  if (cartCountBadge) {
    cartCountBadge.textContent = `${totalUnits} ${totalUnits === 1 ? 'item' : 'items'}`;
  }

  // If no items remain, transition to empty cart view
  if (items.length === 0 || totalUnits === 0) {
    showEmptyCartState();
  }
}

/**
 * Render empty cart view
 */
function showEmptyCartState() {
  const activeLayout = document.getElementById('cartActiveLayout');
  const emptyContainer = document.getElementById('emptyCartContainer');
  const cartCountBadge = document.getElementById('cartCountBadge');

  if (activeLayout) activeLayout.style.display = 'none';
  if (emptyContainer) emptyContainer.style.display = 'block';
  if (cartCountBadge) cartCountBadge.textContent = '0 items';
}

/**
 * Toast Notification System
 * @param {string} message 
 * @param {'success' | 'error' | 'info'} type 
 * @param {number} duration 
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

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

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Trigger smooth enter animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, duration);
}

/**
 * Escape string for safe HTML injection
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 1. Initialize Quantity Increment and Decrement Steppers
 */
function initQuantityButtons() {
  const cartItemsList = document.getElementById('cartItemsList');
  if (!cartItemsList) return;

  cartItemsList.addEventListener('click', async (e) => {
    const minusBtn = e.target.closest('.btn-qty-minus');
    const plusBtn = e.target.closest('.btn-qty-plus');

    if (!minusBtn && !plusBtn) return;

    e.preventDefault();
    const btn = minusBtn || plusBtn;
    const isPlus = Boolean(plusBtn);
    const itemRow = btn.closest('.cart-item');
    if (!itemRow) return;

    const productId = itemRow.dataset.productId;
    const unitPrice = parseFloat(itemRow.dataset.price) || 0;
    const qtyInput = itemRow.querySelector('.qty-input');
    const currentQty = parseInt(qtyInput.value, 10) || 1;
    const itemMinusBtn = itemRow.querySelector('.btn-qty-minus');
    const itemPlusBtn = itemRow.querySelector('.btn-qty-plus');
    const subtotalSpan = itemRow.querySelector('.item-subtotal-price');

    // Rule: Quantity cannot go below 1
    if (!isPlus && currentQty <= 1) {
      if (itemMinusBtn) itemMinusBtn.disabled = true;
      return;
    }

    const newQuantity = isPlus ? currentQty + 1 : currentQty - 1;

    // Set UI loading state
    itemRow.classList.add('is-updating');
    if (itemMinusBtn) itemMinusBtn.disabled = true;
    if (itemPlusBtn) itemPlusBtn.disabled = true;

    try {
      const response = await fetch(`/cart/items/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Backend successfully updated item quantity
        qtyInput.value = newQuantity;
        const newSubtotal = unitPrice * newQuantity;
        if (subtotalSpan) {
          subtotalSpan.textContent = formatCurrency(newSubtotal);
        }

        // Adjust minus button disabled state
        if (itemMinusBtn) {
          itemMinusBtn.disabled = newQuantity <= 1;
        }

        recalculateCartSummary();
      } else {
        // Backend rejected (e.g. stock exceeded)
        const errorMsg = data.message || 'Unable to update item quantity';
        showToast(errorMsg, 'error');

        // Restore minus button state based on current unchanged quantity
        if (itemMinusBtn) {
          itemMinusBtn.disabled = currentQty <= 1;
        }
      }
    } catch (err) {
      console.error('Error updating cart item quantity:', err);
      showToast('Network error while updating quantity. Please try again.', 'error');
      if (itemMinusBtn) {
        itemMinusBtn.disabled = currentQty <= 1;
      }
    } finally {
      itemRow.classList.remove('is-updating');
      if (itemPlusBtn) itemPlusBtn.disabled = false;
    }
  });
}

/**
 * 2. Initialize Remove Item Actions
 */
function initRemoveButtons() {
  const cartItemsList = document.getElementById('cartItemsList');
  if (!cartItemsList) return;

  cartItemsList.addEventListener('click', async (e) => {
    const removeBtn = e.target.closest('.btn-remove-item');
    if (!removeBtn) return;

    e.preventDefault();
    const itemRow = removeBtn.closest('.cart-item');
    if (!itemRow) return;

    const productId = removeBtn.dataset.productId || itemRow.dataset.productId;
    const productName = removeBtn.dataset.productName || 'Product';

    // Disable button to prevent double clicks
    removeBtn.disabled = true;
    itemRow.classList.add('is-removing');

    try {
      const response = await fetch(`/cart/items/${productId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showToast(`${productName} removed from cart`, 'success');

        // Remove row element from DOM after transition
        setTimeout(() => {
          if (itemRow.parentElement) {
            itemRow.parentElement.removeChild(itemRow);
          }
          recalculateCartSummary();
        }, 200);
      } else {
        itemRow.classList.remove('is-removing');
        removeBtn.disabled = false;
        const errorMsg = data.message || 'Failed to remove product from cart';
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error removing cart item:', err);
      itemRow.classList.remove('is-removing');
      removeBtn.disabled = false;
      showToast('Network error while removing item. Please try again.', 'error');
    }
  });
}

/**
 * 3. Initialize Clear Cart Confirmation Dialog & Handler
 */
function initClearCartModal() {
  const clearCartBtn = document.getElementById('clearCartBtn');
  const clearModal = document.getElementById('clearCartModal');
  const cancelClearBtn = document.getElementById('cancelClearBtn');
  const confirmClearBtn = document.getElementById('confirmClearBtn');

  if (!clearCartBtn || !clearModal || !cancelClearBtn || !confirmClearBtn) return;

  function openModal() {
    clearModal.classList.add('is-open');
    clearModal.setAttribute('aria-hidden', 'false');
    confirmClearBtn.focus();
  }

  function closeModal() {
    clearModal.classList.remove('is-open');
    clearModal.setAttribute('aria-hidden', 'true');
    clearCartBtn.focus();
  }

  clearCartBtn.addEventListener('click', openModal);
  cancelClearBtn.addEventListener('click', closeModal);

  // Close when clicking modal backdrop
  clearModal.addEventListener('click', (e) => {
    if (e.target === clearModal) {
      closeModal();
    }
  });

  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && clearModal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Execute DELETE /cart on confirmation
  confirmClearBtn.addEventListener('click', async () => {
    confirmClearBtn.disabled = true;
    confirmClearBtn.textContent = 'Clearing...';

    try {
      const response = await fetch('/cart', {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        closeModal();
        const itemsList = document.getElementById('cartItemsList');
        if (itemsList) itemsList.innerHTML = '';
        showEmptyCartState();
        showToast('Cart cleared successfully', 'success');
      } else {
        const errorMsg = data.message || 'Failed to clear cart';
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      showToast('Network error while clearing cart. Please try again.', 'error');
    } finally {
      confirmClearBtn.disabled = false;
      confirmClearBtn.textContent = 'Yes, Clear Cart';
    }
  });
}
