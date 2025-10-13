import pkg from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { PrismaClient } = pkg;

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  __internal: {
    engine: {
      connectionLimit: 5,
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
    },
  },
});

// Connection retry logic
let connectionRetries = 0;
const maxRetries = 3;

const connectWithRetry = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL Database connected successfully!');
    console.log('📊 Database connection established and ready for queries');
    connectionRetries = 0; // Reset retry counter on success
    return true;
  } catch (error) {
    connectionRetries++;
    console.error(`❌ Database connection attempt ${connectionRetries} failed:`, error.message);
    
    if (connectionRetries < maxRetries) {
      console.log(`🔄 Retrying connection in 2 seconds... (${connectionRetries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await connectWithRetry();
    } else {
      console.error('❌ Max retry attempts reached. Database connection failed.');
      return false;
    }
  }
};

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('🔌 Database connection closed gracefully');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🔌 Database connection closed due to SIGINT');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('🔌 Database connection closed due to SIGTERM');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await prisma.$disconnect();
  process.exit(1);
});

// Export both prisma client and connection function
export { connectWithRetry };
export default prisma;