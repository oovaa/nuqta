import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync, existsSync } from 'node:fs';

function copyAssetsPlugin() {
  return {
    name: 'copy-vanilla-assets',
    closeBundle() {
      const dirs = ['js', 'images', 'products'];
      for (const dir of dirs) {
        const src = resolve(__dirname, dir);
        const dest = resolve(__dirname, 'dist', dir);
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true, force: true });
        }
      }
    },
  };
}

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [copyAssetsPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        shop: resolve(__dirname, 'shop.html'),
        product: resolve(__dirname, 'product.html'),
        cart: resolve(__dirname, 'cart.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        payment: resolve(__dirname, 'payment.html'),
        track: resolve(__dirname, 'track.html'),
        account: resolve(__dirname, 'account.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        about: resolve(__dirname, 'about.html'),
        policies: resolve(__dirname, 'policies.html'),
        tradeIn: resolve(__dirname, 'trade-in.html'),
        adminMain: resolve(__dirname, 'admin/index.html'),
        adminProducts: resolve(__dirname, 'admin/products.html'),
        adminCategories: resolve(__dirname, 'admin/categories.html'),
        adminOrders: resolve(__dirname, 'admin/orders.html'),
        adminShipping: resolve(__dirname, 'admin/shipping.html'),
        adminPayments: resolve(__dirname, 'admin/payments.html'),
        adminUsers: resolve(__dirname, 'admin/users.html'),
        adminParts: resolve(__dirname, 'admin/parts.html'),
        adminTradeIns: resolve(__dirname, 'admin/trade-ins.html'),
        adminReviews: resolve(__dirname, 'admin/reviews.html'),
      },
    },
  },
});
