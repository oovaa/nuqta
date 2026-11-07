import { pgTable, serial, text, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { defineRelationsPart } from 'drizzle-orm';

// --- Enums ---
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const cartStatusEnum = pgEnum('cart_status', ['active', 'checked_out', 'abandoned']);
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected', 'completed']);
export const romTypeEnum = pgEnum('rom_type', ['ssd', 'hdd']);
export const partTypeEnum = pgEnum('part_type', ['model', 'ram', 'ssd', 'hdd']);

// --- 1. Users Table ---
// Note: phone, city, and address are nullable for optional shipping auto-fill
export const users = pgTable('user', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  phone: text('phone'),
  city: text('city'),
  address: text('address'),
  role: userRoleEnum('role').default('user').notNull(),
});

// --- 2. Categories Table ---
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

// --- 3. Products Table ---
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  year: integer('year'),
  color: text('color'),
  ram: text('ram'),
  rom: text('rom'),
  company: text('company'),
  imageUrl: text('image_url'),
  thumbnailImageUrl: text('thumbnail_image_url'),
  rating: numeric('rating', { precision: 2, scale: 1 }).default('0.0'), // 0-5
  ratingCount: integer('rating_count').default(0).notNull(),
});

// --- 4. Sold Laptops Table (User Trade-In / Resell) ---
export const soldLaptops = pgTable('sold_laptops', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  ram: text('ram').notNull(),
  rom: text('rom').notNull(),
  romType: romTypeEnum('rom_type').notNull(),
  size: text('size').notNull(),
  cpu: text('cpu').notNull(),
  gpu: text('gpu'),
  batteryHealth: integer('battery_health'),
  chargeCycles: integer('charge_cycles'),
  conditionRating: integer('condition_rating'),
  images: text('images').array().notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: statusEnum('status').default('pending').notNull(),
});

// --- 5. Laptop Parts Table (Pricing Reference) ---
export const laptopParts = pgTable('laptop_parts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g., "apple", "16", "256", "500"
  type: partTypeEnum('type').notNull(), // e.g., "model", "ram", "ssd", "hdd"
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
});

// --- 6. Cart Table ---
export const carts = pgTable('cart', {
  id: serial('id').primaryKey(),
  productsIds: integer('products_ids').array().notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: cartStatusEnum('status').default('active').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

// --- 7. Shipping Table ---
export const shippings = pgTable('shipping', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: statusEnum('status').default('pending').notNull(),
  phone: text('phone').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
});

// --- 8. Payment Table ---
export const payments = pgTable('payment', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  cartId: integer('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  shippingId: integer('shipping_id')
    .notNull()
    .references(() => shippings.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: statusEnum('status').default('pending').notNull(),
});

// --- 9. Payment Method Sub-Tables ---
export const cashPayments = pgTable('cash_payment', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  name: text('name').default('cash').notNull(),
});

export const bankPayments = pgTable('bank_payment', {
  id: serial('id').primaryKey(),
  name: text('name').default('bank').notNull(),
  paymentId: integer('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  bankAccountNumber: text('bank_account_number').notNull(),
});

export const cardPayments = pgTable('card_payment', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  name: text('name').default('card').notNull(),
  cardNumber: text('card_number').notNull(),
  cvv: text('cvv').notNull(),
  expiry: text('expiry').notNull(),
});

// --- Relations ---
const tables = {
  users,
  categories,
  products,
  soldLaptops,
  laptopParts,
  carts,
  shippings,
  payments,
  cashPayments,
  bankPayments,
  cardPayments,
};

export const usersRelations = defineRelationsPart(tables, (r) => ({
  users: {
    soldLaptops: r.many.soldLaptops({
      from: r.users.id,
      to: r.soldLaptops.userId,
    }),
    carts: r.many.carts({
      from: r.users.id,
      to: r.carts.userId,
    }),
    shippings: r.many.shippings({
      from: r.users.id,
      to: r.shippings.userId,
    }),
    payments: r.many.payments({
      from: r.users.id,
      to: r.payments.userId,
    }),
  },
}));

export const categoriesRelations = defineRelationsPart(tables, (r) => ({
  categories: {
    products: r.many.products({
      from: r.categories.id,
      to: r.products.categoryId,
    }),
  },
}));

export const productsRelations = defineRelationsPart(tables, (r) => ({
  products: {
    category: r.one.categories({
      from: r.products.categoryId,
      to: r.categories.id,
    }),
  },
}));

export const soldLaptopsRelations = defineRelationsPart(tables, (r) => ({
  soldLaptops: {
    user: r.one.users({
      from: r.soldLaptops.userId,
      to: r.users.id,
    }),
  },
}));

export const cartsRelations = defineRelationsPart(tables, (r) => ({
  carts: {
    user: r.one.users({
      from: r.carts.userId,
      to: r.users.id,
    }),
    shippings: r.many.shippings({
      from: r.carts.id,
      to: r.shippings.cartId,
    }),
    payments: r.many.payments({
      from: r.carts.id,
      to: r.payments.cartId,
    }),
  },
}));

export const shippingsRelations = defineRelationsPart(tables, (r) => ({
  shippings: {
    cart: r.one.carts({
      from: r.shippings.cartId,
      to: r.carts.id,
    }),

    user: r.one.users({
      from: r.shippings.userId,
      to: r.users.id,
    }),
    payments: r.many.payments({
      from: r.shippings.id,
      to: r.payments.shippingId,
    }),
  },
}));

export const paymentsRelations = defineRelationsPart(tables, (r) => ({
  payments: {
    user: r.one.users({
      from: r.payments.userId,
      to: r.users.id,
    }),
    cart: r.one.carts({
      from: r.payments.cartId,
      to: r.carts.id,
    }),
    shipping: r.one.shippings({
      from: r.payments.shippingId,
      to: r.shippings.id,
    }),
    cashPayment: r.one.cashPayments({
      from: r.payments.id,
      to: r.cashPayments.paymentId,
    }),
    bankPayment: r.one.bankPayments({
      from: r.payments.id,
      to: r.bankPayments.paymentId,
    }),
    cardPayment: r.one.cardPayments({
      from: r.payments.id,
      to: r.cardPayments.paymentId,
    }),
  },
}));
