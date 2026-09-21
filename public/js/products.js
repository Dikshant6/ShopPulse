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
 * 1. Wishlist Button Visual Toggle
 */
function initWishlistToggle() {
  document.querySelectorAll('.btn-wishlist').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isActive = btn.classList.toggle('is-active');
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      
      const productName = btn.closest('.product-card')?.querySelector('.product-card-title a')?.textContent?.trim() || 'Product';
      btn.setAttribute(
        'aria-label',
        isActive ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`
      );
      btn.setAttribute('title', isActive ? 'Remove from wishlist' : 'Save to wishlist');
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
 * 3. Add to Cart Visual Feedback
 */
function initAddToCartFeedback() {
  document.querySelectorAll('.btn-add-to-cart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // If disabled (out of stock), do nothing
      if (btn.disabled || btn.classList.contains('is-added')) return;

      const card = btn.closest('.product-card');
      const qtyInput = card ? card.querySelector('.qty-input') : null;
      const quantity = qtyInput ? qtyInput.value : '1';
      const textSpan = btn.querySelector('.cart-btn-text');
      const originalText = textSpan ? textSpan.textContent : 'Add to Cart';

      // Visual success feedback
      btn.classList.add('is-added');
      if (textSpan) {
        textSpan.textContent = quantity > 1 ? `Added (${quantity})` : 'Added to Cart!';
      }

      // Revert feedback after delay
      setTimeout(() => {
        btn.classList.remove('is-added');
        if (textSpan) {
          textSpan.textContent = originalText;
        }
      }, 1500);
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
