/**
 * ShopPulse Storefront UI Interactions
 * Handles client-side sorting, live search filtering, quantity selectors,
 * wishlist visual toggling, and Add to Cart UI feedback.
 * 
 * Strict Scope: Pure frontend interactions only. No backend APIs called.
 */

document.addEventListener('DOMContentLoaded', () => {
  initWishlistToggle();
  initQuantitySelectors();
  initAddToCartFeedback();
  initStorefrontSorting();
  initStorefrontSearch();
});

/**
 * 1. Wishlist Button API Integration & Toggle
 */
async function initWishlistToggle() {
  const wishlistButtons = document.querySelectorAll('.btn-wishlist');
  if (wishlistButtons.length === 0) return;

  // Sync existing wishlist items on page load if user is authenticated
  try {
    const res = await fetch('/wishlist', {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.wishlist && Array.isArray(data.wishlist.products)) {
        const savedIds = new Set(data.wishlist.products.map(p => (p._id || p).toString()));
        wishlistButtons.forEach((btn) => {
          const pId = btn.dataset.productId;
          if (pId && savedIds.has(pId)) {
            btn.classList.add('is-active');
            btn.setAttribute('aria-pressed', 'true');
            btn.setAttribute('title', 'Remove from wishlist');
          }
        });
      }
    }
  } catch (e) {
    // Gracefully ignore if unauthenticated or network error
  }

  wishlistButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (btn.disabled || btn.classList.contains('is-loading')) return;

      const productId = btn.dataset.productId;
      if (!productId) return;

      const card = btn.closest('.product-card');
      const productName = card?.querySelector('.product-card-title a')?.textContent?.trim() || 'Product';
      const isCurrentlyActive = btn.classList.contains('is-active');

      btn.classList.add('is-loading');

      try {
        if (isCurrentlyActive) {
          // Remove from wishlist
          const response = await fetch(`/wishlist/${productId}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' },
          });
          const data = await response.json().catch(() => ({}));

          if (response.ok) {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-pressed', 'false');
            btn.setAttribute('aria-label', `Add ${productName} to wishlist`);
            btn.setAttribute('title', 'Save to wishlist');
            showStorefrontToast(`Removed "${productName}" from your wishlist`, 'info');
          } else if (response.status === 401) {
            showStorefrontToast('Please login first to manage your wishlist.', 'error');
          } else {
            showStorefrontToast(data.message || 'Could not update wishlist', 'error');
          }
        } else {
          // Add to wishlist
          const response = await fetch(`/wishlist/${productId}`, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
          });
          const data = await response.json().catch(() => ({}));

          if (response.ok) {
            btn.classList.add('is-active');
            btn.setAttribute('aria-pressed', 'true');
            btn.setAttribute('aria-label', `Remove ${productName} from wishlist`);
            btn.setAttribute('title', 'Remove from wishlist');
            showStorefrontToast(`Added "${productName}" to your wishlist`, 'success');
          } else if (response.status === 401) {
            showStorefrontToast('Please login first to save items to your wishlist.', 'error');
          } else if (data.message && data.message.includes('already in wishlist')) {
            btn.classList.add('is-active');
            btn.setAttribute('aria-pressed', 'true');
            btn.setAttribute('aria-label', `Remove ${productName} from wishlist`);
            btn.setAttribute('title', 'Remove from wishlist');
            showStorefrontToast(`"${productName}" is already in your wishlist`, 'info');
          } else {
            showStorefrontToast(data.message || 'Could not add to wishlist', 'error');
          }
        }
      } catch (err) {
        console.error('Error updating wishlist:', err);
        showStorefrontToast('Network error while updating wishlist. Please try again.', 'error');
      } finally {
        btn.classList.remove('is-loading');
      }
    });
  });
}

/**
 * 2. Quantity Selector Controls
 */
function initQuantitySelectors() {
  document.querySelectorAll('.qty-selector').forEach((selector) => {
    const minusBtn = selector.querySelector('.qty-minus');
    const plusBtn = selector.querySelector('.qty-plus');
    const input = selector.querySelector('.qty-input');

    if (!input || !minusBtn || !plusBtn) return;

    const min = parseInt(input.getAttribute('min'), 10) || 1;
    const max = parseInt(input.getAttribute('max'), 10) || 99;

    minusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let currentVal = parseInt(input.value, 10) || min;
      if (currentVal > min) {
        currentVal -= 1;
        input.value = currentVal;
      }
    });

    plusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let currentVal = parseInt(input.value, 10) || min;
      if (currentVal < max) {
        currentVal += 1;
        input.value = currentVal;
      }
    });
  });
}

/**
 * Helper to show toast notification
 */
function showStorefrontToast(message, type = 'info', duration = 3500) {
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
 * 3. Add to Cart API Integration & Feedback
 */
function initAddToCartFeedback() {
  document.querySelectorAll('.btn-add-to-cart').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // If disabled (out of stock) or already processing, ignore
      if (btn.disabled || btn.classList.contains('is-loading')) return;

      const card = btn.closest('.product-card') || btn.closest('.product-detail-layout') || document;
      const productId = btn.dataset.productId;
      const productName = btn.dataset.productName || card.querySelector('.product-card-title a, .product-detail-title')?.textContent?.trim() || 'Product';
      const qtyInput = card.querySelector('.qty-input');
      const quantity = parseInt(qtyInput ? qtyInput.value : '1', 10) || 1;
      const textSpan = btn.querySelector('.cart-btn-text');
      const originalText = textSpan ? textSpan.textContent : 'Add to Cart';

      if (!productId) return;

      // Set loading state
      btn.classList.add('is-loading');
      btn.disabled = true;
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
            quantity,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          // Success state
          btn.classList.add('is-added');
          if (textSpan) {
            textSpan.textContent = quantity > 1 ? `Added (${quantity})` : 'Added to Cart!';
          }
          showStorefrontToast(`Added ${quantity > 1 ? quantity + ' × ' : ''}"${productName}" to your cart`, 'success');

          setTimeout(() => {
            btn.classList.remove('is-added');
            if (textSpan) {
              textSpan.textContent = originalText;
            }
          }, 1800);
        } else if (response.status === 401) {
          showStorefrontToast('Please login first to add items to your cart.', 'error');
          if (textSpan) textSpan.textContent = originalText;
        } else {
          const errorMsg = data.message || 'Could not add product to cart';
          showStorefrontToast(errorMsg, 'error');
          if (textSpan) textSpan.textContent = originalText;
        }
      } catch (err) {
        console.error('Error adding to cart:', err);
        showStorefrontToast('Network error while adding to cart. Please try again.', 'error');
        if (textSpan) textSpan.textContent = originalText;
      } finally {
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
    });
  });
}

/**
 * 4. Storefront Product Sorting
 */
function initStorefrontSorting() {
  const sortSelect = document.getElementById('sortProductsSelect');
  const productGrid = document.getElementById('productGrid');

  if (!sortSelect || !productGrid) return;

  sortSelect.addEventListener('change', () => {
    const sortValue = sortSelect.value;
    const cards = Array.from(productGrid.querySelectorAll('.product-card'));

    cards.sort((a, b) => {
      switch (sortValue) {
        case 'price-asc': {
          const priceA = parseFloat(a.dataset.price) || 0;
          const priceB = parseFloat(b.dataset.price) || 0;
          return priceA - priceB;
        }
        case 'price-desc': {
          const priceA = parseFloat(a.dataset.price) || 0;
          const priceB = parseFloat(b.dataset.price) || 0;
          return priceB - priceA;
        }
        case 'name-asc': {
          const nameA = (a.dataset.name || '').trim();
          const nameB = (b.dataset.name || '').trim();
          return nameA.localeCompare(nameB);
        }
        case 'newest': {
          const timeA = parseInt(a.dataset.created, 10) || 0;
          const timeB = parseInt(b.dataset.created, 10) || 0;
          return timeB - timeA;
        }
        case 'relevance':
        default: {
          const indexA = parseInt(a.dataset.index, 10) || 0;
          const indexB = parseInt(b.dataset.index, 10) || 0;
          return indexA - indexB;
        }
      }
    });

    // Re-append sorted cards into grid
    cards.forEach((card) => productGrid.appendChild(card));
  });
}

/**
 * 5. Storefront Live Search & Filtering
 */
function initStorefrontSearch() {
  const searchInput = document.getElementById('storefrontSearch');
  const searchClearBtn = document.getElementById('toolbarSearchClear');
  const countBadge = document.getElementById('productsCountBadge');
  const noResultsState = document.getElementById('noSearchResults');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const productGrid = document.getElementById('productGrid');

  if (!searchInput || !productGrid) return;

  const cards = Array.from(productGrid.querySelectorAll('.product-card'));
  const totalCount = cards.length;

  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();

    // Toggle clear button
    if (searchClearBtn) {
      searchClearBtn.style.display = query ? 'flex' : 'none';
    }

    let visibleCount = 0;

    cards.forEach((card) => {
      const name = card.dataset.name || '';
      const brand = card.dataset.brand || '';
      const category = card.dataset.category || '';

      const matches = !query || name.includes(query) || brand.includes(query) || category.includes(query);

      if (matches) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update count indicator
    if (countBadge) {
      if (query) {
        countBadge.textContent = `${visibleCount} of ${totalCount} ${totalCount === 1 ? 'product' : 'products'} found`;
      } else {
        countBadge.textContent = `${totalCount} ${totalCount === 1 ? 'product' : 'products'} found`;
      }
    }

    // Toggle no results state
    if (noResultsState) {
      if (visibleCount === 0 && totalCount > 0) {
        noResultsState.style.display = 'block';
        productGrid.style.display = 'none';
      } else {
        noResultsState.style.display = 'none';
        productGrid.style.display = '';
      }
    }
  }

  searchInput.addEventListener('input', performSearch);

  function resetSearch() {
    searchInput.value = '';
    performSearch();
    searchInput.focus();
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', resetSearch);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', resetSearch);
  }
}
