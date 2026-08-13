/**
 * SchemaInstaller.js
 * Creates Appwrite collections and attributes via the REST Management API.
 * Requires an API key with databases.write scope.
 */

const ATTR_TYPES = {
  string: "string",
  integer: "integer",
  float: "float",
  boolean: "boolean",
};

/** Schema definitions for each collection */
const SCHEMAS = {
  inventory: {
    name: "inventory",
    attributes: [
      { key: "userId", type: ATTR_TYPES.string, size: 36, required: true },
      { key: "data", type: ATTR_TYPES.string, size: 1000000, required: true },
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"], orders: ["ASC"] },
    ],
  },
  sales: {
    name: "sales",
    attributes: [
      { key: "userId", type: ATTR_TYPES.string, size: 36, required: true },
      { key: "data", type: ATTR_TYPES.string, size: 1000000, required: true },
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"], orders: ["ASC"] },
    ],
  },
  purchases: {
    name: "purchases",
    attributes: [
      { key: "userId", type: ATTR_TYPES.string, size: 36, required: true },
      { key: "data", type: ATTR_TYPES.string, size: 1000000, required: true },
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"], orders: ["ASC"] },
    ],
  },
  expenses: {
    name: "expenses",
    attributes: [
      { key: "userId", type: ATTR_TYPES.string, size: 36, required: true },
      { key: "data", type: ATTR_TYPES.string, size: 1000000, required: true },
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"], orders: ["ASC"] },
    ],
  },
  users: {
    name: "users",
    attributes: [
      { key: "userId", type: ATTR_TYPES.string, size: 36, required: true },
      { key: "data", type: ATTR_TYPES.string, size: 500000, required: true },
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"], orders: ["ASC"] },
    ],
  },
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll until an attribute reaches "available" status (Appwrite processes them async).
 */
const waitForAttributes = async (endpoint, projectId, apiKey, databaseId, collectionId, maxWait = 30000) => {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await wait(2000);
    const r = await fetch(
      `${endpoint}/v1/databases/${databaseId}/collections/${collectionId}/attributes`,
      { headers: { "X-Appwrite-Project": projectId, "X-Appwrite-Key": apiKey, "Content-Type": "application/json" } }
    );
    if (!r.ok) return;
    const json = await r.json();
    const attrs = json.attributes || [];
    const allAvailable = attrs.length > 0 && attrs.every((a) => a.status === "available");
    if (allAvailable) return;
  }
};

/**
 * Create a single collection with its attributes and indexes.
 * Returns { collectionId, name } on success, throws on hard failure.
 */
const createCollection = async (endpoint, projectId, apiKey, databaseId, schemaKey, onProgress) => {
  const schema = SCHEMAS[schemaKey];
  const baseUrl = `${endpoint}/v1/databases/${databaseId}`;
  const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json",
  };

  onProgress?.(`Creating collection: ${schema.name}…`);

  // 1. Create collection
  const collRes = await fetch(`${baseUrl}/collections`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      collectionId: "unique()",
      name: schema.name,
      permissions: ["read(\"any\")", "create(\"users\")", "update(\"users\")", "delete(\"users\")"],
      documentSecurity: true,
    }),
  });

  if (!collRes.ok) {
    const err = await collRes.json();
    throw new Error(`Failed to create collection "${schema.name}": ${err.message}`);
  }

  const collection = await collRes.json();
  const collectionId = collection.$id;

  // 2. Create attributes
  for (const attr of schema.attributes) {
    onProgress?.(`  Adding attribute: ${attr.key}`);
    let attrUrl;
    let body;

    switch (attr.type) {
      case ATTR_TYPES.integer:
        attrUrl = `${baseUrl}/collections/${collectionId}/attributes/integer`;
        body = { key: attr.key, required: attr.required };
        break;
      case ATTR_TYPES.float:
        attrUrl = `${baseUrl}/collections/${collectionId}/attributes/float`;
        body = { key: attr.key, required: attr.required };
        break;
      case ATTR_TYPES.boolean:
        attrUrl = `${baseUrl}/collections/${collectionId}/attributes/boolean`;
        body = { key: attr.key, required: attr.required };
        break;
      default:
        attrUrl = `${baseUrl}/collections/${collectionId}/attributes/string`;
        body = { key: attr.key, size: attr.size || 255, required: attr.required };
    }

    const attrRes = await fetch(attrUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!attrRes.ok) {
      const err = await attrRes.json();
      throw new Error(`Failed to create attribute "${attr.key}": ${err.message}`);
    }
  }

  // 3. Wait for attributes to be ready before creating indexes
  onProgress?.(`  Waiting for attributes to be ready…`);
  await waitForAttributes(endpoint, projectId, apiKey, databaseId, collectionId);

  // 4. Create indexes
  for (const idx of schema.indexes) {
    onProgress?.(`  Creating index: ${idx.key}`);
    const idxRes = await fetch(`${baseUrl}/collections/${collectionId}/indexes`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        key: idx.key,
        type: idx.type,
        attributes: idx.attributes,
        orders: idx.orders,
      }),
    });
    if (!idxRes.ok) {
      // Index failure is non-fatal — log and continue
      const err = await idxRes.json();
      console.warn(`Index creation warning for ${idx.key}:`, err.message);
    }
  }

  onProgress?.(`  ✓ Collection "${schema.name}" ready (ID: ${collectionId})`);
  return { collectionId, name: schema.name };
};

/**
 * Main entry point.
 * @param {object} params
 * @param {string} params.endpoint    Appwrite endpoint
 * @param {string} params.projectId   Appwrite project ID
 * @param {string} params.apiKey      Server API key with databases.write
 * @param {string} params.databaseId  Target database ID
 * @param {function} params.onProgress  Called with status strings during install
 * @returns {object} collectionIds map { inventory, sales, purchases, expenses, user }
 */
export const installSchema = async ({ endpoint, projectId, apiKey, databaseId, onProgress }) => {
  const log = (msg) => { console.log(msg); onProgress?.(msg); };

  log("🚀 Starting schema installation…");

  const collectionKeys = ["inventory", "sales", "purchases", "expenses", "users"];
  const collectionIds = {};

  for (const key of collectionKeys) {
    const result = await createCollection(endpoint, projectId, apiKey, databaseId, key, log);
    collectionIds[key === "users" ? "user" : key] = result.collectionId;
  }

  log("✅ Schema installation complete!");
  return collectionIds;
};

/**
 * Verify that an existing database has all required collections accessible.
 * Returns { valid: boolean, missing: string[] }
 */
export const verifySchema = async ({ endpoint, projectId, apiKey, databaseId, collectionIds }) => {
  const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json",
  };

  const missing = [];

  for (const [name, id] of Object.entries(collectionIds)) {
    if (!id) { missing.push(name); continue; }
    try {
      const r = await fetch(
        `${endpoint}/v1/databases/${databaseId}/collections/${id}`,
        { headers }
      );
      if (!r.ok) missing.push(name);
    } catch {
      missing.push(name);
    }
  }

  return { valid: missing.length === 0, missing };
};
