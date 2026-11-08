// account.js
// Authentication, customer profile, order history, trade-in history and password changes

/* ================= Part 1: login.html ================= */

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const message = document.getElementById('login-message');

  setError('login-email', '');
  setError('login-password', '');
  message.textContent = '';
  message.className = 'form-message';

  let formIsOk = true;
  if (!email || !isValidEmail(email)) {
    setError('login-email', 'Please enter a valid email address.');
    formIsOk = false;
  }
  if (!password) {
    setError('login-password', 'Please enter your password.');
    formIsOk = false;
  }
  if (!formIsOk) return;

  try {
    await api.auth.login(email, password);
    const userRes = await api.auth.me();
    const user = userRes.user || userRes;
    window.currentUser = user;

    message.textContent = 'Login successful! Redirecting...';
    message.className = 'form-message success';

    const nextUrl = getUrlParam('next');
    setTimeout(() => {
      if (user.role === 'admin' && (!nextUrl || nextUrl.includes('admin'))) {
        window.location.href = nextUrl || 'admin/index.html';
      } else if (nextUrl) {
        window.location.href = nextUrl;
      } else {
        window.location.href = 'account.html';
      }
    }, 600);
  } catch (err) {
    message.textContent = err.message || 'Incorrect email or password.';
    message.className = 'form-message error';
  }
}

function showForgotPasswordMessage(event) {
  event.preventDefault();
  const message = document.getElementById('login-message');
  if (message) {
    message.textContent = 'To reset your password, contact an administrator or request an admin password reset.';
    message.className = 'form-message';
  }
}

/* ================= Part 2: register.html ================= */

async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim().toLowerCase();
  const phone = document.getElementById('register-phone').value.trim();
  const city = document.getElementById('register-city').value.trim();
  const address = document.getElementById('register-address').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  const agreed = document.getElementById('register-terms').checked;
  const message = document.getElementById('register-message');

  setError('register-name', '');
  setError('register-email', '');
  setError('register-phone', '');
  setError('register-city', '');
  setError('register-address', '');
  setError('register-password', '');
  setError('register-confirm', '');
  setError('register-terms', '');
  message.textContent = '';
  message.className = 'form-message';

  let formIsOk = true;
  if (name.length < 2) {
    setError('register-name', 'Please enter your full name.');
    formIsOk = false;
  }
  if (!isValidEmail(email)) {
    setError('register-email', 'Enter a valid email.');
    formIsOk = false;
  }
  if (password.length < 6) {
    setError('register-password', 'Password must be at least 6 characters.');
    formIsOk = false;
  }
  if (confirm !== password) {
    setError('register-confirm', 'Passwords do not match.');
    formIsOk = false;
  }
  if (!agreed) {
    setError('register-terms', 'Please agree to the terms.');
    formIsOk = false;
  }
  if (!formIsOk) return;

  try {
    await api.auth.register({
      name,
      email,
      password,
      phone: phone || undefined,
      city: city || undefined,
      address: address || undefined,
    });

    const userRes = await api.auth.me();
    window.currentUser = userRes.user || userRes;

    message.textContent = 'Account created successfully! Taking you to your account...';
    message.className = 'form-message success';
    setTimeout(() => {
      window.location.href = 'account.html';
    }, 800);
  } catch (err) {
    message.textContent = err.message || 'Registration failed. Email may already be in use.';
    message.className = 'form-message error';
  }
}

/* ================= Part 3: account.html ================= */

async function startAccountPage() {
  await showHeader();
  const user = await getLoggedInUser();

  if (!user) {
    document.getElementById('account-login-needed').hidden = false;
    document.getElementById('account-content').hidden = true;
    return;
  }

  document.getElementById('account-login-needed').hidden = true;
  document.getElementById('account-content').hidden = false;

  document.getElementById('account-name').textContent = user.name || '—';
  document.getElementById('account-email').textContent = user.email || '—';
  document.getElementById('account-phone').textContent = user.phone || '—';
  document.getElementById('account-address').textContent = user.address ? `${user.address}, ${user.city || ''}` : '—';
  document.getElementById('account-role').textContent = user.role === 'admin' ? 'Administrator' : 'Customer';

  await loadCustomerOrders(user.id);
  await loadCustomerTradeIns(user.id);
}

async function loadCustomerOrders(userId) {
  const box = document.getElementById('order-history');
  if (!box) return;

  try {
    const res = await api.orders.getAll();
    const allOrders = res.orders || res || [];
    const myOrders = allOrders.filter((o) => o.userId === userId);

    if (myOrders.length === 0) {
      box.innerHTML = '<p class="empty-state">No orders placed yet. <a href="shop.html">Browse products</a></p>';
      return;
    }

    let rows = '';
    for (const order of myOrders) {
      const itemsCount = (order.productsIds || []).length;
      const isReceived = order.status === 'completed';

      rows += `
        <tr>
          <td>#${order.id}</td>
          <td>${order.created_at ? String(order.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10)}</td>
          <td>${itemsCount} item(s)</td>
          <td>${formatPrice(order.totalPrice)}</td>
          <td><span class="status status-${escapeHTML(order.status)}">${escapeHTML(order.status)}</span></td>
          <td>
            <a href="track.html?order=${order.id}" style="color:var(--blue); margin-right:12px;">Track</a>
            ${
              !isReceived
                ? `<button type="button" class="btn btn-outline btn-small" onclick="handleCustomerOrderReceived(${order.id})">Received</button>`
                : '<span style="color:#16a34a">✓ Done</span>'
            }
          </td>
        </tr>
      `;
    }

    box.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    box.innerHTML = '<p class="empty-state">Failed to load order history.</p>';
  }
}

async function handleCustomerOrderReceived(orderId) {
  try {
    await api.orders.markReceived(orderId);
    showToast('Order confirmed as received!');
    const user = await getLoggedInUser();
    if (user) await loadCustomerOrders(user.id);
  } catch (err) {
    showToast(err.message || 'Failed to update order');
  }
}

async function loadCustomerTradeIns(userId) {
  const box = document.getElementById('trade-in-history');
  if (!box) return;

  try {
    const res = await api.soldLaptops.getAll();
    const allLaptops = res.soldLaptops || res || [];
    const myLaptops = allLaptops.filter((l) => l.userId === userId);

    if (myLaptops.length === 0) {
      box.innerHTML = '<p class="empty-state">No trade-in submissions yet. Have an old laptop? <a href="trade-in.html">Trade it in here</a>.</p>';
      return;
    }

    let rows = '';
    for (const item of myLaptops) {
      rows += `
        <tr>
          <td>#${item.id}</td>
          <td><strong>${escapeHTML(item.brand)}</strong> ${escapeHTML(item.model)} (${escapeHTML(item.year)})</td>
          <td>${escapeHTML(item.ram)} / ${escapeHTML(item.rom)} ${escapeHTML(item.romType || '')}</td>
          <td>${formatPrice(item.price)}</td>
          <td><span class="status status-${escapeHTML(item.status)}">${escapeHTML(item.status)}</span></td>
        </tr>
      `;
    }

    box.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>ID</th><th>Device</th><th>Specs</th><th>Valuation</th><th>Status</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (e) {
    box.innerHTML = '<p class="empty-state">Failed to load trade-in history.</p>';
  }
}

async function handleChangePassword(event) {
  event.preventDefault();
  const oldPw = document.getElementById('old-password').value;
  const newPw = document.getElementById('new-password').value;
  const msgEl = document.getElementById('change-pw-message');

  msgEl.textContent = '';
  msgEl.className = 'form-message';

  if (!oldPw || newPw.length < 6) {
    msgEl.textContent = 'New password must be at least 6 characters.';
    msgEl.className = 'form-message error';
    return;
  }

  try {
    await api.auth.changePassword(oldPw, newPw);
    msgEl.textContent = 'Password changed successfully!';
    msgEl.className = 'form-message success';
    document.getElementById('change-password-form').reset();
  } catch (err) {
    msgEl.textContent = err.message || 'Failed to change password. Old password may be incorrect.';
    msgEl.className = 'form-message error';
  }
}
