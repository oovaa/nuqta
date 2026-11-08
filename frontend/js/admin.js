// admin.js
// Complete Administration Dashboard logic covering all backend administrative services

async function checkAdminAccess() {
  const user = await getLoggedInUser();
  if (user && user.role === 'admin') {
    const denied = document.getElementById('admin-denied');
    const content = document.getElementById('admin-content');
    if (denied) denied.hidden = true;
    if (content) content.hidden = false;
    return true;
  }
  const denied = document.getElementById('admin-denied');
  const content = document.getElementById('admin-content');
  if (denied) denied.hidden = false;
  if (content) content.hidden = true;
  return false;
}

/* ================= 1. Overview, Products, Categories ================= */

let cachedCategories = [];
let cachedProducts = [];

async function startOverviewPage() {
  if (!(await checkAdminAccess())) return;
  await Promise.all([loadOverviewMetrics(), loadRecentOrders(), loadRecentTradeIns()]);
}

// Backwards-compatible alias
async function startAdminPage() {
  await startOverviewPage();
}

async function loadOverviewMetrics() {
  try {
    const [pRes, oRes, uRes, tRes, sRes, rRes, cRes] = await Promise.all([
      api.products.getAll().catch(() => ({ products: [] })),
      api.orders.getAll().catch(() => ({ orders: [] })),
      api.users.getAll().catch(() => ({ users: [] })),
      api.soldLaptops.getAll().catch(() => ({ soldLaptops: [] })),
      api.shipping.getAll().catch(() => ({ shippings: [] })),
      api.reviews.getAll().catch(() => ({ reviews: [] })),
      api.categories.getAll().catch(() => ({ categories: [] })),
    ]);

    const prods = pRes.products || pRes || [];
    const orders = oRes.orders || oRes || [];
    const users = uRes.users || uRes || [];
    const tradeIns = tRes.soldLaptops || tRes || [];
    const shippings = sRes.shippings || sRes || [];
    const reviews = rRes.reviews || rRes || [];
    const categories = cRes.categories || cRes || [];

    // 1. Gross Revenue
    let revenue = 0;
    for (const o of orders) {
      if (o.status !== 'abandoned') {
        revenue += parseFloat(o.totalPrice) || 0;
      }
    }
    const revEl = document.getElementById('card-revenue');
    if (revEl) revEl.textContent = formatPrice(revenue);

    // 2. Orders
    const ordEl = document.getElementById('card-orders');
    if (ordEl) ordEl.textContent = orders.length;
    const activeOrders = orders.filter((o) => o.status === 'active' || o.status === 'checked_out').length;
    const ordBadge = document.getElementById('card-orders-badge');
    if (ordBadge) ordBadge.textContent = `${activeOrders} Active`;

    // 3. Trade-ins
    const tinEl = document.getElementById('card-tradeins');
    if (tinEl) tinEl.textContent = tradeIns.length;
    const pendingTradeIns = tradeIns.filter((t) => t.status === 'pending').length;
    const tinBadge = document.getElementById('card-tradeins-badge');
    if (tinBadge) tinBadge.textContent = `${pendingTradeIns} Pending`;

    // 4. Shipping
    const shEl = document.getElementById('card-shipping');
    if (shEl) shEl.textContent = shippings.length;
    const pendingShipping = shippings.filter((s) => s.status === 'pending').length;
    const shBadge = document.getElementById('card-shipping-badge');
    if (shBadge) shBadge.textContent = `${pendingShipping} Pending`;

    // 5. Products
    const prEl = document.getElementById('card-products');
    if (prEl) prEl.textContent = prods.length;
    const prSub = document.getElementById('card-products-sub');
    if (prSub) prSub.textContent = `Across ${categories.length} categories`;

    // 6. Categories
    const catEl = document.getElementById('card-categories');
    if (catEl) catEl.textContent = categories.length;

    // 7. Users
    const uEl = document.getElementById('card-users');
    if (uEl) uEl.textContent = users.length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const uBadge = document.getElementById('card-users-badge');
    if (uBadge) uBadge.textContent = `${adminCount} Admin / ${users.length - adminCount} Customer`;

    // 8. Reviews
    const revsEl = document.getElementById('card-reviews');
    if (revsEl) revsEl.textContent = reviews.length;
  } catch (err) {
    console.error('Overview metrics error:', err);
  }
}

async function loadRecentOrders() {
  const container = document.getElementById('recent-orders-table');
  if (!container) return;
  try {
    const res = await api.orders.getAll();
    const orders = (res.orders || res || []).slice(0, 5);
    if (orders.length === 0) {
      container.innerHTML = '<p class="empty-state">No orders placed yet.</p>';
      return;
    }
    const trackPrefix = window.location.pathname.replace(/\\/g, '/').includes('/admin/') ? '../' : '';
    let rows = orders.map((o) => `
      <tr>
        <td><a href="${trackPrefix}track.html?order=${o.id}" target="_blank"><strong>#${o.id}</strong></a></td>
        <td>User #${o.userId}</td>
        <td><strong>${formatPrice(o.totalPrice)}</strong></td>
        <td><span class="badge" style="font-size:16px;">${escapeHTML(o.status)}</span></td>
      </tr>
    `).join('');
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load recent orders.</p>';
  }
}

async function loadRecentTradeIns() {
  const container = document.getElementById('recent-tradeins-table');
  if (!container) return;
  try {
    const res = await api.soldLaptops.getAll();
    const tradeIns = (res.soldLaptops || res || []).slice(0, 5);
    if (tradeIns.length === 0) {
      container.innerHTML = '<p class="empty-state">No trade-in submissions yet.</p>';
      return;
    }
    let rows = tradeIns.map((t) => `
      <tr>
        <td><strong>${escapeHTML(t.brand)} ${escapeHTML(t.model)}</strong></td>
        <td>${formatPrice(t.price)}</td>
        <td><span class="badge" style="font-size:16px;">${escapeHTML(t.status || 'pending')}</span></td>
      </tr>
    `).join('');
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr><th>Device</th><th>Expected Payout</th><th>Status</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load trade-ins.</p>';
  }
}

/* ================= Products Page ================= */

async function startProductsPage() {
  if (!(await checkAdminAccess())) return;
  await Promise.all([showCategoryTable(), showProductTable()]);
}

function handleFilterProducts(query) {
  const q = (query || '').toLowerCase().trim();
  const filtered = q
    ? cachedProducts.filter((p) => (p.name && p.name.toLowerCase().includes(q)) || (p.company && p.company.toLowerCase().includes(q)))
    : cachedProducts;
  renderProductRows(filtered);
}

function renderProductRows(products) {
  const container = document.getElementById('product-table');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = '<p class="empty-state">No products match your criteria.</p>';
    return;
  }

  let rows = '';
  for (const p of products) {
    const cat = cachedCategories.find((c) => c.id === p.categoryId);
    const catName = cat ? cat.name : p.company || '—';

    rows += `
      <tr>
        <td><strong>${escapeHTML(p.name)}</strong></td>
        <td>${escapeHTML(catName)}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${p.year || '2026'}</td>
        <td class="text-actions">
          <button type="button" onclick="editProduct(${p.id})">Edit</button>
          <span style="color:#bbb; margin:0 4px;">·</span>
          <button type="button" class="danger-btn" onclick="deleteProduct(${p.id})">Delete</button>
        </td>
      </tr>
    `;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr><th>Product</th><th>Category / Brand</th><th>Price</th><th>Year</th><th>Actions</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function showProductTable() {
  const container = document.getElementById('product-table');
  if (!container) return;

  try {
    const res = await api.products.getAll();
    cachedProducts = res.products || res || [];
    renderProductRows(cachedProducts);
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load products.</p>';
  }
}

/* ================= Categories Page ================= */

async function startCategoriesPage() {
  if (!(await checkAdminAccess())) return;
  await showCategoryTable();
}

function resetCategoryForm() {
  const idEl = document.getElementById('category-id');
  if (idEl) idEl.value = '';
  const input = document.getElementById('new-category');
  if (input) input.value = '';
  const title = document.getElementById('category-form-title');
  if (title) title.textContent = 'Add / edit category';
  const btn = document.getElementById('category-submit-btn');
  if (btn) btn.textContent = 'Save Category';
}

async function showCategoryTable() {
  const container = document.getElementById('category-table');
  const select = document.getElementById('product-category');
  if (!container) return;

  try {
    const res = await api.categories.getAll();
    cachedCategories = res.categories || res || [];

    if (select) {
      select.innerHTML =
        '<option value="">Choose a category</option>' +
        cachedCategories.map((c) => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    }

    if (cachedCategories.length === 0) {
      container.innerHTML = '<p class="empty-state">No categories added yet.</p>';
      return;
    }

    let rows = '';
    for (const c of cachedCategories) {
      rows += `
        <tr>
          <td><strong>${escapeHTML(c.name)}</strong></td>
          <td class="text-actions">
            <button type="button" onclick="editCategory(${c.id}, '${escapeHTML(c.name)}')">Rename</button>
            <span style="color:#bbb; margin:0 4px;">·</span>
            <button type="button" class="danger-btn" onclick="deleteCategory(${c.id})">Delete</button>
          </td>
        </tr>
      `;
    }

    container.innerHTML = `
      <table class="admin-table">
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load categories.</p>';
  }
}

function resetProductForm() {
  const form = document.getElementById('product-form');
  if (form) form.reset();
  const idEl = document.getElementById('product-id');
  if (idEl) idEl.value = '';
  const title = document.getElementById('product-form-title');
  if (title) title.textContent = 'Add / edit product';
  const saveBtn = document.getElementById('product-save-btn');
  if (saveBtn) saveBtn.textContent = 'Save Product';
  const preview = document.getElementById('product-image-name');
  if (preview) preview.textContent = 'Choose image file';
}

function editProduct(productId) {
  const p = cachedProducts.find((item) => item.id === productId);
  if (!p) return;

  resetProductForm();
  document.getElementById('product-id').value = p.id;
  document.getElementById('product-form-title').textContent = `Edit Product: ${p.name}`;
  document.getElementById('product-name').value = p.name || '';
  document.getElementById('product-brand').value = p.company || '';
  if (p.categoryId) document.getElementById('product-category').value = p.categoryId;
  document.getElementById('product-price').value = p.price || '';
  document.getElementById('product-year').value = p.year || '';
  document.getElementById('product-color').value = p.color || '';
  document.getElementById('product-ram').value = p.ram || '';
  document.getElementById('product-rom').value = p.rom || '';
  document.getElementById('product-description').value = p.description || '';
  document.getElementById('product-save-btn').textContent = 'Update Product';
  document.getElementById('product-name').focus();
}

async function handleSaveProduct(event) {
  event.preventDefault();
  const id = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const price = document.getElementById('product-price').value;
  const categoryId = document.getElementById('product-category').value;
  const brand = document.getElementById('product-brand').value.trim();
  const year = document.getElementById('product-year').value;
  const color = document.getElementById('product-color').value.trim();
  const ram = document.getElementById('product-ram').value.trim();
  const rom = document.getElementById('product-rom').value.trim();
  const desc = document.getElementById('product-description').value.trim();
  const fileInput = document.getElementById('product-image');

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    if (categoryId) formData.append('categoryId', categoryId);
    if (brand) formData.append('company', brand);
    if (year) formData.append('year', year);
    if (color) formData.append('color', color);
    if (ram) formData.append('ram', ram);
    if (rom) formData.append('rom', rom);
    if (desc) formData.append('description', desc);

    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    if (id) {
      await api.products.update(id, formData);
      showToast('Product updated successfully!');
    } else {
      await api.products.create(formData);
      showToast('Product created successfully!');
    }

    resetProductForm();
    await showProductTable();
    await showStats();
  } catch (err) {
    showToast(err.message || 'Failed to save product');
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    await api.products.delete(productId);
    showToast('Product deleted');
    await showProductTable();
    await showStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete product');
  }
}

function editCategory(catId, name) {
  document.getElementById('category-id').value = catId;
  const input = document.getElementById('new-category');
  input.value = name;
  document.getElementById('category-submit-btn').textContent = 'Update';
  input.focus();
}

async function handleSaveCategory(event) {
  event.preventDefault();
  const id = document.getElementById('category-id').value;
  const name = document.getElementById('new-category').value.trim();
  if (!name) return;

  try {
    if (id) {
      await api.categories.update(id, name);
      showToast('Category renamed');
    } else {
      await api.categories.create(name);
      showToast('Category added');
    }
    document.getElementById('category-id').value = '';
    document.getElementById('new-category').value = '';
    document.getElementById('category-submit-btn').textContent = 'Add';
    await showCategoryTable();
  } catch (err) {
    showToast(err.message || 'Failed to save category');
  }
}

async function deleteCategory(catId) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  try {
    await api.categories.delete(catId);
    showToast('Category deleted');
    await showCategoryTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete category');
  }
}

function previewUploadImage(input, previewId) {
  const el = document.getElementById(previewId);
  if (input.files && input.files[0]) {
    el.textContent = input.files[0].name;
  }
}

/* ================= 2. Orders, Shipping, Payments, Users ================= */

let cachedUsers = [];

async function startOrdersPage() {
  if (!(await checkAdminAccess())) return;
  await loadOrdersTable();
}

async function startShippingPage() {
  if (!(await checkAdminAccess())) return;
  await loadShippingTable();
}

async function startPaymentsPage() {
  if (!(await checkAdminAccess())) return;
  await loadPaymentsTable();
}

async function startUsersPage() {
  if (!(await checkAdminAccess())) return;
  await loadUsersTable();
}

async function loadOrdersTable() {
  const container = document.getElementById('order-table');
  if (!container) return;

  try {
    const res = await api.orders.getAll();
    const orders = res.orders || res || [];

    if (orders.length === 0) {
      container.innerHTML = '<p class="empty-state">No orders found.</p>';
      return;
    }

    const statuses = ['active', 'checked_out', 'abandoned', 'completed'];

    let rows = '';
    for (const order of orders) {
      let options = statuses
        .map((s) => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`)
        .join('');

      const trackPrefix = window.location.pathname.replace(/\\/g, '/').includes('/admin/') ? '../' : '';
      rows += `
        <tr>
          <td><a href="${trackPrefix}track.html?order=${order.id}" target="_blank"><strong>#${order.id}</strong></a></td>
          <td>User #${order.userId}</td>
          <td>${formatPrice(order.totalPrice)}</td>
          <td>
            <select class="status-select" onchange="handleAdminChangeOrderStatus(${order.id}, this.value)">
              ${options}
            </select>
          </td>
          <td class="text-actions">
            <button type="button" class="danger-btn" onclick="handleAdminDeleteOrder(${order.id})">Delete</button>
          </td>
        </tr>
      `;
    }

    container.innerHTML = `
      <table class="admin-table" style="max-width:1100px">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load orders.</p>';
  }
}

async function handleAdminChangeOrderStatus(orderId, status) {
  try {
    await api.orders.updateStatus(orderId, status);
    showToast(`Order #${orderId} status set to ${status}`);
  } catch (err) {
    showToast(err.message || 'Status update failed');
  }
}

async function handleAdminDeleteOrder(orderId) {
  if (!confirm(`Delete order #${orderId}?`)) return;
  try {
    await api.orders.delete(orderId);
    showToast(`Order #${orderId} deleted`);
    await loadOrdersTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete order');
  }
}

async function loadShippingTable() {
  const container = document.getElementById('shipping-table');
  if (!container) return;

  try {
    const res = await api.shipping.getAll();
    const shippings = res.shippings || res || [];

    if (shippings.length === 0) {
      container.innerHTML = '<p class="empty-state">No shipping records.</p>';
      return;
    }

    const statuses = ['pending', 'approved', 'rejected', 'completed'];

    let rows = '';
    for (const sh of shippings) {
      let options = statuses
        .map((s) => `<option value="${s}" ${s === sh.status ? 'selected' : ''}>${s}</option>`)
        .join('');

      rows += `
        <tr>
          <td>#${sh.id} (Order #${sh.cartId || sh.orderId})</td>
          <td>${escapeHTML(sh.city || '')} - ${escapeHTML(sh.address || '')}</td>
          <td>${escapeHTML(sh.phone || '—')}</td>
          <td>${formatPrice(sh.price)}</td>
          <td>
            <select class="status-select" onchange="handleAdminChangeShippingStatus(${sh.id}, this.value)">
              ${options}
            </select>
          </td>
          <td class="text-actions">
            <button type="button" class="danger-btn" onclick="handleAdminDeleteShipping(${sh.id})">Delete</button>
          </td>
        </tr>
      `;
    }

    container.innerHTML = `
      <table class="admin-table" style="max-width:1100px">
        <thead>
          <tr><th>Shipment ID</th><th>Address</th><th>Phone</th><th>Fee</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load shipping records.</p>';
  }
}

async function handleAdminChangeShippingStatus(shippingId, status) {
  try {
    await api.shipping.update(shippingId, { status });
    showToast(`Shipping #${shippingId} status updated to ${status}`);
  } catch (err) {
    showToast(err.message || 'Shipping status update failed');
  }
}

async function handleAdminDeleteShipping(shippingId) {
  if (!confirm(`Delete shipping record #${shippingId}?`)) return;
  try {
    await api.shipping.delete(shippingId);
    showToast(`Shipping record #${shippingId} deleted`);
    await loadShippingTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete shipping');
  }
}

async function loadPaymentsTable() {
  const container = document.getElementById('payment-table');
  if (!container) return;

  try {
    const res = await api.payment.getAll();
    const payments = res.payment || res || [];

    if (payments.length === 0) {
      container.innerHTML = '<p class="empty-state">No payment records found.</p>';
      return;
    }

    let rows = '';
    for (const p of payments) {
      rows += `
        <tr>
          <td>#${p.id}</td>
          <td>Order #${p.orderId || p.cartId}</td>
          <td>User #${p.userId}</td>
          <td><strong>${formatPrice(p.amount)}</strong></td>
          <td><span class="badge" style="font-size:18px; padding:2px 10px;">${escapeHTML(p.method || 'cash')}</span></td>
          <td>${escapeHTML(p.status || 'pending')}</td>
        </tr>
      `;
    }

    container.innerHTML = `
      <table class="admin-table" style="max-width:1100px">
        <thead>
          <tr><th>Payment ID</th><th>Order</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load payments.</p>';
  }
}

async function loadUsersTable() {
  const container = document.getElementById('user-table');
  if (!container) return;

  try {
    const res = await api.users.getAll();
    cachedUsers = res.users || res || [];

    if (cachedUsers.length === 0) {
      container.innerHTML = '<p class="empty-state">No users registered.</p>';
      return;
    }

    let rows = '';
    for (const u of cachedUsers) {
      rows += `
        <tr>
          <td><strong>${escapeHTML(u.name)}</strong></td>
          <td>${escapeHTML(u.email)}</td>
          <td>
            <select class="status-select" style="width:110px" onchange="handleAdminChangeUserRole(${u.id}, this.value)">
              <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
          <td>${escapeHTML(u.city || '—')}</td>
          <td class="text-actions">
            <button type="button" onclick="openEditUserForm(${u.id})">Edit</button>
            <span style="color:#bbb; margin:0 4px;">·</span>
            <button type="button" onclick="openResetPasswordForm('${escapeHTML(u.email)}')">Reset PW</button>
            <span style="color:#bbb; margin:0 4px;">·</span>
            <button type="button" class="danger-btn" onclick="handleAdminDeleteUser(${u.id})">Delete</button>
          </td>
        </tr>
      `;
    }

    container.innerHTML = `
      <table class="admin-table" style="max-width:1100px">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load users.</p>';
  }
}

function openEditUserForm(userId) {
  const u = cachedUsers.find((x) => x.id === userId);
  if (!u) return;

  document.getElementById('user-id').value = u.id;
  document.getElementById('user-form-title').textContent = `Edit User: ${u.name}`;
  document.getElementById('user-name').value = u.name || '';
  document.getElementById('user-email').value = u.email || '';
  document.getElementById('user-phone').value = u.phone || '';
  document.getElementById('user-city').value = u.city || '';
  document.getElementById('user-address').value = u.address || '';
  document.getElementById('user-role').value = u.role || 'user';

  const form = document.getElementById('user-form');
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth' });
}

function closeUserForm() {
  document.getElementById('user-form').style.display = 'none';
}

async function handleSaveUser(event) {
  event.preventDefault();
  const id = document.getElementById('user-id').value;
  const name = document.getElementById('user-name').value.trim();
  const phone = document.getElementById('user-phone').value.trim();
  const city = document.getElementById('user-city').value.trim();
  const address = document.getElementById('user-address').value.trim();
  const role = document.getElementById('user-role').value;

  try {
    await api.users.update(id, { name, phone, city, address, role });
    showToast('User profile updated');
    closeUserForm();
    await loadUsersTable();
  } catch (err) {
    showToast(err.message || 'Failed to update user');
  }
}

async function handleAdminChangeUserRole(userId, newRole) {
  try {
    await api.users.updateRole(userId, newRole);
    showToast(`User role updated to ${newRole}`);
    await loadUsersTable();
  } catch (err) {
    showToast(err.message || 'Role change failed');
  }
}

async function handleAdminDeleteUser(userId) {
  if (!confirm(`Delete user #${userId}? This cannot be undone.`)) return;
  try {
    await api.users.delete(userId);
    showToast(`User #${userId} deleted`);
    await loadUsersTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete user');
  }
}

function openResetPasswordForm(email) {
  document.getElementById('reset-email').value = email;
  document.getElementById('reset-user-email-title').textContent = `Reset Password for: ${email}`;
  const form = document.getElementById('reset-password-form');
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth' });
}

function closeResetPasswordForm() {
  document.getElementById('reset-password-form').style.display = 'none';
}

async function handleAdminResetPassword(event) {
  event.preventDefault();
  const email = document.getElementById('reset-email').value;
  const adminPw = document.getElementById('admin-current-pw').value;
  const newPw = document.getElementById('new-user-pw').value;

  try {
    await api.auth.resetPassword(email, adminPw, newPw);
    showToast('User password successfully reset!');
    closeResetPasswordForm();
    document.getElementById('reset-password-form').reset();
  } catch (err) {
    showToast(err.message || 'Password reset failed. Verify admin password.');
  }
}

/* ================= 3. admin-parts.html (Parts & Pricing) ================= */

let cachedParts = [];

async function startPartsPage() {
  if (!(await checkAdminAccess())) return;
  await loadPartsTable();
}

async function loadPartsTable() {
  const container = document.getElementById('parts-table');
  if (!container) return;

  try {
    const res = await api.parts.getAll();
    cachedParts = res.parts || res || [];

    if (cachedParts.length === 0) {
      container.innerHTML = '<p class="empty-state">No parts registered yet.</p>';
      return;
    }

    let rows = '';
    for (const part of cachedParts) {
      rows += `
        <tr>
          <td><strong>${escapeHTML(part.name)}</strong></td>
          <td><span class="badge" style="font-size:18px; padding:2px 10px;">${escapeHTML(part.type)}</span></td>
          <td>${formatPrice(part.price)}</td>
          <td class="text-actions">
            <button type="button" onclick="editPart(${part.id})">Edit</button>
            <span style="color:#bbb; margin:0 4px;">·</span>
            <button type="button" class="danger-btn" onclick="deletePart(${part.id})">Delete</button>
          </td>
        </tr>
      `;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr><th>Part / Spec</th><th>Type</th><th>Valuation</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load parts.</p>';
  }
}

function resetPartForm() {
  document.getElementById('part-form').reset();
  document.getElementById('part-id').value = '';
  document.getElementById('part-form-title').textContent = 'Add / edit part';
  document.getElementById('part-save-btn').textContent = 'Save Part';
}

function editPart(partId) {
  const part = cachedParts.find((p) => p.id === partId);
  if (!part) return;

  document.getElementById('part-id').value = part.id;
  document.getElementById('part-name').value = part.name;
  document.getElementById('part-type').value = part.type;
  document.getElementById('part-price').value = part.price;
  document.getElementById('part-form-title').textContent = `Edit Part: ${part.name}`;
  document.getElementById('part-save-btn').textContent = 'Update Part';
  document.getElementById('part-name').focus();
}

async function handleSavePart(event) {
  event.preventDefault();
  const id = document.getElementById('part-id').value;
  const name = document.getElementById('part-name').value.trim();
  const type = document.getElementById('part-type').value;
  const price = document.getElementById('part-price').value;

  try {
    if (id) {
      await api.parts.update(id, { name, type, price: Number(price) });
      showToast('Part updated');
    } else {
      await api.parts.create(name, type, price);
      showToast('Part added');
    }
    resetPartForm();
    await loadPartsTable();
  } catch (err) {
    showToast(err.message || 'Failed to save part');
  }
}

async function deletePart(partId) {
  if (!confirm('Are you sure you want to delete this part?')) return;
  try {
    await api.parts.delete(partId);
    showToast('Part removed');
    await loadPartsTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete part');
  }
}

/* ================= 4. admin-trade-ins.html (Sold Laptops) ================= */

let cachedTradeIns = [];

async function startTradeInsPage() {
  if (!(await checkAdminAccess())) return;
  await loadTradeInsTable();
}

async function loadTradeInsTable() {
  const container = document.getElementById('trade-in-table');
  if (!container) return;

  try {
    const res = await api.soldLaptops.getAll();
    cachedTradeIns = res.soldLaptops || res || [];

    if (cachedTradeIns.length === 0) {
      container.innerHTML = '<p class="empty-state">No trade-in submissions received yet.</p>';
      return;
    }

    const statuses = ['pending', 'approved', 'rejected', 'completed'];

    let rows = '';
    for (const item of cachedTradeIns) {
      let options = statuses
        .map((s) => `<option value="${s}" ${s === item.status ? 'selected' : ''}>${s}</option>`)
        .join('');

      rows += `
        <tr>
          <td><strong>${escapeHTML(item.brand)} ${escapeHTML(item.model)}</strong> (${item.year})</td>
          <td>${escapeHTML(item.cpu)} / ${escapeHTML(item.ram)} / ${escapeHTML(item.rom)}</td>
          <td>${item.conditionRating ? item.conditionRating + '/10' : '—'}</td>
          <td><strong>${formatPrice(item.price)}</strong></td>
          <td>
            <select class="status-select" onchange="handleAdminChangeTradeInStatus(${item.id}, this.value)">
              ${options}
            </select>
          </td>
          <td class="text-actions">
            <button type="button" onclick="viewTradeInDetail(${item.id})">Inspect</button>
            <span style="color:#bbb; margin:0 4px;">·</span>
            <button type="button" class="danger-btn" onclick="handleAdminDeleteTradeIn(${item.id})">Delete</button>
          </td>
        </tr>
      `;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr><th>Device</th><th>Configuration</th><th>Condition</th><th>Price</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load trade-in laptops.</p>';
  }
}

async function handleAdminChangeTradeInStatus(tradeInId, status) {
  try {
    await api.soldLaptops.updateStatus(tradeInId, status);
    showToast(`Trade-in #${tradeInId} status set to ${status}`);
  } catch (err) {
    showToast(err.message || 'Status update failed');
  }
}

async function handleAdminDeleteTradeIn(tradeInId) {
  if (!confirm(`Delete trade-in submission #${tradeInId}?`)) return;
  try {
    await api.soldLaptops.delete(tradeInId);
    showToast('Trade-in record deleted');
    closeTradeInDetail();
    await loadTradeInsTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete trade-in');
  }
}

function viewTradeInDetail(tradeInId) {
  const item = cachedTradeIns.find((t) => t.id === tradeInId);
  if (!item) return;

  const card = document.getElementById('trade-in-detail-card');
  const body = document.getElementById('trade-in-detail-body');
  document.getElementById('trade-in-detail-title').textContent = `${item.brand} ${item.model} (${item.year})`;

  let imagesHtml = '';
  if (item.images && item.images.length > 0) {
    imagesHtml = `
      <div style="margin-top:16px;">
        <strong>Attached Device Photos:</strong>
        <div style="display:flex; gap:12px; margin-top:8px; flex-wrap:wrap;">
          ${item.images
            .map((img) => `<a href="${api.mediaUrl(img)}" target="_blank"><img src="${api.mediaUrl(img)}" class="thumb-preview" alt="Device"></a>`)
            .join('')}
        </div>
      </div>
    `;
  }

  body.innerHTML = `
    <div class="two-columns" style="gap:24px; font-size:20px;">
      <div>
        <p><strong>Brand / Model:</strong> ${escapeHTML(item.brand)} ${escapeHTML(item.model)}</p>
        <p><strong>Processor (CPU):</strong> ${escapeHTML(item.cpu)}</p>
        <p><strong>Graphics (GPU):</strong> ${escapeHTML(item.gpu || 'Integrated')}</p>
        <p><strong>RAM / ROM:</strong> ${escapeHTML(item.ram)} / ${escapeHTML(item.rom)} (${escapeHTML(item.romType || 'SSD')})</p>
        <p><strong>Screen Size:</strong> ${escapeHTML(item.size || '—')}</p>
      </div>
      <div>
        <p><strong>Battery Health:</strong> ${item.batteryHealth ? item.batteryHealth + '%' : 'Not specified'}</p>
        <p><strong>Charge Cycles:</strong> ${item.chargeCycles || 'Not specified'}</p>
        <p><strong>Hardware Condition:</strong> ${item.conditionRating ? item.conditionRating + '/10' : '—'}</p>
        <p><strong>Expected Payout:</strong> ${formatPrice(item.price)}</p>
        <p><strong>Owner:</strong> User #${item.userId}</p>
      </div>
    </div>
    ${imagesHtml}
  `;

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth' });
}

function closeTradeInDetail() {
  const card = document.getElementById('trade-in-detail-card');
  if (card) card.style.display = 'none';
}

/* ================= 5. admin-reviews.html (Reviews Moderation) ================= */

let cachedReviews = [];

async function startReviewsPage() {
  if (!(await checkAdminAccess())) return;
  await loadReviewsTable();
}

async function loadReviewsTable() {
  const container = document.getElementById('reviews-table');
  if (!container) return;

  try {
    const res = await api.reviews.getAll();
    cachedReviews = res.reviews || res || [];

    if (cachedReviews.length === 0) {
      container.innerHTML = '<p class="empty-state">No product reviews submitted yet.</p>';
      return;
    }

    let rows = '';
    for (const r of cachedReviews) {
      const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
      rows += `
        <tr>
          <td>#${r.id}</td>
          <td>Product #${r.productId}</td>
          <td>User #${r.userId}</td>
          <td><span style="color:var(--star)">${stars}</span> (${r.rating || 5}/5)</td>
          <td style="max-width:300px;">${escapeHTML(r.review)}</td>
          <td class="text-actions">
            <button type="button" class="danger-btn" onclick="handleAdminDeleteReview(${r.id})">Delete</button>
          </td>
        </tr>
      `;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr><th>ID</th><th>Product</th><th>Author</th><th>Rating</th><th>Review Content</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Failed to load reviews.</p>';
  }
}

async function handleAdminDeleteReview(reviewId) {
  if (!confirm(`Delete review #${reviewId}?`)) return;
  try {
    await api.reviews.delete(reviewId);
    showToast('Review deleted');
    await loadReviewsTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete review');
  }
}
