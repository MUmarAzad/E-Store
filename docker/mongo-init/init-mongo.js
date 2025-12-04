// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

// Create databases and initial collections
const databases = [
  'estore_users',
  'estore_products', 
  'estore_carts',
  'estore_orders'
];

databases.forEach(dbName => {
  db = db.getSiblingDB(dbName);
  
  // Create a placeholder collection to initialize the database
  db.createCollection('_init');
  db._init.drop();
  
  print(`Created database: ${dbName}`);
});

// Switch to users database and create indexes
db = db.getSiblingDB('estore_users');

// Users collection indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: -1 });

print('Created indexes for users collection');

// Switch to products database
db = db.getSiblingDB('estore_products');

// Products collection indexes
db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ category: 1 });
db.products.createIndex({ 'pricing.price': 1 });
db.products.createIndex({ 'inventory.quantity': 1 });
db.products.createIndex({ isActive: 1, isPublished: 1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ 'ratings.average': -1 });

// Categories collection indexes
db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ parent: 1 });
db.categories.createIndex({ isActive: 1 });

print('Created indexes for products collection');

// Switch to carts database
db = db.getSiblingDB('estore_carts');

// Carts collection indexes
db.carts.createIndex({ user: 1 }, { unique: true, sparse: true });
db.carts.createIndex({ sessionId: 1 }, { sparse: true });
db.carts.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 604800 }); // TTL: 7 days for guest carts
db.carts.createIndex({ status: 1 });

print('Created indexes for carts collection');

// Switch to orders database
db = db.getSiblingDB('estore_orders');

// Orders collection indexes
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ user: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ 'payment.status': 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ 'items.product': 1 });

print('Created indexes for orders collection');

print('MongoDB initialization completed successfully!');
