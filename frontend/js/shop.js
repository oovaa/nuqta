// shop.js
// Storefront catalog, filtering, dynamic product details and product reviews

let allProducts = [];
let allCategories = [];
let shownCount = 6;
let selectedCategory = '';

async function startShopPage() {
  await showHeader();

  const categoryParam = getUrlParam('category');
  if (categoryParam) {
    selectedCategory = categoryParam;
  }

  try {
    const [catRes, prodRes] = await Promise.all([
      api.categories.getAll().catch(() => ({ categories: [] })),
      api.products.getAll().catch(() => ({ products: [] })),
    ]);

    allCategories = catRes.categories || catRes || [];
    allProducts = prodRes.products || prodRes || [];

    renderCategoryChips();
    showProducts();
  } catch (err) {
    console.error('Error loading shop catalog:', err);
    showToast('Failed to load products');
  }
}

function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  let html = `<a class="chip ${selectedCategory === '' ? 'active' : ''}" href="#" onclick="chooseCategoryChip('', event)">All</a>`;
  for (const cat of allCategories) {
    const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
    html += `<a class="chip ${isActive ? 'active' : ''}" href="#" onclick="chooseCategoryChip('${escapeHTML(cat.name)}', event)">${escapeHTML(cat.name)}</a>`;
  }
  container.innerHTML = html;
}

function chooseCategoryChip(catName, event) {
  if (event) event.preventDefault();
  selectedCategory = selectedCategory.toLowerCase() === catName.toLowerCase() ? '' : catName;
  shownCount = 6;
  renderCategoryChips();
  showProducts();
}

function getCheckedValues(name) {
  const boxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(boxes).map((b) => b.value);
}

function productMatches(p) {
  const searchInput = document.getElementById('search-input');
  const searchText = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const price = Number(p.price) || 0;

  const minPriceEl = document.getElementById('min-price');
  const maxPriceEl = document.getElementById('max-price');
  const minPrice = minPriceEl ? minPriceEl.value : '';
  const maxPrice = maxPriceEl ? maxPriceEl.value : '';

  if (searchText && !p.name.toLowerCase().includes(searchText)) return false;

  if (selectedCategory !== '') {
    const cat = allCategories.find((c) => c.name.toLowerCase() === selectedCategory.toLowerCase());
    if (cat && p.categoryId !== cat.id) {
      if (p.company?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }
  }

  if (minPrice !== '' && price < Number(minPrice)) return false;
  if (maxPrice !== '' && price > Number(maxPrice)) return false;

  const brandChecked = getCheckedValues('brand');
  if (brandChecked.length > 0) {
    const pBrand = p.company || '';
    if (!brandChecked.some((b) => pBrand.toLowerCase().includes(b.toLowerCase()) || p.name.toLowerCase().includes(b.toLowerCase()))) {
      return false;
    }
  }

  const ramChecked = getCheckedValues('ram');
  if (ramChecked.length > 0 && p.ram) {
    if (!ramChecked.some((r) => p.ram.toLowerCase().includes(r.toLowerCase()))) return false;
  }

  const romChecked = getCheckedValues('rom');
  if (romChecked.length > 0 && p.rom) {
    if (!romChecked.some((r) => p.rom.toLowerCase().includes(r.toLowerCase()))) return false;
  }

  return true;
}

function showProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const sortInput = document.querySelector('input[name="sort"]:checked');
  const sort = sortInput ? sortInput.value : 'newest';

  const filtered = allProducts.filter(productMatches);

  filtered.sort((a, b) => {
    const pA = Number(a.price) || 0;
    const pB = Number(b.price) || 0;
    if (sort === 'price-low') return pA - pB;
    if (sort === 'price-high') return pB - pA;
    if (sort === 'popular') return (b.ratingCount || 0) - (a.ratingCount || 0);
    return (b.id || 0) - (a.id || 0); // newest first
  });

  const toShow = filtered.slice(0, shownCount);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty-state" id="no-results">No products match your search.</p>';
  } else {
    grid.innerHTML = toShow
      .map((p) => {
        const img = api.mediaUrl(p.imageUrl || p.thumbnailImageUrl);
        const rating = Number(p.avgRating) || 5;
        const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
        const badge = p.company || (p.year ? String(p.year) : 'NUQTA');

        return `
          <article class="product-card" data-id="${p.id}">
            <a class="card-cover" href="product.html?id=${p.id}"><img src="${escapeHTML(img)}" alt="${escapeHTML(p.name)}"></a>
            <span class="badge">${escapeHTML(badge)}</span>
            <h3 class="card-title"><a href="product.html?id=${p.id}">${escapeHTML(p.name)}</a></h3>
            <div class="form-contents">
              <p class="stars" aria-label="Rated ${rating} out of 5"><span>${stars}</span></p>
              <p class="price">${formatPrice(p.price)}</p>
              <button type="button" class="btn btn-primary" onclick="handleAddCardToCart(${p.id})">Add to cart</button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  const resultCount = document.getElementById('result-count');
  if (resultCount) {
    resultCount.textContent = `Showing ${toShow.length} of ${filtered.length} products`;
  }

  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.hidden = toShow.length >= filtered.length;
  }
}

async function handleAddCardToCart(productId) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      showToast('Please log in to add items to your cart');
      setTimeout(() => {
        window.location.href = `login.html?next=shop.html`;
      }, 1000);
      return;
    }

    await api.cart.addItem(productId, 1);
    await updateCartCount();
    showToast('Added to cart!');
  } catch (err) {
    showToast(err.message || 'Could not add to cart');
  }
}

function filtersChanged() {
  shownCount = 6;
  showProducts();
}

function loadMore() {
  shownCount += 6;
  showProducts();
}

function clearFilters() {
  const form = document.getElementById('filters');
  if (form) form.reset();
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  selectedCategory = '';
  renderCategoryChips();
  filtersChanged();
}

/* ================= Dynamic Product Page ================= */

let currentProduct = null;

async function startProductPage(productId) {
  await showHeader();

  const id = productId || getUrlParam('id') || 1;

  try {
    const p = await api.products.getById(id);
    currentProduct = p;

    // Update title
    document.title = `${p.name} | NUQTA Store`;

    // Render image
    const imgEl = document.querySelector('.details-image img');
    if (imgEl) {
      imgEl.src = api.mediaUrl(p.imageUrl || p.thumbnailImageUrl);
      imgEl.alt = p.name;
    }

    // Render title and description
    const titleEl = document.querySelector('.details-info h1');
    if (titleEl) titleEl.textContent = p.name;

    const descEl = document.querySelector('.details-info .description');
    if (descEl) descEl.textContent = p.description || 'Premium device with modern performance and design.';

    const priceEl = document.getElementById('detail-price');
    if (priceEl) priceEl.textContent = formatPrice(p.price);

    // Rating
    const ratingLine = document.querySelector('.rating-line');
    if (ratingLine) {
      const avg = Number(p.avgRating) || 5;
      ratingLine.innerHTML = `${avg.toFixed(1)} <span class="small-stars">★★★★★</span> <span class="reviews">(${p.ratingCount || 0} reviews)</span>`;
    }

    // Spec list
    const specList = document.querySelector('.spec-list');
    if (specList) {
      specList.innerHTML = `
        <li><strong>Brand:</strong> ${escapeHTML(p.company || 'Standard')}</li>
        <li><strong>RAM:</strong> ${escapeHTML(p.ram || 'Standard')}</li>
        <li><strong>Storage:</strong> ${escapeHTML(p.rom || 'Standard')}</li>
        <li><strong>Color:</strong> ${escapeHTML(p.color || 'Default')}</li>
        <li><strong>Release Year:</strong> ${escapeHTML(p.year || '2026')}</li>
        <li><strong>Delivery:</strong> 3–5 working days · flat shipping 49 USD</li>
      `;
    }

    // Load dynamic customer reviews
    await loadProductReviews(id);

    // Load similar products
    await loadSimilarProducts(p.categoryId, p.id);
  } catch (err) {
    console.error('Failed to load product details:', err);
    showToast('Failed to load product details');
  }
}

async function loadProductReviews(productId) {
  const reviewsContainer = document.getElementById('reviews-list');
  if (!reviewsContainer) return;

  try {
    const res = await api.reviews.getByProduct(productId);
    const reviews = res.reviews || res || [];

    if (!reviews.length) {
      reviewsContainer.innerHTML = '<p class="empty-state">No reviews yet for this product. Be the first to review!</p>';
    } else {
      reviewsContainer.innerHTML = reviews
        .map((r) => {
          const ratingStars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
          return `
            <div class="panel" style="margin-bottom:16px; padding:20px 24px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:var(--star); font-size:24px;">${ratingStars}</span>
                <small style="color:#777;">Customer #${r.userId}</small>
              </div>
              <p style="font-size:20px; font-weight:300;">${escapeHTML(r.review)}</p>
            </div>
          `;
        })
        .join('');
    }
  } catch (e) {
    reviewsContainer.innerHTML = '<p>Could not load reviews.</p>';
  }
}

async function handleReviewSubmit(event, productId) {
  event.preventDefault();
  const user = await getLoggedInUser();
  if (!user) {
    showToast('Please log in to write a review');
    return;
  }

  const reviewInput = document.getElementById('review-text');
  const ratingInput = document.getElementById('review-rating');
  const review = reviewInput.value.trim();
  const rating = Number(ratingInput.value) || 5;

  if (!review) {
    showToast('Please write a review comment');
    return;
  }

  try {
    await api.reviews.create(productId, review, rating);
    showToast('Thank you! Review submitted.');
    reviewInput.value = '';
    await loadProductReviews(productId);
  } catch (err) {
    showToast(err.message || 'Failed to submit review');
  }
}

async function addDetailToCart(productId) {
  const user = await getLoggedInUser();
  if (!user) {
    showToast('Please log in to purchase items');
    setTimeout(() => {
      window.location.href = `login.html?next=product.html?id=${productId}`;
    }, 1000);
    return;
  }

  const qtyInput = document.getElementById('qty-count');
  const qty = qtyInput ? Number(qtyInput.value) || 1 : 1;

  try {
    await api.cart.addItem(productId, qty);
    await updateCartCount();
    showToast('Added to cart!');
  } catch (err) {
    showToast(err.message || 'Could not add to cart');
  }
}

async function loadSimilarProducts(categoryId, currentId) {
  const container = document.querySelector('.similar-grid');
  if (!container) return;

  try {
    const res = await api.products.getAll();
    const products = res.products || res || [];
    const similar = products.filter((p) => p.id !== currentId).slice(0, 4);

    if (similar.length > 0) {
      container.innerHTML = similar
        .map((p) => {
          const img = api.mediaUrl(p.imageUrl || p.thumbnailImageUrl);
          return `
            <article class="product-card">
              <a class="card-cover" href="product.html?id=${p.id}"><img src="${escapeHTML(img)}" alt="${escapeHTML(p.name)}"></a>
              <span class="badge">${escapeHTML(p.company || 'NUQTA')}</span>
              <h3 class="card-title"><a href="product.html?id=${p.id}">${escapeHTML(p.name)}</a></h3>
              <div class="form-contents">
                <p class="price">${formatPrice(p.price)}</p>
                <button type="button" class="btn btn-primary" onclick="handleAddCardToCart(${p.id})">Add to cart</button>
              </div>
            </article>
          `;
        })
        .join('');
    }
  } catch (e) {
    console.error('Similar products error:', e);
  }
}
