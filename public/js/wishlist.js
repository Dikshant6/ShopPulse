/**
 * ShopPulse Wishlist Frontend Controller
 * Connects EJS Wishlist UI to Backend APIs using Vanilla JavaScript & fetch()
 * 
 * Endpoints:
 * - DELETE /wishlist/:productId
 * - POST   /cart/items (body: { productId, quantity: 1 })
 */

document.addEventListener('DOMContentLoaded', () => {
  initWishlistRemove();
  initWishlistAddToCart();
});

/**
 * Toast Notification System
 * @param {string} message 
 * @param {'success' | 'error' | 'info'} type 
 * @param {number} duration 
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

  // Trigger smooth entrance animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Auto-dismiss after duration
  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, duration);
}

/**
 * Recalculates wishlist item count and toggles empty state if necessary
 */
function updateWishlistState() {
  const cards = document.querySelectorAll('.wishlist-card:not(.is-removing)');
  const totalCount = cards.length;
  const countBadge = document.getElementById('wishlistCountBadge');
  const activeLayout = document.getElementById('wishlistActiveLayout');
  const emptyContainer = document.getElementById('emptyWishlistContainer');

  if (countBadge) {
    countBadge.textContent = `${totalCount} ${totalCount === 1 ? 'saved item' : 'saved items'}`;
  }

  if (totalCount === 0) {
    if (activeLayout) activeLayout.style.display = 'none';
    if (emptyContainer) emptyContainer.style.display = 'block';
  }
}

/**
 * 1. Initialize Wishlist Item Removal
 * Endpoint: DELETE /wishlist/:productId
 */
function initWishlistRemove() {
  const wishlistGrid = document.getElementById('wishlistGrid');
  if (!wishlistGrid) return;

  wishlistGrid.addEventListener('click', async (e) => {
    const removeBtn = e.target.closest('.btn-remove-wishlist');
    if (!removeBtn) return;

    e.preventDefault();
    e.stopPropagation();

    if (removeBtn.disabled) return;

    const card = removeBtn.closest('.wishlist-card');
    if (!card) return;

    const productId = removeBtn.dataset.productId || card.dataset.productId;
    const productName = removeBtn.dataset.productName || card.dataset.productName || 'Product';

    if (!productId) return;

    // Prevent double submissions
    removeBtn.disabled = true;

    try {
      const response = await fetch(`/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showToast(`Removed "${productName}" from your wishlist`, 'success');

        // Apply smooth transition before removing from DOM
        card.classList.add('is-removing');
        setTimeout(() => {
          if (card.parentElement) {
            card.parentElement.removeChild(card);
          }
          updateWishlistState();
        }, 250);
      } else if (response.status === 401) {
        showToast('Please login first to manage your wishlist.', 'error');
        removeBtn.disabled = false;
      } else {
        const errorMsg = data.message || 'Failed to remove product from wishlist';
        showToast(errorMsg, 'error');
        removeBtn.disabled = false;
      }
    } catch (err) {
      console.error('Error removing item from wishlist:', err);
      showToast('Network error while removing product. Please try again.', 'error');
      removeBtn.disabled = false;
    }
  });
}

/**
 * 2. Initialize Add to Cart from Wishlist
 * Endpoint: POST /cart/items
 * Body: { productId: "<productId>", quantity: 1 }
 */
function initWishlistAddToCart() {
  const wishlistGrid = document.getElementById('wishlistGrid');
  if (!wishlistGrid) return;

  wishlistGrid.addEventListener('click', async (e) => {
    const addBtn = e.target.closest('.btn-add-to-cart');
    if (!addBtn) return;

    e.preventDefault();
    e.stopPropagation();

    if (addBtn.disabled || addBtn.classList.contains('is-loading')) return;

    const card = addBtn.closest('.wishlist-card');
    if (!card) return;

    const productId = addBtn.dataset.productId || card.dataset.productId;
    const productName = addBtn.dataset.productName || card.dataset.productName || 'Product';
    const textSpan = addBtn.querySelector('.cart-btn-text');
    const originalText = textSpan ? textSpan.textContent : 'Add to Cart';

    if (!productId) return;

    // Set loading state
    addBtn.classList.add('is-loading');
    addBtn.disabled = true;
    if (textSpan) textSpan.textContent = 'Adding...';

    try {
      const response = await fetch('/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Success state: Provide visual confirmation on the button
        addBtn.classList.add('is-added');
        if (textSpan) textSpan.textContent = 'Added to Cart!';
        showToast(`Added "${productName}" to your cart`, 'success');

        // Restore button state after feedback interval
        setTimeout(() => {
          addBtn.classList.remove('is-added');
          if (textSpan) textSpan.textContent = originalText;
        }, 1800);
      } else if (response.status === 401) {
        showToast('Please login first to add items to your cart.', 'error');
        if (textSpan) textSpan.textContent = originalText;
      } else {
        const errorMsg = data.message || 'Could not add product to cart';
        showToast(errorMsg, 'error');
        if (textSpan) textSpan.textContent = originalText;
      }
    } catch (err) {
      console.error('Error adding wishlist product to cart:', err);
      showToast('Network error while adding to cart. Please try again.', 'error');
      if (textSpan) textSpan.textContent = originalText;
    } finally {
      addBtn.classList.remove('is-loading');
      addBtn.disabled = false;
    }
  });
}
