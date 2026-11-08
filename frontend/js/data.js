// data.js
// The data that the JavaScript needs: the products in the cart, and the users.
//
// The products themselves (photos, descriptions, filters) are written in the HTML pages:
//   shop.html              - all the product cards
//   products/....html      - one page for each product
// This short list is only used by the cart, the orders and the stock.
// If you change a price here, change it in the HTML pages too.
//
//   options - the pills (storage, size...). "extra" is added to the price.
//   stock   - how many there are at the start. Sold items are saved in
//             localStorage ("nuqta_stock"), see getStock() in common.js.
//   page    - the product page, used for the links in the cart.

// Every order pays this flat delivery fee (from the Figma cart: 49.00 USD).
const SHIPPING_FEE = 49;

const PRODUCTS = [
  { id: 1, name: "iPhone 18 Pro Max", category: "Phones", price: 1299, stock: 146,
    image: "images/iphone-18-pro-max.jpg", page: "products/iphone-18-pro-max.html",
    options: [{ label: "256GB", extra: 0 }, { label: "512GB", extra: 200 }, { label: "1TB", extra: 400 }] },
  { id: 2, name: "Galaxy S26 Ultra", fullName: "Samsung Galaxy S26 Ultra", category: "Phones", price: 1399, stock: 56,
    image: "images/galaxy-s26-ultra.jpg", page: "products/galaxy-s26-ultra.html",
    options: [{ label: "256GB", extra: 0 }, { label: "512GB", extra: 180 }, { label: "1TB", extra: 360 }] },
  { id: 3, name: "Find X10 Pro Max", fullName: "Oppo Find X10 Pro Max", category: "Phones", price: 1015, stock: 40,
    image: "images/find-x10-pro-max.jpg", page: "products/find-x10-pro-max.html",
    options: [{ label: "256GB", extra: 0 }, { label: "512GB", extra: 150 }, { label: "1TB", extra: 300 }] },
  { id: 4, name: "Pixel 11 Pro Fold", fullName: "Google Pixel 11 Pro Fold", category: "Phones", price: 1900, stock: 22,
    image: "images/pixel-11-pro-fold.jpg", page: "products/pixel-11-pro-fold.html",
    options: [{ label: "256GB", extra: 0 }, { label: "512GB", extra: 150 }, { label: "1TB", extra: 300 }] },
  { id: 5, name: "Nothing Phone 3", category: "Phones", price: 799, stock: 75,
    image: "images/nothing-phone-3.jpg", page: "products/nothing-phone-3.html",
    options: [{ label: "256GB", extra: 0 }, { label: "512GB", extra: 100 }, { label: "1TB", extra: 220 }] },
  { id: 6, name: "OnePlus 15", category: "Phones", price: 899, stock: 64,
    image: "images/oneplus-15.jpg", page: "products/oneplus-15.html",
    options: [{ label: "256GB", extra: 0 }, { label: "512GB", extra: 100 }, { label: "1TB", extra: 220 }] },
  { id: 7, name: "Magic V6 5G Foldable", fullName: "Honor Magic V6 5G Foldable", category: "Phones", price: 1833, stock: 18,
    image: "images/magic-v6.jpg", page: "products/magic-v6-5g-foldable.html",
    options: [{ label: "256GB", extra: 0 }, { label: "512GB", extra: 150 }, { label: "1TB", extra: 300 }] },
  { id: 8, name: "Legion Y9000P", fullName: "Lenovo Legion Y9000P", category: "Laptops", price: 5575, stock: 12,
    image: "images/legion-y9000p.jpg", page: "products/legion-y9000p.html",
    options: [{ label: "1TB", extra: 0 }, { label: "2TB", extra: 250 }] },
  { id: 9, name: "ROG Strix G16 (2025)", fullName: "ASUS ROG Strix G16 (2025)", category: "Laptops", price: 1800, stock: 25,
    image: "images/rog-strix-g16.jpg", page: "products/rog-strix-g16-2025.html",
    options: [{ label: "1TB", extra: 0 }, { label: "2TB", extra: 200 }] },
  { id: 10, name: "Soundcore P31i ANC Earbuds", category: "Airbuds", price: 50, stock: 300,
    image: "images/soundcore-p31i.jpg", page: "products/soundcore-p31i-anc-earbuds.html",
    options: [{ label: "Black", extra: 0 }, { label: "White", extra: 0 }] },
  { id: 11, name: "Apple Watch Series 11", category: "Watches", price: 399, stock: 80,
    image: "images/smart-watch.svg", page: "products/apple-watch-series-11.html",
    options: [{ label: "42mm", extra: 0 }, { label: "46mm", extra: 30 }] },
  { id: 12, name: "Archer AX55 Wi-Fi 6 Router", category: "Routers", price: 99, stock: 0,
    image: "images/wifi-router.svg", page: "products/archer-ax55-wi-fi-6-router.html",
    options: [{ label: "1 pack", extra: 0 }, { label: "2 pack", extra: 90 }] },
  { id: 13, name: "UltraSharp 27 4K Monitor", category: "Monitors", price: 579, stock: 33,
    image: "images/monitor-4k.svg", page: "products/ultrasharp-27-4k-monitor.html",
    options: [{ label: "27\"", extra: 0 }, { label: "32\"", extra: 220 }] },
  { id: 14, name: "Meta Quest 3", category: "VR glasses", price: 499, stock: 45,
    image: "images/vr-headset.svg", page: "products/meta-quest-3.html",
    options: [{ label: "128GB", extra: 0 }, { label: "512GB", extra: 150 }] }
];

// The starting users. Passwords are NOT kept here: see DEMO_PASSWORDS below.
const DEFAULT_USERS = [
  {
    id: 1,
    name: "Demo Admin",
    email: "admin@nuqta.demo",
    phone: "+249 900 000 001",
    city: "Khartoum",
    address: "NUQTA office, Street 1, Riyadh",
    role: "admin",
    joined: "2026-01-01"
  },
  {
    id: 2,
    name: "Demo Customer",
    email: "customer@nuqta.demo",
    phone: "+249 912 345 678",
    city: "Khartoum",
    address: "Street 15, Building 4, Riyadh",
    role: "customer",
    joined: "2026-01-12"
  }
];

// Passwords of the two demo users (user id: password).
// They are written here on purpose so the teacher can try the site.
// This is NOT how real passwords are kept: a real store saves hashed passwords on a server.
// Users who sign up on the site have no saved password at all (see account.js).
const DEMO_PASSWORDS = {
  1: "admin1234",
  2: "demo1234"
};
