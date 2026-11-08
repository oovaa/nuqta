// cart.js
// Live cart operations, checkout, shipping, payment and order tracking

const FLAT_SHIPPING = 49;

/* ================= Part 1: cart.html ================= */

async function startCartPage() {
  await showHeader();

  const user = await getLoggedInUser();
  const list = document.getElementById('cart-items');
  const checkoutBtn = document.getElementById('checkout-button');

  if (!user) {
    if (list) {
      list.innerHTML = '<p class="empty-state">Please <a href="login.html?next=cart.html">log in</a> to see your cart.</p>';
    }
    if (checkoutBtn) checkoutBtn.hidden = true;
    updateCartTotals(0);
    return;
  }

  try {
    const res = await api.cart.get();
    const items = res.items || [];

    if (items.length === 0) {
      list.innerHTML = '<p class="empty-state">Your cart is empty. <a href="shop.html">Browse products</a></p>';
      if (checkoutBtn) checkoutBtn.hidden = true;
      updateCartTotals(0);
    } else {
      let subtotal = 0;
      let html = '';

      for (const item of items) {
        const itemPrice = Number(item.price) || 0;
        const lineTotal = itemPrice * item.quantity;
        subtotal += lineTotal;
        const img = api.mediaUrl(item.imageUrl || item.thumbnailImageUrl);

        html += `
          <div class="panel cart-item" data-product-id="${item.id}">
            <img src="${escapeHTML(img)}" alt="${escapeHTML(item.name)}">
            <div>
              <h3><a href="product.html?id=${item.id}">${escapeHTML(item.name)}</a></h3>
              <p class="cart-option">${escapeHTML(item.company || 'Standard')}</p>
              <p class="price">${formatPrice(itemPrice)}</p>
            </div>
            <div class="cart-item-actions">
              <button type="button" class="btn btn-outline btn-small" onclick="handleRemoveCartItem(${item.id})">Remove</button>
              <div class="qty-control">
                <button type="button" aria-label="Decrease quantity" onclick="handleChangeCartQuantity(${item.id}, ${item.quantity - 1})">&minus;</button>
                <span>${item.quantity}</span>
                <button type="button" aria-label="Increase quantity" onclick="handleChangeCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
              </div>
            </div>
          </div>
        `;
      }

      list.innerHTML = html;
      if (checkoutBtn) checkoutBtn.hidden = false;
      updateCartTotals(subtotal);
    }
  } catch (err) {
    console.error('Failed to load cart:', err);
    if (list) list.innerHTML = '<p class="empty-state">Error loading cart.</p>';
  }
}

function updateCartTotals(subtotal) {
  const shipping = subtotal > 0 ? FLAT_SHIPPING : 0;
  const total = subtotal + shipping;

  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (shippingEl) shippingEl.textContent = formatPrice(shipping);
  if (totalEl) totalEl.textContent = formatPrice(total);
}

async function handleChangeCartQuantity(productId, newQty) {
  try {
    if (newQty <= 0) {
      await api.cart.removeItem(productId);
    } else {
      await api.cart.updateItem(productId, newQty);
    }
    await updateCartCount();
    await startCartPage();
  } catch (err) {
    showToast(err.message || 'Could not update quantity');
  }
}

async function handleRemoveCartItem(productId) {
  try {
    await api.cart.removeItem(productId);
    await updateCartCount();
    showToast('Item removed from cart');
    await startCartPage();
  } catch (err) {
    showToast(err.message || 'Could not remove item');
  }
}

/* ================= Part 2: checkout.html ================= */

let currentCheckoutCart = null;

async function startCheckoutPage() {
  await showHeader();
  const user = await getLoggedInUser();

  if (!user) {
    document.getElementById('checkout-login-needed').hidden = false;
    document.getElementById('shipping-form').hidden = true;
    return;
  }

  try {
    const res = await api.cart.get();
    currentCheckoutCart = res;
    const items = res.items || [];

    if (items.length === 0) {
      window.location.href = 'cart.html';
      return;
    }

    document.getElementById('shipping-form').hidden = false;
    document.getElementById('checkout-login-needed').hidden = true;

    // Pre-fill user information
    if (user.name) document.getElementById('ship-name').value = user.name;
    if (user.phone) document.getElementById('ship-phone').value = user.phone;
    if (user.city) document.getElementById('ship-city').value = user.city;
    if (user.address) document.getElementById('ship-address').value = user.address;

    let subtotal = 0;
    let itemsHtml = '';
    for (const it of items) {
      const price = Number(it.price) || 0;
      subtotal += price * it.quantity;
      itemsHtml += `
        <div class="summary-row">
          <span>${escapeHTML(it.name)} &times; ${it.quantity}</span>
          <span>${formatPrice(price * it.quantity)}</span>
        </div>
      `;
    }

    const itemsContainer = document.getElementById('checkout-items');
    if (itemsContainer) itemsContainer.innerHTML = itemsHtml;

    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(FLAT_SHIPPING);
    if (totalEl) totalEl.textContent = formatPrice(subtotal + FLAT_SHIPPING);
  } catch (err) {
    console.error('Checkout init error:', err);
    showToast('Failed to initialize checkout');
  }
}

async function handleShippingForm(event) {
  event.preventDefault();
  const user = await getLoggedInUser();
  if (!user) return;

  const name = document.getElementById('ship-name').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const address = document.getElementById('ship-address').value.trim();

  let formIsOk = true;
  setError('ship-name', '');
  setError('ship-phone', '');
  setError('ship-city', '');
  setError('ship-address', '');

  if (name.length < 2) {
    setError('ship-name', 'Please enter your full name.');
    formIsOk = false;
  }
  if (!isValidPhone(phone)) {
    setError('ship-phone', 'Enter a valid phone number.');
    formIsOk = false;
  }
  if (!city) {
    setError('ship-city', 'Please enter your city.');
    formIsOk = false;
  }
  if (address.length < 8) {
    setError('ship-address', 'Please enter your detailed delivery address.');
    formIsOk = false;
  }

  if (!formIsOk) return;

  try {
    // 1. Checkout cart in backend
    const checkoutRes = await api.cart.checkout();
    const cartId = checkoutRes.cartId;

    // 2. Create shipping entry in backend
    await api.shipping.create({
      orderId: cartId,
      userId: user.id,
      phone,
      city,
      address,
      price: FLAT_SHIPPING,
    });

    // Save temporary details for payment screen
    sessionStorage.setItem('nuqta_active_order_id', String(cartId));
    window.location.href = `payment.html?orderId=${cartId}`;
  } catch (err) {
    showToast(err.message || 'Failed to proceed to payment');
  }
}

/* ================= Part 3: payment.html ================= */

let activeOrderId = null;
let activeOrderTotal = 0;

async function startPaymentPage() {
  await showHeader();
  const user = await getLoggedInUser();

  activeOrderId = Number(getUrlParam('orderId') || sessionStorage.getItem('nuqta_active_order_id'));

  if (!user || !activeOrderId) {
    document.getElementById('payment-area').hidden = true;
    document.getElementById('no-order').hidden = false;
    return;
  }

  try {
    const orderRes = await api.orders.getById(activeOrderId);
    const order = orderRes.order || orderRes;

    document.getElementById('payment-area').hidden = false;
    document.getElementById('no-order').hidden = true;

    const orderNumEl = document.getElementById('payment-order-number');
    if (orderNumEl) orderNumEl.textContent = `Order #${order.id}`;

    const itemsContainer = document.getElementById('payment-items');
    if (itemsContainer) {
      itemsContainer.innerHTML = (order.productsIds || [])
        .map((id) => `<div class="summary-row"><span>Product #${id}</span><span>—</span></div>`)
        .join('');
    }

    const subtotal = Number(order.totalPrice) || 0;
    activeOrderTotal = subtotal + FLAT_SHIPPING;

    const subtotalEl = document.getElementById('payment-subtotal');
    const shippingEl = document.getElementById('payment-shipping');
    const totalEl = document.getElementById('payment-total');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(FLAT_SHIPPING);
    if (totalEl) totalEl.textContent = formatPrice(activeOrderTotal);

    showPaymentMethod();
  } catch (err) {
    console.error('Payment start error:', err);
    document.getElementById('payment-area').hidden = true;
    document.getElementById('no-order').hidden = false;
  }
}

function getPaymentMethod() {
  const checked = document.querySelector('input[name="method"]:checked');
  return checked ? checked.value : 'card';
}

function showPaymentMethod() {
  const method = getPaymentMethod();
  const cardNote = document.querySelector('.card-note');
  const bankNote = document.querySelector('.bank-note');
  const codNote = document.querySelector('.cod-note');
  const payBtn = document.getElementById('pay-success');

  if (cardNote) cardNote.style.display = method === 'card' ? 'block' : 'none';
  if (bankNote) bankNote.style.display = method === 'bank_transfer' ? 'block' : 'none';
  if (codNote) codNote.style.display = method === 'cash_on_delivery' ? 'block' : 'none';

  if (payBtn) {
    const payLabel = payBtn.querySelector('.pay-label-pay');
    const cashLabel = payBtn.querySelector('.pay-label-cash');
    if (method === 'cash_on_delivery') {
      if (payLabel) payLabel.style.display = 'none';
      if (cashLabel) cashLabel.style.display = 'inline';
    } else {
      if (payLabel) payLabel.style.display = 'inline';
      if (cashLabel) cashLabel.style.display = 'none';
    }
  }
}

async function handlePaymentForm(event) {
  event.preventDefault();
  const user = await getLoggedInUser();
  if (!user || !activeOrderId) return;

  const methodVal = getPaymentMethod();
  let backendMethod = 'cash';
  if (methodVal === 'card') backendMethod = 'card';
  if (methodVal === 'bank_transfer') backendMethod = 'bank';

  try {
    // Locate shipping record for this order
    const shipListRes = await api.shipping.getAll().catch(() => ({ shippings: [] }));
    const allShips = shipListRes.shippings || shipListRes || [];
    const myShip = allShips.find((s) => s.orderId === activeOrderId || s.cartId === activeOrderId) || { id: activeOrderId };

    await api.payment.create({
      userId: user.id,
      orderId: activeOrderId,
      shippingId: myShip.id,
      amount: activeOrderTotal,
      method: backendMethod,
      cardNumber: backendMethod === 'card' ? '4111111111111111' : undefined,
      bankAccountNumber: backendMethod === 'bank' ? 'NUQTA-BANK-2026' : undefined,
    });

    // Refresh cart badge
    await updateCartCount();

    // Show success view
    document.getElementById('payment-area').hidden = true;
    const successBox = document.getElementById('payment-success');
    successBox.hidden = false;
    document.getElementById('success-order').textContent = `Order #${activeOrderId} · Status: Paid`;
    document.getElementById('track-link').href = `track.html?order=${activeOrderId}`;
  } catch (err) {
    showToast(err.message || 'Payment processing failed');
  }
}

/* ================= Part 4: track.html ================= */

async function startTrackPage() {
  await showHeader();
  const user = await getLoggedInUser();

  if (!user) {
    document.getElementById('track-login-needed').hidden = false;
    document.getElementById('track-content').hidden = true;
    return;
  }

  const orderId = Number(getUrlParam('order'));
  const box = document.getElementById('track-box');

  if (!orderId) {
    box.innerHTML = '<p class="empty-state">No order specified. View your orders in <a href="account.html">My account</a>.</p>';
    return;
  }

  try {
    const [orderRes, shippingListRes] = await Promise.all([
      api.orders.getById(orderId),
      api.shipping.getAll().catch(() => ({ shippings: [] })),
    ]);

    const order = orderRes.order || orderRes;
    const ships = shippingListRes.shippings || shippingListRes || [];
    const shipping = ships.find((s) => s.orderId === orderId || s.cartId === orderId);

    renderTrackTimeline(order, shipping);
  } catch (err) {
    console.error('Tracking fetch error:', err);
    box.innerHTML = '<p class="empty-state">Order not found or unauthorized.</p>';
  }
}

function renderTrackTimeline(order, shipping) {
  const box = document.getElementById('track-box');
  if (!box) return;

  const isCompleted = order.status === 'completed';
  const isCheckedOut = order.status === 'checked_out' || isCompleted;

  box.innerHTML = `
    <p class="track-status">Order #${order.id} &middot; Status: <strong>${escapeHTML(order.status)}</strong></p>
    <ol class="timeline">
      <li class="done"><span class="dot">✓</span><strong>Order placed</strong><small>${new Date().toISOString().slice(0, 10)}</small></li>
      <li class="${isCheckedOut ? 'done' : ''}"><span class="dot">${isCheckedOut ? '✓' : '2'}</span><strong>Confirmed &amp; Paid</strong></li>
      <li class="${isCompleted ? 'done' : ''}"><span class="dot">${isCompleted ? '✓' : '3'}</span><strong>Shipped</strong></li>
      <li class="${isCompleted ? 'done' : ''}"><span class="dot">${isCompleted ? '✓' : '4'}</span><strong>Delivered</strong></li>
    </ol>

    <div class="two-columns" style="margin-top:50px">
      <div class="panel">
        <h2>Delivery Destination</h2>
        <p class="track-text">
          <strong>Recipient:</strong> ${escapeHTML(shipping ? shipping.address : 'Registered Address')}<br>
          <strong>City:</strong> ${escapeHTML(shipping ? shipping.city : 'Khartoum')}<br>
          <strong>Phone:</strong> ${escapeHTML(shipping ? shipping.phone : '—')}<br>
          <strong>Delivery Fee:</strong> ${formatPrice(shipping ? shipping.price : FLAT_SHIPPING)}
        </p>
        ${
          !isCompleted
            ? `<button type="button" class="btn btn-primary" style="margin-top:20px" onclick="handleCustomerMarkReceived(${order.id})">Mark as Received &amp; Completed</button>`
            : '<p style="color:#16a34a; font-size:24px; margin-top:20px;">✓ Package delivered and verified.</p>'
        }
      </div>

      <div class="panel summary" style="margin-top:0">
        <h2>Order Overview</h2>
        <div class="summary-row"><span>Products Included</span><span>${(order.productsIds || []).length} items</span></div>
        <div class="summary-row"><span>Shipping</span><span>${formatPrice(FLAT_SHIPPING)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice((Number(order.totalPrice) || 0) + FLAT_SHIPPING)}</span></div>
      </div>
    </div>
  `;
}

async function handleCustomerMarkReceived(orderId) {
  try {
    await api.orders.markReceived(orderId);
    showToast('Order confirmed as received! Thank you.');
    await startTrackPage();
  } catch (err) {
    showToast(err.message || 'Action failed');
  }
}
