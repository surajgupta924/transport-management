import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSockets } from './sockets/index.js';
import { startWorkers, stopWorkers } from './jobs/index.js';
import { closeRedis } from './config/redis.js';
import { seedInitialData } from './seeds/startup.js';

async function bootstrap() {
  // Connect MongoDB
  await connectDB();

  // Automatically prepare initial/demo data
  await seedInitialData();

  const app = createApp();
  const server = http.createServer(app);

  initSockets(server);

  // Optional BullMQ workers
  startWorkers().catch((err) => {
    console.warn('[jobs] failed to start workers:', err.message);
  });

  server.listen(env.port, () => {
    console.log(`TMS API running on http://localhost:${env.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down...`);

    try {
      await stopWorkers();
      await closeRedis();
    } catch (err) {
      console.error('Shutdown error', err);
    }

    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
