# Migration 002: Migrate Lessons to Default Modules

## Overview

This migration script handles the data migration required after applying the course content management schema changes (Migration 001). It ensures that all existing lessons are properly associated with modules by creating default "General" modules for each course.

## Purpose

After Migration 001 adds the `module_id` column to the `lessons` table, existing lessons will have `NULL` values for this field. This migration:

1. **Creates default modules**: For each course with orphaned lessons, creates a "General" module
2. **Migrates lessons**: Updates all lessons without a module_id to reference the default module
3. **Preserves order**: Maintains the existing `order_index` values of lessons
4. **Ensures data integrity**: Verifies that no lessons remain without module assignments

## Requirements

- **Prerequisites**: Migration 001 must be applied first
- **Node.js**: Version 14 or higher
- **Database access**: Valid credentials in `.env` file
- **Permissions**: Database user must have INSERT, UPDATE, and DELETE permissions

## Usage

### Running the Migration

```bash
cd lms-backend
node migrations/002_migrate_lessons_to_modules.js
```

### Testing the Migration (Dry Run)

Before running the actual migration, you can test it:

```bash
cd lms-backend
node migrations/test-migration.js
```

This will show you:
- How many lessons need migration
- Which courses will get default modules
- Verification of results

### Rolling Back

If you need to undo the migration:

```bash
cd lms-backend
node migrations/002_migrate_lessons_to_modules.js --rollback
```

**⚠️ WARNING**: Rollback will:
- Delete all "General" modules created by this migration
- Set `module_id` back to `NULL` for affected lessons
- This may break the application if it expects all lessons to have modules

## What Happens During Migration

### Step-by-Step Process

1. **Identify Courses**: Finds all courses that have lessons without `module_id`
2. **Create Modules**: For each course:
   - Checks if a "General" module already exists
   - Creates a new "General" module if needed (with `order_index = 0`)
   - Uses existing "General" module if found
3. **Migrate Lessons**: Updates all orphaned lessons to reference the default module
4. **Preserve Order**: Keeps the original `order_index` value for each lesson
5. **Verify**: Confirms that no lessons remain without module assignments

### Example Output

```
============================================================
MIGRATION: Migrate lessons to default modules
============================================================
Starting migration: Migrate lessons to default modules...
Found 2 courses with lessons needing migration

Processing course: c0000000-0000-0000-0000-000000000001
  Course title: Introduction to Web Development
  Created new "General" module: m1234567-89ab-cdef-0123-456789abcdef
  Found 4 lessons to migrate
  Migrated 4 lessons to module m1234567-89ab-cdef-0123-456789abcdef
  ✓ Verification passed: All lessons migrated successfully

Processing course: c0000000-0000-0000-0000-000000000002
  Course title: Advanced JavaScript
  Created new "General" module: m2345678-9abc-def0-1234-56789abcdef0
  Found 6 lessons to migrate
  Migrated 6 lessons to module m2345678-9abc-def0-1234-56789abcdef0
  ✓ Verification passed: All lessons migrated successfully

✓ Migration completed successfully!
  Total courses processed: 2
  All lessons now have module assignments

Done!
```

## Database Changes

### Before Migration

```sql
-- Lessons table
SELECT id, course_id, title, module_id, order_index FROM lessons;

-- Result:
-- id                                   | course_id                            | title              | module_id | order_index
-- -------------------------------------|--------------------------------------|--------------------|-----------|-----------
-- 20000000-0000-0000-0000-000000000001 | c0000000-0000-0000-0000-000000000001 | Introduction to... | NULL      | 1
-- 20000000-0000-0000-0000-000000000002 | c0000000-0000-0000-0000-000000000001 | CSS Fundamentals   | NULL      | 2
```

### After Migration

```sql
-- Modules table (new entries)
SELECT id, course_id, title, description, order_index FROM modules;

-- Result:
-- id                                   | course_id                            | title   | description                    | order_index
-- -------------------------------------|--------------------------------------|---------|--------------------------------|-----------
-- m1234567-89ab-cdef-0123-456789abcdef | c0000000-0000-0000-0000-000000000001 | General | Default module for course...   | 0

-- Lessons table (updated)
SELECT id, course_id, title, module_id, order_index FROM lessons;

-- Result:
-- id                                   | course_id                            | title              | module_id                            | order_index
-- -------------------------------------|--------------------------------------|--------------------|------------------------------------- |-----------
-- 20000000-0000-0000-0000-000000000001 | c0000000-0000-0000-0000-000000000001 | Introduction to... | m1234567-89ab-cdef-0123-456789abcdef | 1
-- 20000000-0000-0000-0000-000000000002 | c0000000-0000-0000-0000-000000000001 | CSS Fundamentals   | m1234567-89ab-cdef-0123-456789abcdef | 2
```

## Verification Queries

After running the migration, you can verify the results:

### Check for Orphaned Lessons

```sql
-- Should return 0 rows
SELECT COUNT(*) as orphaned_lessons
FROM lessons
WHERE module_id IS NULL;
```

### View Created Modules

```sql
-- Shows all "General" modules with lesson counts
SELECT 
    m.id,
    m.title,
    c.title as course_title,
    COUNT(l.id) as lesson_count
FROM modules m
JOIN courses c ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
WHERE m.title = 'General'
GROUP BY m.id, m.title, c.title
ORDER BY c.title;
```

### Verify Lesson Order Preservation

```sql
-- Check that order_index values are preserved
SELECT 
    l.id,
    l.title,
    l.order_index,
    m.title as module_title,
    c.title as course_title
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON l.course_id = c.id
ORDER BY c.title, l.order_index;
```

## Troubleshooting

### Migration Fails with "Module not found"

**Cause**: Database connection issue or permissions problem

**Solution**: 
1. Check `.env` file has correct database credentials
2. Verify database user has necessary permissions
3. Ensure Migration 001 was applied successfully

### Some Lessons Still Have NULL module_id

**Cause**: Transaction rollback or partial failure

**Solution**:
1. Check the error message in the console
2. Fix any database issues
3. Re-run the migration (it's safe to run multiple times)

### "General" Module Already Exists

**Behavior**: The script will use the existing "General" module instead of creating a new one

**Note**: This is expected behavior and not an error

## Safety Features

1. **Transaction-based**: All changes are wrapped in a database transaction
2. **Rollback on error**: If any step fails, all changes are rolled back
3. **Verification**: After migration, verifies that no orphaned lessons remain
4. **Idempotent**: Safe to run multiple times (won't create duplicate modules)
5. **Logging**: Detailed console output for monitoring progress

## Post-Migration Steps

After successfully running this migration:

1. **Verify Results**: Run the verification queries above
2. **Test Application**: Ensure the course content management features work correctly
3. **Backup Database**: Create a backup of the migrated database
4. **Deploy Frontend**: Deploy the updated frontend that uses the new module structure
5. **Monitor**: Watch for any issues with lesson display or ordering

## Related Files

- `001_add_course_content_management.sql` - Schema migration (prerequisite)
- `001_rollback_course_content_management.sql` - Schema rollback
- `test-migration.js` - Test script for this migration
- `README.md` - General migration documentation

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Review the verification queries to understand the current state
3. Ensure all prerequisites are met
4. Check database logs for any constraint violations
5. Verify that Migration 001 was applied correctly

## Requirements Validation

This migration validates:
- **Requirement 1.1**: Module creation for course organization
- **Requirement 2.1**: Lesson management within modules
- All existing lessons are properly associated with modules
- Data integrity is maintained throughout the migration
