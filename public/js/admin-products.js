/**
 * ShopPulse Admin Product Management Interactions
 * Plain Vanilla JavaScript - Zero External Dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  initDeleteModal();
  initImageUrlsManager();
  initProductForm();
  initTableSearch();
});

/**
 * Toast Notification Utility
 */
function showToast(message, type = 'success') {
  let container = document.querySelector('.admin-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  
  const iconSvg = type === 'success'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('active');
  });

  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

/**
 * Delete Confirmation UX
 */
function initDeleteModal() {
  const modal = document.getElementById('deleteConfirmModal');
  if (!modal) return;

  const cancelBtn = modal.querySelector('#cancelDeleteBtn');
  const confirmBtn = modal.querySelector('#confirmDeleteBtn');
  const productNameSpan = modal.querySelector('#deleteProductName');
  
  let targetProductId = null;
  let targetRowElement = null;

  // Open modal on delete button click
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    if (!deleteBtn) return;

    e.preventDefault();
    targetProductId = deleteBtn.getAttribute('data-id');
    const productName = deleteBtn.getAttribute('data-name') || 'this product';
    targetRowElement = deleteBtn.closest('tr');

    if (productNameSpan) {
      productNameSpan.textContent = productName;
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  });

  // Close modal helper
  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    targetProductId = null;
    targetRowElement = null;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Product';
    }
  };

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  // Close modal when clicking backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Confirm delete handler -> calls DELETE /products/:id
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!targetProductId) return;

      try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = 'Deleting...';

        const response = await fetch(`/products/${targetProductId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          showToast(result.message || 'Product deleted successfully', 'success');
          
          // Animate row removal
          if (targetRowElement) {
            targetRowElement.style.transition = 'all 0.3s ease';
            targetRowElement.style.opacity = '0';
            targetRowElement.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
              targetRowElement.remove();
              updateProductCounts();
            }, 300);
          } else {
            window.location.reload();
          }

          closeModal();
        } else {
          showToast(result.message || 'Failed to delete product', 'error');
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Delete Product';
        }
      } catch (err) {
        console.error('Delete request error:', err);
        showToast('An error occurred while deleting the product', 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete Product';
      }
    });
  }
}

/**
 * Update table counter and check for empty state
 */
function updateProductCounts() {
  const tbody = document.querySelector('.admin-table tbody');
  const countBadge = document.getElementById('productCountBadge');
  
  if (tbody) {
    const visibleRows = tbody.querySelectorAll('tr:not([style*="display: none"])');
    const totalRows = tbody.querySelectorAll('tr');

    if (countBadge) {
      countBadge.textContent = `${totalRows.length} ${totalRows.length === 1 ? 'product' : 'products'}`;
    }

    if (totalRows.length === 0) {
      // Switch to empty state without reloading
      const tableCard = document.querySelector('.admin-table-card');
      const toolbar = document.querySelector('.admin-toolbar');
      if (tableCard) tableCard.style.display = 'none';
      if (toolbar) toolbar.style.display = 'none';

      const emptyContainer = document.getElementById('emptyStateContainer');
      if (emptyContainer) {
        emptyContainer.style.display = 'block';
      } else {
        window.location.reload();
      }
    }
  }
}

/**
 * Dynamic Image URLs Manager (Add / Remove / Live Preview)
 */
function initImageUrlsManager() {
  const container = document.getElementById('imageUrlsContainer');
  const addBtn = document.getElementById('addImageUrlBtn');
  const previewGrid = document.getElementById('imagePreviewsGrid');
  const previewSection = document.getElementById('imagePreviewsSection');

  if (!container || !addBtn) return;

  const updateIndicesAndPreviews = () => {
    const rows = container.querySelectorAll('.image-url-row');
    
    // Update numbering indices
    rows.forEach((row, index) => {
      const idxSpan = row.querySelector('.image-url-row-index');
      if (idxSpan) idxSpan.textContent = `${index + 1}.`;
      
      const removeBtn = row.querySelector('.btn-remove-url');
      if (removeBtn) {
        // Disable remove button if only 1 row exists
        removeBtn.disabled = rows.length === 1;
        removeBtn.style.opacity = rows.length === 1 ? '0.4' : '1';
        removeBtn.style.cursor = rows.length === 1 ? 'not-allowed' : 'pointer';
      }
    });

    // Update live previews
    if (previewGrid) {
      previewGrid.innerHTML = '';
      let hasValidPreview = false;

      rows.forEach(row => {
        const input = row.querySelector('input.image-url-input');
        const url = input ? input.value.trim() : '';

        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
          hasValidPreview = true;
          const thumb = document.createElement('div');
          thumb.className = 'preview-thumb-item';
          
          const img = document.createElement('img');
          img.src = url;
          img.alt = 'Product Image Preview';
          img.loading = 'lazy';
          img.onerror = () => {
            thumb.innerHTML = '<span style="font-size:10px;color:#ef4444;text-align:center;">Broken URL</span>';
          };

          thumb.appendChild(img);
          previewGrid.appendChild(thumb);
        }
      });

      if (previewSection) {
        previewSection.style.display = hasValidPreview ? 'block' : 'none';
      }
    }
  };

  // Listen to input changes for live preview
  container.addEventListener('input', (e) => {
    if (e.target.classList.contains('image-url-input')) {
      updateIndicesAndPreviews();
    }
  });

  // Add new image URL row
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const rows = container.querySelectorAll('.image-url-row');
    const newIndex = rows.length + 1;

    const rowDiv = document.createElement('div');
    rowDiv.className = 'image-url-row';
    rowDiv.innerHTML = `
      <span class="image-url-row-index">${newIndex}.</span>
      <input 
        type="url" 
        class="form-control image-url-input" 
        name="images[]" 
        placeholder="https://example.com/image${newIndex}.jpg" 
        autocomplete="off"
      >
      <button type="button" class="btn-remove-url" title="Remove URL" aria-label="Remove image URL">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    container.appendChild(rowDiv);
    
    // Focus the newly added input
    const newInput = rowDiv.querySelector('input');
    if (newInput) newInput.focus();

    updateIndicesAndPreviews();
  });

  // Remove URL row
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-url');
    if (!removeBtn) return;

    e.preventDefault();
    const rows = container.querySelectorAll('.image-url-row');
    if (rows.length > 1) {
      const row = removeBtn.closest('.image-url-row');
      if (row) {
        row.remove();
        updateIndicesAndPreviews();
      }
    }
  });

  // Initial preview render on load (for edit form)
  updateIndicesAndPreviews();
}

/**
 * Product Form Handler (Create POST & Edit PATCH via JSON payload)
 */
function initProductForm() {
  const form = document.getElementById('adminProductForm');
  if (!form) return;

  const alertBox = document.getElementById('formAlertBox');
  const alertText = document.getElementById('formAlertMessage');
  const submitBtn = document.getElementById('submitProductBtn');
  
  const formMode = form.getAttribute('data-mode') || 'create'; // 'create' or 'edit'
  const productId = form.getAttribute('data-product-id');

  const showAlert = (message, type = 'error') => {
    if (alertBox && alertText) {
      alertText.textContent = message;
      alertBox.className = `admin-alert ${type}`;
      alertBox.style.display = 'flex';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const hideAlert = () => {
    if (alertBox) {
      alertBox.style.display = 'none';
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    // 1. Gather form values
    const name = form.querySelector('#name')?.value.trim();
    const priceRaw = form.querySelector('#price')?.value;
    const category = form.querySelector('#category')?.value.trim();
    const brand = form.querySelector('#brand')?.value.trim();
    const stockRaw = form.querySelector('#stock')?.value;
    const description = form.querySelector('#description')?.value.trim();

    // 2. Gather image URLs array
    const imageInputs = form.querySelectorAll('.image-url-input');
    const images = [];
    imageInputs.forEach(input => {
      const val = input.value.trim();
      if (val) images.push(val);
    });

    // 3. Client-side validation
    if (!name) {
      showAlert('Product name is required.');
      return;
    }

    const price = parseFloat(priceRaw);
    if (isNaN(price) || price < 0) {
      showAlert('Please enter a valid non-negative product price.');
      return;
    }

    if (!category) {
      showAlert('Product category is required.');
      return;
    }

    if (!brand) {
      showAlert('Product brand is required.');
      return;
    }

    const stock = parseInt(stockRaw, 10);
    if (isNaN(stock) || stock < 0) {
      showAlert('Please enter a valid non-negative stock quantity.');
      return;
    }

    if (images.length === 0) {
      showAlert('Please enter at least one valid product image URL.');
      return;
    }

    // 4. Construct payload adhering to Product model
    const payload = {
      name,
      price,
      category,
      brand,
      stock,
      description: description || '',
      images
    };

    // 5. Determine endpoint and method
    const url = formMode === 'edit' ? `/products/${productId}` : '/products';
    const method = formMode === 'edit' ? 'PATCH' : 'POST';

    const originalBtnText = submitBtn ? submitBtn.textContent : 'Save';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = formMode === 'edit' ? 'Saving Changes...' : 'Creating Product...';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showToast(data.message || (formMode === 'edit' ? 'Product updated successfully' : 'Product created successfully'), 'success');
        
        // Redirect to admin products list
        setTimeout(() => {
          window.location.href = '/admin/products';
        }, 600);
      } else {
        showAlert(data.message || 'An error occurred while saving the product.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      showAlert('Failed to connect to the server. Please check your network and try again.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}

/**
 * Client-Side Instant Table Search / Filter
 */
function initTableSearch() {
  const searchInput = document.getElementById('adminTableSearch');
  const table = document.querySelector('.admin-table');
  if (!searchInput || !table) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const rows = table.querySelectorAll('tbody tr');

    let matchesCount = 0;

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const isMatch = text.includes(query);
      row.style.display = isMatch ? '' : 'none';
      if (isMatch) matchesCount++;
    });

    const countBadge = document.getElementById('productCountBadge');
    if (countBadge) {
      countBadge.textContent = query 
        ? `${matchesCount} of ${rows.length} products`
        : `${rows.length} ${rows.length === 1 ? 'product' : 'products'}`;
    }
  });
}
