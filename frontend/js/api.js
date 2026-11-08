// api.js
// Centralized API client for Nuqta e-commerce backend
// Covers all 11 backend services and their endpoints with cookie credentials

const API_BASE = (function () {
  if (typeof window !== 'undefined' && window.__API_BASE__) {
    return window.__API_BASE__;
  }
  // If served through a proxy (e.g. Vite or reverse proxy)
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/api')) {
    return '/api/v1';
  }
  return 'http://localhost:3000/api/v1';
})();

const MEDIA_BASE = (function () {
  if (typeof window !== 'undefined' && window.__MEDIA_BASE__) {
    return window.__MEDIA_BASE__;
  }
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/api')) {
    return '/api/v1/media';
  }
  return 'http://localhost:3000/api/v1/media';
})();

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const config = {
    method: options.method || 'GET',
    credentials: 'include', // essential for httpOnly cookie auth
    headers: {
      ...(options.headers || {}),
    },
  };

  if (options.body) {
    if (options.body instanceof FormData) {
      config.body = options.body;
      // Do NOT set Content-Type header so browser sets multipart boundary
    } else {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(options.body);
    }
  }

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const errMsg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
      const err = new Error(errMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    console.error(`API Error [${config.method} ${endpoint}]:`, err);
    throw err;
  }
}

const api = {
  baseUrl: API_BASE,
  mediaUrl: (name) => {
    if (!name) return 'images/placeholder.svg';
    if (name.startsWith('http') || name.startsWith('images/')) return name;
    const clean = name.replace(/^\/media\//, '').replace(/^\/api\/v1\/media\//, '');
    return `${MEDIA_BASE}/${clean}`;
  },

  // ================= 1. Auth =================
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
    register: (data) => request('/auth/register', { method: 'POST', body: data }),
    refresh: () => request('/auth/refresh', { method: 'GET' }),
    me: () => request('/auth/me', { method: 'GET' }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    changePassword: (oldPassword, newPassword) =>
      request('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } }),
    resetPassword: (email, oldPassword, newPassword) =>
      request('/auth/reset-password', { method: 'POST', body: { email, oldPassword, newPassword } }),
  },

  // ================= 2. Categories =================
  categories: {
    getAll: () => request('/categories'),
    getById: (id) => request(`/categories/${id}`),
    create: (name) => request('/categories', { method: 'POST', body: { name } }),
    update: (id, name) => request(`/categories/${id}`, { method: 'PATCH', body: { name } }),
    delete: (idOrName) => request(`/categories/${encodeURIComponent(idOrName)}`, { method: 'DELETE' }),
  },

  // ================= 3. Products =================
  products: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.categoryId !== undefined && filters.categoryId !== '') {
        params.set('categoryId', filters.categoryId);
      }
      if (filters.name) {
        params.set('name', filters.name);
      }
      const qs = params.toString();
      return request(`/products${qs ? '?' + qs : ''}`);
    },
    getById: (id) => request(`/products/${id}`),
    create: (formDataOrJson) => request('/products', { method: 'POST', body: formDataOrJson }),
    update: (id, formDataOrJson) => request(`/products/${id}`, { method: 'PATCH', body: formDataOrJson }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },

  // ================= 4. Cart =================
  cart: {
    get: () => request('/cart'),
    addItem: (productId, quantity = 1) =>
      request('/cart/items', { method: 'POST', body: { productId: Number(productId), quantity: Number(quantity) } }),
    updateItem: (productId, quantity) =>
      request(`/cart/items/${productId}`, { method: 'PATCH', body: { quantity: Number(quantity) } }),
    removeItem: (productId) => request(`/cart/items/${productId}`, { method: 'DELETE' }),
    clear: () => request('/cart', { method: 'DELETE' }),
    checkout: () => request('/cart/checkout', { method: 'POST' }),
  },

  // ================= 5. Orders =================
  orders: {
    create: (userId, productsIds, status = 'active') =>
      request('/orders', { method: 'POST', body: { userId: Number(userId), productsIds, status } }),
    getAll: () => request('/orders'),
    getById: (id) => request(`/orders/${id}`),
    updateStatus: (id, status) => request(`/orders/${id}`, { method: 'PATCH', body: { status } }),
    markReceived: (id) => request(`/orders/${id}/revicved`, { method: 'POST' }),
    delete: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  },

  // ================= 6. Shipping =================
  shipping: {
    create: (data) =>
      request('/shipping', {
        method: 'POST',
        body: {
          orderId: Number(data.orderId),
          userId: Number(data.userId),
          phone: data.phone,
          city: data.city,
          address: data.address,
          price: Number(data.price),
        },
      }),
    getAll: () => request('/shipping'),
    getById: (id) => request(`/shipping/${id}`),
    getStatus: (id) => request(`/shipping/${id}/status`),
    update: (id, data) => request(`/shipping/${id}`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/shipping/${id}`, { method: 'DELETE' }),
  },

  // ================= 7. Payment =================
  payment: {
    create: (data) =>
      request('/payment', {
        method: 'POST',
        body: {
          userId: Number(data.userId),
          orderId: Number(data.orderId),
          shippingId: Number(data.shippingId),
          amount: Number(data.amount),
          method: data.method,
          bankAccountNumber: data.bankAccountNumber || undefined,
          cardNumber: data.cardNumber || undefined,
          cvv: data.cvv || undefined,
          expiry: data.expiry || undefined,
        },
      }),
    getAll: () => request('/payment'),
    getById: (id) => request(`/payment/${id}`),
  },

  // ================= 8. Laptop Parts (Pricing) =================
  parts: {
    create: (name, type, price) =>
      request('/parts', { method: 'POST', body: { name, type, price: Number(price) } }),
    getAll: () => request('/parts'),
    getById: (id) => request(`/parts/${id}`),
    update: (id, data) => request(`/parts/${id}`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/parts/${id}`, { method: 'DELETE' }),
  },

  // ================= 9. Sold Laptops (Trade-In / Resell) =================
  soldLaptops: {
    create: (formDataOrJson) => request('/sold-laptops', { method: 'POST', body: formDataOrJson }),
    getAll: () => request('/sold-laptops'),
    getById: (id) => request(`/sold-laptops/${id}`),
    update: (id, formDataOrJson) => request(`/sold-laptops/${id}`, { method: 'PATCH', body: formDataOrJson }),
    updateStatus: (id, status) => request(`/sold-laptops/${id}/status`, { method: 'PATCH', body: { status } }),
    delete: (id) => request(`/sold-laptops/${id}`, { method: 'DELETE' }),
  },

  // ================= 10. Reviews =================
  reviews: {
    create: (productId, review, rating = null) =>
      request('/reviews', {
        method: 'POST',
        body: {
          productId: Number(productId),
          review,
          rating: rating ? Number(rating) : undefined,
        },
      }),
    getAll: () => request('/reviews'),
    getByProduct: (productId) => request(`/reviews/product/${productId}`),
    getById: (id) => request(`/reviews/${id}`),
    update: (id, review, rating) =>
      request(`/reviews/${id}`, {
        method: 'PATCH',
        body: {
          review,
          rating: rating ? Number(rating) : undefined,
        },
      }),
    delete: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
  },

  // ================= 11. Users =================
  users: {
    getAll: () => request('/users'),
    getById: (id) => request(`/users/${id}`),
    update: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data }),
    updateRole: (id, role) => request(`/users/role/${id}`, { method: 'PATCH', body: { role } }),
    delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  },
};

// Expose globally
if (typeof window !== 'undefined') {
  window.api = api;
}
