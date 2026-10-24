// Creates the MongoDB collections (with JSON-schema validation + indexes)
// and fills them with ~60 days of sample activity.
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config({ path: '.env.local', quiet: true });

export const collections = {
  search_logs: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['query', 'mode', 'resultCount', 'ts'],
        properties: {
          query: { bsonType: 'string', minLength: 1 },
          mode: { enum: ['semantic', 'keyword'] },
          resultCount: { bsonType: 'int', minimum: 0 },
          topScore: { bsonType: ['double', 'null'] },
          filters: { bsonType: 'object' },
          userId: { bsonType: ['int', 'null'] },
          ts: { bsonType: 'date' },
        },
      },
    },
    indexes: [{ key: { ts: -1 } }, { key: { query: 1 } }, { key: { ts: 1 }, expireAfterSeconds: 60 * 60 * 24 * 365 }],
  },
  activity_logs: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['action', 'ts'],
        properties: {
          action: { bsonType: 'string' },
          userId: { bsonType: ['int', 'null'] },
          role: { bsonType: ['string', 'null'] },
          meta: { bsonType: 'object' },
          ts: { bsonType: 'date' },
        },
      },
    },
    indexes: [{ key: { userId: 1, ts: -1 } }, { key: { action: 1, ts: -1 } }],
  },
  notifications: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'type', 'title', 'read', 'createdAt'],
        properties: {
          userId: { bsonType: 'int' },
          type: { enum: ['match_found', 'claim_received', 'claim_approved', 'claim_rejected', 'item_approved', 'item_rejected', 'handover_done'] },
          title: { bsonType: 'string' },
          body: { bsonType: 'string' },
          link: { bsonType: 'string' },
          read: { bsonType: 'bool' },
          data: { bsonType: 'object' },
          createdAt: { bsonType: 'date' },
        },
      },
    },
    indexes: [{ key: { userId: 1, read: 1, createdAt: -1 } }],
  },
};

const day = 24 * 60 * 60 * 1000;
const pick = (arr, i) => arr[i % arr.length];

export async function seedMongo() {
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'lostfound');

  for (const [name, spec] of Object.entries(collections)) {
    await db.collection(name).drop().catch(() => {});
    await db.createCollection(name, { validator: spec.validator });
    for (const idx of spec.indexes) {
      const { key, ...opts } = idx;
      await db.collection(name).createIndex(key, opts);
    }
  }

  // queries students type; some have no matching report (unmet demand)
  const found = ['black headphones', 'id card', 'wallet', 'calculator', 'water bottle', 'bike keys',
    'laptop charger', 'dbms textbook', 'backpack', 'airpods', 'hoodie', 'samsung phone', 'watch', 'earbuds'];
  const unmet = ['macbook', 'cycle lock', 'gold earring', 'umbrella black', 'pen drive', 'spectacles'];
  const now = Date.now();
  const searches = [];
  for (let i = 0; i < 320; i++) {
    const miss = i % 5 === 0;
    searches.push({
      query: miss ? pick(unmet, i) : pick(found, i * 7),
      mode: i % 3 === 0 ? 'keyword' : 'semantic',
      resultCount: miss ? 0 : 1 + (i % 6),
      topScore: miss ? null : 0.5 + (i % 40) / 100,
      filters: i % 4 === 0 ? { type: 'found' } : {},
      userId: 4 + (i % 16),
      ts: new Date(now - (i % 60) * day - (i % 24) * 3600 * 1000),
    });
  }
  await db.collection('search_logs').insertMany(searches);

  const actions = ['login', 'view_item', 'search', 'report_item', 'submit_claim', 'view_item', 'view_item'];
  const activity = [];
  for (let i = 0; i < 600; i++) {
    const userId = i % 9 === 0 ? 1 + (i % 3) : 4 + (i % 16);
    activity.push({
      action: pick(actions, i),
      userId,
      role: userId === 1 ? 'admin' : userId <= 3 ? 'staff' : 'student',
      meta: pick(actions, i) === 'view_item' ? { itemId: 1 + (i % 38) } : {},
      ts: new Date(now - (i % 60) * day - (i % 13) * 3600 * 1000),
    });
  }
  await db.collection('activity_logs').insertMany(activity);

  await db.collection('notifications').insertMany([
    { userId: 4, type: 'match_found', title: 'Possible match for "Grey Wildcraft backpack"', body: 'A found report looks similar to your lost item.', link: '/items/18', read: false, data: { lostItemId: 17, foundItemId: 18 }, createdAt: new Date(now - 4 * day) },
    { userId: 5, type: 'match_found', title: 'Possible match for "AirPods Pro case"', body: 'A found report looks similar to your lost item.', link: '/items/20', read: false, data: { lostItemId: 19, foundItemId: 20 }, createdAt: new Date(now - 2 * day) },
    { userId: 12, type: 'claim_received', title: 'Someone claimed "White Apple earbuds case"', body: '2 claims are waiting for staff review.', link: '/items/20', read: true, data: { itemId: 20 }, createdAt: new Date(now - 2 * day) },
    { userId: 4, type: 'handover_done', title: 'You collected "Black JBL wireless headphones"', body: 'Thanks for using Campus Lost & Found!', link: '/items/2', read: true, data: { claimId: 1 }, createdAt: new Date(now - 100 * day) },
  ]);

  console.log(`MongoDB ready: ${searches.length} search logs, ${activity.length} activity logs, 4 notifications`);
  await client.close();
}

if (import.meta.main) {
  await seedMongo();
}
