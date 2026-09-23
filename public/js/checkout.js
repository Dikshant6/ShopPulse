/**
 * ShopPulse Checkout Frontend Controller
 * Connects EJS Checkout UI to Existing Backend Cart & Orders APIs
 * 
 * Endpoints Used:
 * - GET  /cart   (Headers: Accept: application/json)
 * - POST /orders (Body: { shippingAddress: { fullName, phone, addressLine, city, state, postalCode, country } })
 */

document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
});

/**
 * Main Initialization
 */
function initCheckout() {
  // Sync latest cart contents from GET /cart
  fetchCartSummary();

  // Initialize form validation and submission
  initFormHandling();
}

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
 * Fetch cart from GET /cart and update the Order Summary dynamically
 */
async function fetchCartSummary() {
  try {
    const response = await fetch('/cart', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // If unauthorized or server error
      if (response.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      return;
    }

    const data = await response.json();
    const cart = data.cart;

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      showEmptyCheckoutState();
      return;
    }

    renderCartItems(cart.items);
  } catch (error) {
    console.warn('Could not sync cart via API, using server-rendered initial data:', error);
  }
}

/**
 * Render cart items in the summary list
 * @param {Array} items 
 */
function renderCartItems(items) {
  const validItems = items.filter(item => item && item.product);

  if (validItems.length === 0) {
    showEmptyCheckoutState();
    return;
  }

  const itemsListContainer = document.getElementById('checkoutItemsList');
  const countBadge = document.getElementById('checkoutCountBadge');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryShipping = document.getElementById('summaryShipping');
  const summaryTotal = document.getElementById('summaryTotal');

  let subtotal = 0;
  let totalUnits = 0;

  if (itemsListContainer) {
    itemsListContainer.innerHTML = '';

    validItems.forEach((item) => {
      const product = item.product;
      const unitPrice = Number(product.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const itemSubtotal = unitPrice * quantity;

      subtotal += itemSubtotal;
      totalUnits += quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'summary-item';
      itemEl.dataset.productId = product._id;
      itemEl.dataset.price = unitPrice;
      itemEl.dataset.qty = quantity;

      const imageSrc = (product.images && product.images.length > 0 && product.images[0]) ? product.images[0] : '';
      const thumbHtml = imageSrc
        ? `<img src="${imageSrc}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'summary-thumb-placeholder\\'><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><path d=\\'M21 15l-5-5L5 21\\'/></svg></div>';">`
        : `<div class="summary-thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`;

      itemEl.innerHTML = `
        <div class="summary-item-thumb">
          ${thumbHtml}
        </div>
        <div class="summary-item-details">
          <h3 class="summary-item-title" title="${escapeHtml(product.name)}">
            ${escapeHtml(product.name)}
          </h3>
          <div class="summary-item-calc">
            <span class="summary-item-qty">${quantity} ×</span>
            <span class="summary-item-unit-price">${formatCurrency(unitPrice)}</span>
          </div>
        </div>
        <div class="summary-item-subtotal">
          ${formatCurrency(itemSubtotal)}
        </div>
      `;

      itemsListContainer.appendChild(itemEl);
    });
  }

  const shippingFee = subtotal >= 1000 ? 0 : 50;
  const totalAmount = subtotal + shippingFee;

  if (countBadge) {
    countBadge.textContent = `${totalUnits} ${totalUnits === 1 ? 'item' : 'items'}`;
  }
  if (summarySubtotal) {
    summarySubtotal.textContent = formatCurrency(subtotal);
  }
  if (summaryShipping) {
    if (shippingFee === 0) {
      summaryShipping.innerHTML = '<span class="val-free">FREE</span>';
    } else {
      summaryShipping.textContent = formatCurrency(shippingFee);
    }
  }
  if (summaryTotal) {
    summaryTotal.textContent = formatCurrency(totalAmount);
  }
}

/**
 * Render empty checkout state
 */
function showEmptyCheckoutState() {
  const activeLayout = document.getElementById('checkoutActiveLayout');
  const emptyContainer = document.getElementById('emptyCartContainer');

  if (activeLayout) activeLayout.style.display = 'none';
  if (emptyContainer) emptyContainer.style.display = 'block';
}

/**
 * Initialize Form Validation and Submission Listeners
 */
function initFormHandling() {
  const form = document.getElementById('checkoutForm');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  if (!form || !placeOrderBtn) return;

  // Clear errors on input change
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      clearInputError(input);
      hideFormAlert();
    });
    input.addEventListener('change', () => {
      clearInputError(input);
      hideFormAlert();
    });
  });

  // Handle Place Order button click
  placeOrderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitOrder();
  });

  // Handle Enter key on form inputs
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitOrder();
  });
}

/**
 * Validate all form fields
 * @returns {boolean} isValid
 */
function validateShippingForm() {
  let isValid = true;
  let firstInvalidInput = null;

  const fullNameInput = document.getElementById('fullName');
  const phoneInput = document.getElementById('phone');
  const addressLineInput = document.getElementById('addressLine');
  const cityInput = document.getElementById('city');
  const stateInput = document.getElementById('state');
  const postalCodeInput = document.getElementById('postalCode');
  const countryInput = document.getElementById('country');

  // 1. Full Name
  if (!fullNameInput.value.trim()) {
    showInputError(fullNameInput, 'Full name is required');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = fullNameInput;
  } else if (fullNameInput.value.trim().length < 2) {
    showInputError(fullNameInput, 'Please enter a valid full name');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = fullNameInput;
  } else {
    clearInputError(fullNameInput);
  }

  // 2. Phone (expect 10 digits for India)
  const phoneVal = phoneInput.value.trim();
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneVal) {
    showInputError(phoneInput, 'Phone number is required');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = phoneInput;
  } else if (!phoneRegex.test(phoneVal.replace(/[-+\s()]/g, '')) && phoneVal.length < 10) {
    showInputError(phoneInput, 'Please enter a valid 10-digit phone number');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = phoneInput;
  } else {
    clearInputError(phoneInput);
  }

  // 3. Address Line
  if (!addressLineInput.value.trim()) {
    showInputError(addressLineInput, 'Delivery address is required');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = addressLineInput;
  } else if (addressLineInput.value.trim().length < 5) {
    showInputError(addressLineInput, 'Please enter a complete street address');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = addressLineInput;
  } else {
    clearInputError(addressLineInput);
  }

  // 4. City
  if (!cityInput.value.trim()) {
    showInputError(cityInput, 'City is required');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = cityInput;
  } else {
    clearInputError(cityInput);
  }

  // 5. State
  if (!stateInput.value.trim()) {
    showInputError(stateInput, 'State is required');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = stateInput;
  } else {
    clearInputError(stateInput);
  }

  // 6. Postal Code (expect 6 digits for India)
  const postalVal = postalCodeInput.value.trim();
  const postalRegex = /^[0-9]{6}$/;
  if (!postalVal) {
    showInputError(postalCodeInput, 'Postal code is required');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = postalCodeInput;
  } else if (!postalRegex.test(postalVal) && postalVal.length < 4) {
    showInputError(postalCodeInput, 'Please enter a valid 6-digit postal code');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = postalCodeInput;
  } else {
    clearInputError(postalCodeInput);
  }

  // 7. Country
  if (!countryInput.value.trim()) {
    showInputError(countryInput, 'Country is required');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = countryInput;
  } else {
    clearInputError(countryInput);
  }

  if (!isValid && firstInvalidInput) {
    firstInvalidInput.focus();
    showFormAlert('Please fix the errors highlighted above.');
  }

  return isValid;
}

/**
 * Display inline input error
 */
function showInputError(input, message) {
  input.classList.add('input-error');
  const errorSpan = document.getElementById(`${input.name}Error`);
  if (errorSpan) {
    errorSpan.textContent = message;
  }
}

/**
 * Clear inline input error
 */
function clearInputError(input) {
  input.classList.remove('input-error');
  const errorSpan = document.getElementById(`${input.name}Error`);
  if (errorSpan) {
    errorSpan.textContent = '';
  }
}

/**
 * Show top-level form error banner
 */
function showFormAlert(message) {
  const alert = document.getElementById('formErrorAlert');
  const msgSpan = document.getElementById('formErrorMessage');
  if (alert && msgSpan) {
    msgSpan.textContent = message;
    alert.style.display = 'flex';
  }
}

/**
 * Hide top-level form error banner
 */
function hideFormAlert() {
  const alert = document.getElementById('formErrorAlert');
  if (alert) {
    alert.style.display = 'none';
  }
}

/**
 * Submit the Order to POST /orders
 */
async function submitOrder() {
  // Validate form client-side
  if (!validateShippingForm()) {
    return;
  }

  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const addressLine = document.getElementById('addressLine').value.trim();
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const postalCode = document.getElementById('postalCode').value.trim();
  const country = document.getElementById('country').value.trim() || 'India';

  // Exact request body required by the backend Order controller:
  const payload = {
    shippingAddress: {
      fullName,
      phone,
      addressLine,
      city,
      state,
      postalCode,
      country,
    },
  };

  const placeOrderBtn = document.getElementById('placeOrderBtn');
  setButtonLoading(placeOrderBtn, true);
  hideFormAlert();

  try {
    const response = await fetch('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status === 201 && data.order && data.order._id) {
      showToast('Order placed successfully! Redirecting...', 'success', 3000);
      
      // Navigate to the order details page
      setTimeout(() => {
        window.location.href = `/orders/${data.order._id}`;
      }, 700);
      return;
    }

    // Handle API error
    const errorMessage = data.message || 'Failed to place order. Please try again.';
    showFormAlert(errorMessage);
    showToast(errorMessage, 'error', 4500);

    // If error indicates empty cart, transition to empty state
    if (
      errorMessage.toLowerCase().includes('cart is not found') ||
      errorMessage.toLowerCase().includes('add a product') ||
      errorMessage.toLowerCase().includes('cart')
    ) {
      setTimeout(() => {
        showEmptyCheckoutState();
      }, 1500);
    }

    setButtonLoading(placeOrderBtn, false);
  } catch (error) {
    console.error('Error placing order:', error);
    const fallbackMsg = 'Network error or server unavailable. Please try again.';
    showFormAlert(fallbackMsg);
    showToast(fallbackMsg, 'error', 4500);
    setButtonLoading(placeOrderBtn, false);
  }
}

/**
 * Toggle button loading state
 */
function setButtonLoading(button, isLoading) {
  if (!button) return;
  const btnText = button.querySelector('.btn-text');
  const btnLoading = button.querySelector('.btn-loading');

  if (isLoading) {
    button.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline-flex';
  } else {
    button.disabled = false;
    if (btnText) btnText.style.display = 'inline-flex';
    if (btnLoading) btnLoading.style.display = 'none';
  }
}

/**
 * Toast Notification System
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
 * Simple HTML escape helper
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
