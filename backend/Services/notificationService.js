const Queue = require('bull');
const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create Redis client for Bull
const createRedisClient = (type) => {
  const client = new Redis(redisConfig);
  
  client.on('error', (err) => {
    console.error(`Redis ${type} client error:`, err);
  });
  
  client.on('connect', () => {
    console.log(`Redis ${type} client connected`);
  });
  
  return client;
};

// Email queue for immediate notifications
const emailQueue = new Queue('email-notifications', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Reminder queue for scheduled reminders
const reminderQueue = new Queue('appointment-reminders', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Dead letter queue for failed jobs
const deadLetterQueue = new Queue('dead-letter', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false
  }
});

// Queue event handlers
emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailQueue.on('failed', async (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
  
  // Move to dead letter queue after max retries
  if (job.attemptsMade >= job.opts.attempts) {
    await deadLetterQueue.add('failed-email', {
      originalJob: job.data,
      error: err.message,
      failedAt: new Date(),
      attempts: job.attemptsMade
    });
    console.log(`Job ${job.id} moved to dead letter queue`);
  }
});

reminderQueue.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed successfully`);
});

reminderQueue.on('failed', async (job, err) => {
  console.error(`Reminder job ${job.id} failed:`, err.message);
  
  if (job.attemptsMade >= job.opts.attempts) {
    await deadLetterQueue.add('failed-reminder', {
      originalJob: job.data,
      error: err.message,
      failedAt: new Date(),
      attempts: job.attemptsMade
    });
  }
});

// Helper function to queue email notifications
const queueNotification = async (type, recipientEmail, data) => {
  try {
    const job = await emailQueue.add(
      type,
      {
        type,
        recipientEmail,
        data,
        timestamp: new Date()
      },
      {
        priority: getPriority(type)
      }
    );
    
    console.log(`Email notification queued: ${type} to ${recipientEmail} (Job ID: ${job.id})`);
    return job;
  } catch (error) {
    console.error('Error queueing notification:', error);
    throw error;
  }
};

// Helper function to queue appointment reminders
const queueReminder = async (appointmentId, userEmail, providerEmail, data) => {
  try {
    const job = await reminderQueue.add(
      'appointment-reminder',
      {
        appointmentId,
        userEmail,
        providerEmail,
        data,
        timestamp: new Date()
      },
      {
        priority: 1 // High priority for reminders
      }
    );
    
    console.log(`Reminder queued for appointment ${appointmentId} (Job ID: ${job.id})`);
    return job;
  } catch (error) {
    console.error('Error queueing reminder:', error);
    throw error;
  }
};

// Assign priority based on notification type
const getPriority = (type) => {
  const priorities = {
    'BOOKING_CONFIRMATION': 1,
    'APPOINTMENT_APPROVED': 1,
    'APPOINTMENT_REJECTED': 1,
    'APPOINTMENT_CANCELLED': 2,
    'APPOINTMENT_COMPLETED': 3,
    'PROVIDER_APPROVED': 1,
    'PROVIDER_REJECTED': 2,
    'APPOINTMENT_RESCHEDULED': 1,
    'STATUS_CHANGED': 2
  };
  
  return priorities[type] || 3;
};

// Get queue statistics
const getQueueStats = async () => {
  try {
    const [emailCounts, reminderCounts, deadLetterCounts] = await Promise.all([
      emailQueue.getJobCounts(),
      reminderQueue.getJobCounts(),
      deadLetterQueue.getJobCounts()
    ]);
    
    return {
      emailQueue: emailCounts,
      reminderQueue: reminderCounts,
      deadLetterQueue: deadLetterCounts
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    throw error;
  }
};

// Clean up completed jobs older than 24 hours
const cleanQueues = async () => {
  try {
    const gracePeriod = 24 * 60 * 60 * 1000; // 24 hours
    
    await emailQueue.clean(gracePeriod, 'completed');
    await reminderQueue.clean(gracePeriod, 'completed');
    
    console.log('Queue cleanup completed');
  } catch (error) {
    console.error('Error cleaning queues:', error);
  }
};

module.exports = {
  emailQueue,
  reminderQueue,
  deadLetterQueue,
  queueNotification,
  queueReminder,
  getQueueStats,
  cleanQueues
};
