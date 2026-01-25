# Quick Guide: Running Migration 002 Tests

## Prerequisites

1. **SSH into your Ubuntu VM**:
   ```bash
   ssh user@your-vm-ip
   ```

2. **Navigate to project directory**:
   ```bash
   cd ~/IAA202/lms-backend
   ```

3. **Ensure database is running**:
   ```bash
   sudo systemctl status postgresql
   ```

## Quick Test (5 minutes)

Run the simple test script:

```bash
node migrations/test-migration.js
```

This will:
- Show current state of lessons
- Run the migration
- Verify results
- Display created modules

## Comprehensive Test (10 minutes)

Run the full test suite:

```bash
node migrations/test-migration-comprehensive.js
```

This will:
- Analyze pre-migration state
- Create sample data if needed
- Run migration
- Verify data integrity (5 checks)
- Test rollback capability
- Re-run migration
- Perform final verification

**When prompted to clean up test data, type `y` or `n`**

## Manual Verification

If you want to manually verify the migration, connect to PostgreSQL:

```bash
psql -U postgres -d lms_db
```

Then run these queries:

### Check for orphaned lessons:
```sql
SELECT COUNT(*) FROM lessons WHERE module_id IS NULL;
```
Should return: 0

### View created modules:
```sql
SELECT m.title, c.title as course, COUNT(l.id) as lessons
FROM modules m
JOIN courses c ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
WHERE m.title = 'General'
GROUP BY m.title, c.title;
```

### Exit PostgreSQL:
```sql
\q
```

## Test Rollback

To test the rollback functionality:

```bash
# Run migration first
node migrations/002_migrate_lessons_to_modules.js

# Then rollback
node migrations/002_migrate_lessons_to_modules.js --rollback

# Then re-run migration
node migrations/002_migrate_lessons_to_modules.js
```

## Expected Results

### ✅ Success Indicators:
- "✓ Migration completed successfully!"
- "All lessons now have module assignments"
- All verification checks pass
- No error messages

### ❌ Failure Indicators:
- "✗ Migration failed"
- "lessons still without module_id"
- Database connection errors
- Transaction rollback messages

## Common Issues

### Issue 1: Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Check if PostgreSQL is running:
```bash
sudo systemctl start postgresql
```

### Issue 2: Permission Denied
```
Error: permission denied for table lessons
```
**Solution**: Check database user permissions in `.env` file

### Issue 3: Migration Already Applied
```
Found 0 courses with lessons needing migration
```
**Solution**: This is normal if migration was already run. All lessons already have modules.

## After Testing

Once tests pass, the migration is ready for production use. The migration has been verified for:

- ✅ Data integrity
- ✅ Rollback capability  
- ✅ Idempotency (can run multiple times)
- ✅ Transaction safety
- ✅ Order preservation

## Need Help?

Refer to these documents:
- `MIGRATION_002_TEST_PLAN.md` - Detailed test plan
- `MIGRATION_002_GUIDE.md` - Migration guide
- `test-migration-comprehensive.js` - Test script source

## Quick Command Reference

```bash
# Simple test
node migrations/test-migration.js

# Comprehensive test
node migrations/test-migration-comprehensive.js

# Run migration
node migrations/002_migrate_lessons_to_modules.js

# Rollback migration
node migrations/002_migrate_lessons_to_modules.js --rollback

# Check database status
sudo systemctl status postgresql

# Connect to database
psql -U postgres -d lms_db
```
