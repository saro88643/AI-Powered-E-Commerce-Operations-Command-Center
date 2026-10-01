const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

let client = null;
let db = null;
let isMongoConnected = false;

// In-memory fallback if mongo server isn't available
const memoryStore = {
  customers: [],
  support_tickets: [],
  customer_events: [],
  communication_history: []
};

// Pre-load from generated JSON as baseline
try {
  const custPath = path.join(__dirname, '../../../../data/generated/customers.json');
  const tickPath = path.join(__dirname, '../../../../data/generated/support_tickets.json');
  if (fs.existsSync(custPath)) memoryStore.customers = JSON.parse(fs.readFileSync(custPath, 'utf8'));
  if (fs.existsSync(tickPath)) memoryStore.support_tickets = JSON.parse(fs.readFileSync(tickPath, 'utf8'));
} catch (e) {
  // ok
}

async function initMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsphere';
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 2500 });
    await client.connect();
    db = client.db();
    isMongoConnected = true;
    console.log(`✓ Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.warn(`ℹ MongoDB connection failed (${err.message}). Using memory fallback for customer/support documents.`);
    isMongoConnected = false;
  }
}

function getCollection(name) {
  if (isMongoConnected && db) {
    return db.collection(name);
  }

  // Graceful in-memory collection mock
  return {
    find: (filter = {}) => {
      let items = memoryStore[name] || [];
      return {
        toArray: async () => {
          let res = items;
          if (filter.customer_id) {
            res = res.filter(i => (i.customer_id || '').toLowerCase() === filter.customer_id.toLowerCase());
          }
          if (filter.order_id) {
            res = res.filter(i => (i.order_id || '').toLowerCase() === filter.order_id.toLowerCase());
          }
          if (filter.status) {
            res = res.filter(i => (i.status || '').toLowerCase() === filter.status.toLowerCase());
          }
          if (filter.priority) {
            res = res.filter(i => (i.priority || '').toLowerCase() === filter.priority.toLowerCase());
          }
          if (filter.category) {
            res = res.filter(i => (i.category || '').toLowerCase() === filter.category.toLowerCase());
          }
          return res;
        },
        limit: (n) => ({
          toArray: async () => (items.slice(0, n))
        }),
        skip: (s) => ({
          limit: (n) => ({
            toArray: async () => items.slice(s, s + n)
          })
        })
      };
    },
    findOne: async (filter = {}) => {
      let items = memoryStore[name] || [];
      if (filter.customer_id) {
        return items.find(i => (i.customer_id || '').toLowerCase() === filter.customer_id.toLowerCase()) || null;
      }
      if (filter.ticket_id) {
        return items.find(i => (i.ticket_id || '').toLowerCase() === filter.ticket_id.toLowerCase()) || null;
      }
      return items[0] || null;
    },
    countDocuments: async (filter = {}) => {
      const items = memoryStore[name] || [];
      if (Object.keys(filter).length === 0) return items.length;
      return items.filter(i => {
        for (const [k, v] of Object.entries(filter)) {
          if (i[k] !== v) return false;
        }
        return true;
      }).length;
    },
    insertOne: async (doc) => {
      if (!memoryStore[name]) memoryStore[name] = [];
      memoryStore[name].push(doc);
      return { insertedId: doc._id || doc.ticket_id || Date.now() };
    },
    insertMany: async (docs) => {
      if (!memoryStore[name]) memoryStore[name] = [];
      memoryStore[name].push(...docs);
      return { insertedCount: docs.length };
    },
    updateOne: async (filter, update) => {
      const items = memoryStore[name] || [];
      const item = items.find(i => (filter.ticket_id && i.ticket_id === filter.ticket_id));
      if (item && update.$set) {
        Object.assign(item, update.$set);
      }
      return { matchedCount: item ? 1 : 0, modifiedCount: item ? 1 : 0 };
    }
  };
}

module.exports = {
  initMongo,
  getCollection,
  getDb: () => db,
  isMongoConnected: () => isMongoConnected
};
