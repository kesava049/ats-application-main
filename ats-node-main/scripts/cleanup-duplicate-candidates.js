import prisma from "../prismaClient.js";

// This script deletes duplicate CandidateApplication rows per (companyId, email, jobId),
// keeping the most recent (highest id) record. Run after adding the unique index.

async function main() {
    console.log("🔎 Starting duplicate cleanup for CandidateApplication...");

    // Fetch all duplicates grouped by companyId, email, jobId having count > 1
    const duplicates = await prisma.$queryRawUnsafe(`
    SELECT company_id as "companyId", email, job_id as "jobId", COUNT(*) as count
    FROM "CandidateApplication"
    GROUP BY company_id, email, job_id
    HAVING COUNT(*) > 1
  `);

    let totalDeleted = 0;
    for (const row of duplicates) {
        const { companyId, email, jobId } = row;
        const apps = await prisma.candidateApplication.findMany({
            where: { companyId, email, jobId },
            orderBy: { id: "desc" },
            select: { id: true }
        });
        const keepId = apps[0] ? .id;
        const deleteIds = apps.slice(1).map(a => a.id);
        if (deleteIds.length > 0) {
            console.log(`🗑️  Removing ${deleteIds.length} duplicates for (${companyId}, ${email}, ${jobId}), keeping id ${keepId}`);
            await prisma.candidateApplication.deleteMany({ where: { id: { in: deleteIds } } });
            totalDeleted += deleteIds.length;
        }
    }

    console.log(`✅ Cleanup complete. Deleted ${totalDeleted} duplicate rows.`);
}

main()
    .catch((e) => {
        console.error("❌ Cleanup failed:", e);
        process.exit(1);
    })
    .finally(async() => {
        await prisma.$disconnect();
    });