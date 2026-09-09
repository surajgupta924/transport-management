import { Queue, Worker } from 'bullmq';
import { getRedis, isRedisAvailable } from '../config/redis.js';
import { sendMail } from '../config/mail.js';
import * as templates from './emailTemplates.js';

const queues = new Map();
const workers = [];
let started = false;

function connectionFromRedis(redis) {
  return redis;
}

export function getQueue(name) {
  if (!isRedisAvailable()) return null;
  if (queues.has(name)) return queues.get(name);
  const redis = getRedis();
  // getRedis is async; callers must ensure redis ready via startWorkers
  return null;
}

async function ensureQueue(name) {
  const redis = await getRedis();
  if (!redis || !isRedisAvailable()) return null;
  if (queues.has(name)) return queues.get(name);

  const queue = new Queue(name, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });
  queues.set(name, queue);
  return queue;
}

/**
 * Enqueue email job. Falls back to immediate send if Redis unavailable.
 */
export async function enqueueEmail(jobName, data) {
  const queue = await ensureQueue('email');
  if (!queue) {
    console.warn('[jobs] Redis unavailable — sending email immediately');
    return sendEmailJob(jobName, data);
  }
  return queue.add(jobName, data);
}

async function sendEmailJob(jobName, data) {
  let mail;
  switch (jobName) {
    case 'welcome':
      mail = templates.welcomeEmail(data);
      break;
    case 'booking-confirmation':
      mail = templates.bookingConfirmationEmail(data);
      break;
    case 'invoice':
      mail = templates.invoiceEmail(data);
      break;
    case 'document-expiry':
      mail = templates.documentExpiryEmail(data);
      break;
    case 'otp':
      mail = templates.otpEmail(data);
      break;
    default:
      mail = { subject: data.subject || 'TMS Notification', html: data.html || `<p>${data.body || ''}</p>` };
  }
  return sendMail({ to: data.to, subject: mail.subject, html: mail.html });
}

export async function startWorkers() {
  if (started) return { started: false, reason: 'already-started' };
  const redis = await getRedis();
  if (!redis || !isRedisAvailable()) {
    console.warn('[jobs] Redis not available — workers not started (jobs will no-op/fallback)');
    return { started: false, reason: 'no-redis' };
  }

  await ensureQueue('email');
  await ensureQueue('reminders');

  const emailWorker = new Worker(
    'email',
    async (job) => sendEmailJob(job.name, job.data),
    { connection: redis }
  );
  emailWorker.on('failed', (job, err) => {
    console.error('[jobs] email failed', job?.id, err.message);
  });
  workers.push(emailWorker);

  const reminderWorker = new Worker(
    'reminders',
    async (job) => {
      // Placeholder for document/maintenance/overdue invoice reminders
      console.log('[jobs] reminder', job.name, job.data);
      if (job.data?.to) {
        await sendEmailJob(job.name || 'document-expiry', job.data);
      }
    },
    { connection: redis }
  );
  workers.push(reminderWorker);

  started = true;
  console.log('[jobs] BullMQ workers started');
  return { started: true };
}

export async function stopWorkers() {
  await Promise.all(workers.map((w) => w.close()));
  await Promise.all([...queues.values()].map((q) => q.close()));
  workers.length = 0;
  queues.clear();
  started = false;
}

// silence unused helper
void connectionFromRedis;
