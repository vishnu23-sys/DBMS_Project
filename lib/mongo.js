// MongoDB holds the high-volume, schema-flexible data: activity logs,
// search logs and per-user notifications. PostgreSQL stays the source of
// truth for items/claims; if MongoDB is down the app keeps working.
import { Double, MongoClient } from 'mongodb';

function getDb() {
  if (!globalThis.__mongoPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    globalThis.__mongoPromise = client.connect().catch((err) => {
      globalThis.__mongoPromise = null;
      throw err;
    });
  }
  return globalThis.__mongoPromise.then((c) => c.db(process.env.MONGODB_DB || 'lostfound'));
}

async function safely(label, fn, fallback = null) {
  try {
    return await fn(await getDb());
  } catch (err) {
    console.warn(`[mongo] ${label} skipped: ${err.message}`);
    return fallback;
  }
}

export function logActivity(session, action, meta = {}) {
  return safely('activity log', (db) =>
    db.collection('activity_logs').insertOne({
      action,
      userId: session?.userId ?? null,
      role: session?.role ?? null,
      meta,
      ts: new Date(),
    }),
  );
}

export function logSearch(session, { query, mode, filters, resultCount, topScore }) {
  return safely('search log', (db) =>
    db.collection('search_logs').insertOne({
      query: query.toLowerCase().slice(0, 200),
      mode,
      filters,
      resultCount,
      topScore: topScore == null ? null : new Double(topScore),
      userId: session?.userId ?? null,
      ts: new Date(),
    }),
  );
}

export function notify(userId, type, title, body, link, data = {}) {
  return safely('notification', (db) =>
    db.collection('notifications').insertOne({
      userId, type, title, body, link, data, read: false, createdAt: new Date(),
    }),
  );
}

export function getNotifications(userId, limit = 15) {
  return safely(
    'notifications',
    (db) => db.collection('notifications').find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray(),
    [],
  );
}

export function countUnread(userId) {
  return safely('unread count', (db) => db.collection('notifications').countDocuments({ userId, read: false }), 0);
}

export function markAllRead(userId) {
  return safely('mark read', (db) =>
    db.collection('notifications').updateMany({ userId, read: false }, { $set: { read: true } }),
  );
}

// ---------------------------------------------------------------------
// Aggregation pipelines for the reports page
// ---------------------------------------------------------------------
export function mongoReports() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return safely('reports', async (db) => {
    const [topSearches, unmetSearches, dailyActivity, actionsByRole] = await Promise.all([
      db.collection('search_logs').aggregate([
        { $match: { ts: { $gte: since } } },
        { $group: { _id: '$query', searches: { $sum: 1 }, avgResults: { $avg: '$resultCount' },
                    semantic: { $sum: { $cond: [{ $eq: ['$mode', 'semantic'] }, 1, 0] } } } },
        { $sort: { searches: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, query: '$_id', searches: 1, semantic: 1, avgResults: { $round: ['$avgResults', 1] } } },
      ]).toArray(),
      db.collection('search_logs').aggregate([
        { $match: { resultCount: 0 } },
        { $group: { _id: '$query', times: { $sum: 1 }, lastSearched: { $max: '$ts' } } },
        { $sort: { times: -1 } },
        { $limit: 6 },
        { $project: { _id: 0, query: '$_id', times: 1,
                      lastSearched: { $dateToString: { format: '%d %b', date: '$lastSearched' } } } },
      ]).toArray(),
      db.collection('activity_logs').aggregate([
        { $match: { ts: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } }, events: { $sum: 1 },
                    users: { $addToSet: '$userId' } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, day: { $substrBytes: ['$_id', 5, 5] }, events: 1, activeUsers: { $size: '$users' } } },
      ]).toArray(),
      db.collection('activity_logs').aggregate([
        { $group: { _id: { role: '$role', action: '$action' }, count: { $sum: 1 } } },
        { $group: { _id: '$_id.role', total: { $sum: '$count' },
                    actions: { $push: { k: '$_id.action', v: '$count' } } } },
        { $project: { _id: 0, role: { $ifNull: ['$_id', 'guest'] }, total: 1, actions: { $arrayToObject: '$actions' } } },
        { $sort: { total: -1 } },
      ]).toArray(),
    ]);
    // fixed column order for display
    return {
      topSearches: topSearches.map((r) => ({ query: r.query, searches: r.searches, semantic: r.semantic, avgResults: r.avgResults })),
      unmetSearches: unmetSearches.map((r) => ({ query: r.query, times: r.times, lastSearched: r.lastSearched })),
      dailyActivity: dailyActivity.map((r) => ({ day: r.day, events: r.events, activeUsers: r.activeUsers })),
      actionsByRole: actionsByRole.map((r) => ({ role: r.role, total: r.total, ...r.actions })),
    };
  });
}
