/**
 * SampleDataInstaller.js
 * Installs demo data into all collections using the Appwrite SDK.
 */
import { Client, Databases, Query } from "appwrite";

const SAMPLE_PRODUCTS = [
  { id: "prod_1", name: "Espresso", category: "Beverages", price: 2.5, cost: 0.8, stock: 200, minStock: 20, barcode: "1001", unit: "cup", description: "Strong Italian coffee" },
  { id: "prod_2", name: "Cappuccino", category: "Beverages", price: 3.5, cost: 1.2, stock: 150, minStock: 20, barcode: "1002", unit: "cup", description: "Coffee with steamed milk foam" },
  { id: "prod_3", name: "Green Tea", category: "Beverages", price: 2.0, cost: 0.5, stock: 300, minStock: 30, barcode: "1003", unit: "cup", description: "Refreshing green tea" },
  { id: "prod_4", name: "Croissant", category: "Bakery", price: 2.0, cost: 0.7, stock: 80, minStock: 10, barcode: "2001", unit: "piece", description: "Buttery French pastry" },
  { id: "prod_5", name: "Blueberry Muffin", category: "Bakery", price: 2.5, cost: 0.9, stock: 60, minStock: 10, barcode: "2002", unit: "piece", description: "Fresh baked muffin" },
  { id: "prod_6", name: "Caesar Salad", category: "Food", price: 7.5, cost: 2.5, stock: 40, minStock: 5, barcode: "3001", unit: "plate", description: "Classic caesar salad" },
  { id: "prod_7", name: "Club Sandwich", category: "Food", price: 8.0, cost: 3.0, stock: 35, minStock: 5, barcode: "3002", unit: "piece", description: "Triple decker sandwich" },
  { id: "prod_8", name: "Still Water 500ml", category: "Beverages", price: 1.0, cost: 0.2, stock: 500, minStock: 50, barcode: "1004", unit: "bottle", description: "Still mineral water" },
  { id: "prod_9", name: "Orange Juice", category: "Beverages", price: 3.0, cost: 1.0, stock: 120, minStock: 20, barcode: "1005", unit: "glass", description: "Freshly squeezed OJ" },
  { id: "prod_10", name: "Chocolate Cake", category: "Bakery", price: 4.5, cost: 1.8, stock: 25, minStock: 5, barcode: "2003", unit: "slice", description: "Rich chocolate layer cake" },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const today = new Date();
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const SAMPLE_SALES = [
  {
    id: generateId(), date: daysAgo(0), total: 15.5, discount: 0, paymentMethod: "cash",
    items: [
      { productId: "prod_1", name: "Espresso", qty: 2, price: 2.5 },
      { productId: "prod_4", name: "Croissant", qty: 1, price: 2.0 },
      { productId: "prod_8", name: "Still Water 500ml", qty: 1, price: 1.0 },
    ]
  },
  {
    id: generateId(), date: daysAgo(0), total: 22.0, discount: 1.0, paymentMethod: "card",
    items: [
      { productId: "prod_6", name: "Caesar Salad", qty: 1, price: 7.5 },
      { productId: "prod_7", name: "Club Sandwich", qty: 1, price: 8.0 },
      { productId: "prod_2", name: "Cappuccino", qty: 2, price: 3.5 },
    ]
  },
  {
    id: generateId(), date: daysAgo(1), total: 8.5, discount: 0, paymentMethod: "cash",
    items: [
      { productId: "prod_3", name: "Green Tea", qty: 1, price: 2.0 },
      { productId: "prod_10", name: "Chocolate Cake", qty: 1, price: 4.5 },
      { productId: "prod_8", name: "Still Water 500ml", qty: 2, price: 1.0 },
    ]
  },
  {
    id: generateId(), date: daysAgo(2), total: 31.0, discount: 2.0, paymentMethod: "card",
    items: [
      { productId: "prod_6", name: "Caesar Salad", qty: 2, price: 7.5 },
      { productId: "prod_7", name: "Club Sandwich", qty: 2, price: 8.0 },
    ]
  },
  {
    id: generateId(), date: daysAgo(3), total: 12.0, discount: 0, paymentMethod: "cash",
    items: [
      { productId: "prod_1", name: "Espresso", qty: 3, price: 2.5 },
      { productId: "prod_5", name: "Blueberry Muffin", qty: 1, price: 2.5 },
      { productId: "prod_4", name: "Croissant", qty: 1, price: 2.0 },
    ]
  },
];

const SAMPLE_PURCHASES = [
  {
    id: generateId(), date: daysAgo(5), supplier: "Morning Roast Co.", total: 120.0, status: "received",
    items: [
      { productId: "prod_1", name: "Espresso Beans", qty: 50, cost: 0.8, total: 40.0 },
      { productId: "prod_2", name: "Milk (Wholesale)", qty: 100, cost: 0.5, total: 50.0 },
      { productId: "prod_4", name: "Croissants (batch)", qty: 40, cost: 0.75, total: 30.0 },
    ]
  },
  {
    id: generateId(), date: daysAgo(10), supplier: "Fresh Farms Ltd.", total: 95.0, status: "received",
    items: [
      { productId: "prod_3", name: "Green Tea Leaves", qty: 200, cost: 0.25, total: 50.0 },
      { productId: "prod_9", name: "Oranges", qty: 90, cost: 0.5, total: 45.0 },
    ]
  },
];

const SAMPLE_EXPENSES = {
  expenses: [
    { id: generateId(), date: daysAgo(1), category: "Utilities", amount: 150.0, description: "Monthly electricity bill", paymentMethod: "bank" },
    { id: generateId(), date: daysAgo(3), category: "Salaries", amount: 1200.0, description: "Staff wages – week 1", paymentMethod: "bank" },
    { id: generateId(), date: daysAgo(7), category: "Rent", amount: 800.0, description: "Monthly rent", paymentMethod: "bank" },
    { id: generateId(), date: daysAgo(10), category: "Supplies", amount: 45.0, description: "Cleaning & packaging supplies", paymentMethod: "cash" },
    { id: generateId(), date: daysAgo(14), category: "Marketing", amount: 60.0, description: "Social media ads", paymentMethod: "card" },
  ],
  categories: ["Rent", "Salaries", "Utilities", "Supplies", "Marketing", "Insurance", "Maintenance", "Other"],
};

/**
 * Install sample data into all collections.
 * @param {object} params
 * @param {string} params.endpoint       Appwrite endpoint
 * @param {string} params.projectId      Appwrite project ID
 * @param {object} params.collectionIds  { inventory, sales, purchases, expenses, user }
 * @param {string} params.databaseId     Database ID
 * @param {string} params.userId         Authenticated user ID
 * @param {function} params.onProgress   Progress callback
 */
export const installSampleData = async ({
  endpoint,
  projectId,
  collectionIds,
  databaseId,
  userId,
  onProgress,
}) => {
  const log = (msg) => { console.log(msg); onProgress?.(msg); };

  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  const databases = new Databases(client);

  const upsert = async (collectionId, data) => {
    try {
      // Try to find existing doc for this user
      const { Query } = await import("appwrite");
      const existing = await databases.listDocuments(databaseId, collectionId, [
        Query.equal("userId", userId),
      ]);
      const docData = { data: JSON.stringify(data) };
      if (existing.documents.length > 0) {
        await databases.updateDocument(databaseId, collectionId, existing.documents[0].$id, docData);
      } else {
        await databases.createDocument(databaseId, collectionId, "unique()", { ...docData, userId });
      }
    } catch (err) {
      throw new Error(`Failed to write to collection: ${err.message}`);
    }
  };

  log("📦 Installing sample inventory…");
  await upsert(collectionIds.inventory, { products: SAMPLE_PRODUCTS });

  log("💰 Installing sample sales…");
  const todayTotal = SAMPLE_SALES.filter((s) => s.date.startsWith(today.toISOString().slice(0, 10)))
    .reduce((sum, s) => sum + s.total, 0);
  await upsert(collectionIds.sales, { sales: SAMPLE_SALES, todayTotal });

  log("🛒 Installing sample purchases…");
  await upsert(collectionIds.purchases, { purchases: SAMPLE_PURCHASES });

  log("📊 Installing sample expenses…");
  await upsert(collectionIds.expenses, SAMPLE_EXPENSES);

  log("✅ Sample data installed!");
};
