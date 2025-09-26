import { mutation } from "../_generated/server";

/**
 * MIGRATION: Add assignmentType field to completion records
 * 
 * PURPOSE: Migrates existing completion records to include the new assignmentType field
 *          to support unified completion tracking for both cron and JIT assignments.
 * 
 * MIGRATION STRATEGY:
 * This migration follows the "Expand-Contract" pattern for safe schema migrations:
 * 1. Expand: Make new field optional to allow existing records
 * 2. Migrate: Update existing records with default values
 * 3. Contract: Make field required after migration
 * 
 * REFERENCES:
 * - Database Migration Best Practices: https://martinfowler.com/articles/evodb.html
 * - Schema Evolution Patterns: https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate
 * - Convex Schema Evolution: https://docs.convex.dev/database/schemas
 * - Safe Database Migrations: https://blog.codeship.com/database-migrations-best-practices/
 * 
 * MIGRATION INSTRUCTIONS:
 * 
 * 1. BACKUP PRODUCTION DATA (CRITICAL):
 *    npx convex export --prod > production-backup-$(date +%Y%m%d).json
 * 
 * 2. DEPLOY PHASE 1 - Make assignmentType optional:
 *    - Update schema.ts to use: assignmentType: v.optional(v.union(v.literal("cron"), v.literal("jit")))
 *    - Deploy: npx convex deploy --prod
 *    - Verify: Test that existing completions still work
 * 
 * 3. RUN MIGRATION:
 *    npx convex run migrations:20250126130000__add_assignment_type_to_completions:migrateProductionCompletions --prod
 * 
 * 4. DEPLOY PHASE 2 - Make assignmentType required:
 *    - Update schema.ts to use: assignmentType: v.union(v.literal("cron"), v.literal("jit"))
 *    - Deploy: npx convex deploy --prod
 *    - Verify: Test completion functionality
 * 
 * 5. CLEAN UP:
 *    - Delete this file: rm convex/migrations/20250126130000__add_assignment_type_to_completions.ts
 *    - Deploy: npx convex deploy --prod
 * 
 * ROLLBACK PLAN:
 * - If issues occur, revert schema to previous version
 * - Use backup to restore data if necessary
 * - Deploy previous application code version
 * 
 * VERIFICATION:
 * - Check all completions have assignmentType: 
 *   npx convex run --prod -c "return await ctx.db.query('assignment_completions').collect().then(completions => completions.every(c => c.assignmentType))"
 * - Test completing both cron and JIT assignments
 */

export const migrateProductionCompletions = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting production migration of completion records...");
    
    // Get all existing completion records
    const completions = await ctx.db.query("assignment_completions").collect();
    console.log(`Found ${completions.length} completion records to check`);
    
    let migrated = 0;
    let alreadyMigrated = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    
    for (const completion of completions) {
      try {
        // Check if this completion already has assignmentType
        if (!completion.assignmentType) {
          // All existing completions are from regular assignments (cron type)
          // since JIT assignments are new
          await ctx.db.patch(completion._id, {
            assignmentType: "cron" as const,
          });
          migrated++;
          
          if (migrated % 100 === 0) {
            console.log(`Migrated ${migrated} records so far...`);
          }
        } else {
          alreadyMigrated++;
        }
      } catch (error) {
        const errorMsg = `Failed to migrate completion ${completion._id}: ${error}`;
        console.error(errorMsg);
        errorDetails.push(errorMsg);
        errors++;
      }
    }
    
    const result = {
      totalRecords: completions.length,
      migrated,
      alreadyMigrated,
      errors,
      errorDetails: errorDetails.slice(0, 10), // Limit error details to first 10
    };
    
    console.log("Migration completed:", result);
    
    if (errors > 0) {
      console.warn(`Migration completed with ${errors} errors. Check errorDetails for details.`);
    } else {
      console.log("Migration completed successfully with no errors!");
    }
    
    return result;
  },
});

/**
 * VERIFICATION MUTATION
 * 
 * Run this after migration to verify all records have assignmentType:
 * npx convex run prod-migration:verifyMigration --prod
 */
export const verifyMigration = mutation({
  args: {},
  handler: async (ctx) => {
    const completions = await ctx.db.query("assignment_completions").collect();
    
    const withoutType = completions.filter(c => !c.assignmentType);
    const withCronType = completions.filter(c => c.assignmentType === "cron");
    const withJitType = completions.filter(c => c.assignmentType === "jit");
    
    return {
      totalRecords: completions.length,
      withoutAssignmentType: withoutType.length,
      withCronType: withCronType.length,
      withJitType: withJitType.length,
      migrationComplete: withoutType.length === 0,
      sampleWithoutType: withoutType.slice(0, 5).map(c => ({ id: c._id, assignmentId: c.assignmentId })),
    };
  },
});
