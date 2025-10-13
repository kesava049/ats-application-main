import dotenv from 'dotenv';
import prisma from '../prismaClient.js';

dotenv.config();

async function main() {
    try {
        console.log('🗑️  Deleting all CandidateApplication records...');

        // Delete child records first if any non-cascading relations exist
        // InterviewSchedule has onDelete: Cascade, so deleting candidates will cascade those.

        const result = await prisma.CandidateApplication.deleteMany({});
        console.log(`✅ Deleted ${result.count} CandidateApplication record(s).`);
    } catch (error) {
        console.error('❌ Error deleting CandidateApplication records:', error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();