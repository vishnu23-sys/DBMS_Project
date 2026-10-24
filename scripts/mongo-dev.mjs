// Zero-install local MongoDB for development: downloads the official
// mongod binary on first run and keeps data in ./.mongo-data.
// Usage: npm run mongo:dev   (leave it running; Ctrl+C to stop)
import { mkdirSync } from 'node:fs';
import { MongoMemoryServer } from 'mongodb-memory-server';

mkdirSync('.mongo-data', { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath: '.mongo-data', storageEngine: 'wiredTiger' },
});

console.log(`MongoDB running at ${server.getUri()}  (Ctrl+C to stop)`);

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
