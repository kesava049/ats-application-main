import dotenv from 'dotenv';
import pkg from '@prisma/client';

dotenv.config();

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🗑️  Dropping table reupload_jobs if it exists...');
        await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "reupload_jobs" CASCADE;');
        console.log('✅ Table reupload_jobs dropped (if it existed).');
    } catch (error) {
        console.error('❌ Error dropping table reupload_jobs:', error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();