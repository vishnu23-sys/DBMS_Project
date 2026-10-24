// Zero-install local MongoDB for development: downloads the official
// mongod binary on first run and keeps data in ~/.campus-lost-found/mongo
// (outside the project so the Next.js file watcher ignores it).
// Usage: npm run mongo:dev   (leave it running; Ctrl+C to stop)
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const dbPath = path.join(homedir(), '.campus-lost-found', 'mongo');
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' },
});

console.log(`MongoDB running at ${server.getUri()}  (Ctrl+C to stop)`);

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
