# Convex Migrations

This directory contains database migration scripts for the Oomph application.

## Migration Naming Convention

Migrations follow the pattern: `YYYYMMDDHHMMSS__description.ts`

- **YYYYMMDDHHMMSS**: 14-digit timestamp (year, month, day, hour, minute, second)
- **description**: Snake_case description of what the migration does
- **.ts**: TypeScript extension for Convex functions

## Examples

- `20250126130000__add_assignment_type_to_completions.ts`
- `20250126140000__migrate_existing_completions.ts`
- `20250126150000__verify_migration_success.ts`

## Migration Types

- **Schema migrations**: `add_field`, `remove_field`, `change_type`
- **Data migrations**: `migrate_data`, `transform_records`
- **Cleanup migrations**: `remove_unused_data`, `optimize_indexes`

## Running Migrations

```bash
# Run a specific migration
npx convex run migrations:20250126130000__add_assignment_type_to_completions:migrateProductionCompletions --prod

# Run verification
npx convex run migrations:20250126130000__add_assignment_type_to_completions:verifyMigration --prod
```

## Best Practices

1. **Always backup before running migrations**
2. **Test migrations in development first**
3. **Include rollback instructions in migration comments**
4. **Verify migration success before cleanup**
5. **Delete migration files after successful completion**

## Migration Lifecycle

1. Create migration file with timestamp
2. Test in development environment
3. Backup production data
4. Deploy schema changes (if needed)
5. Run migration
6. Verify success
7. Clean up migration file
8. Deploy final schema (if needed)
