# Migration 002 Test Plan

## Overview

This document provides a comprehensive test plan for Migration 002 (migrate lessons to default modules). Since the database runs on the Ubuntu VM, these tests should be executed on the server.

**Requirements Validated**: 1.1, 2.1

## Test Environment

- **Server**: Ubuntu Server 22.04
- **Database**: PostgreSQL (lms_db)
- **Location**: VM (not Windows host)

## Pre-Test Checklist

- [ ] Database is running and accessible
- [ ] Migration 001 (schema changes) has been applied
- [ ] Backend code has been pulled from GitHub
- [ ] Node.js dependencies are installed (`npm install`)
- [ ] Database backup has been created (recommended)

## Test Execution Steps

### Step 1: Pre-Migration Analysis

Run the analysis script to understand the current state:

```bash
cd ~/IAA202/lms-backend
node migrations/test-migration.js
```

**Expected Output:**
- Number of lessons without module_id
- Number of existing modules
- Sample orphaned lessons

**Record Results:**
- Orphaned lessons count: _______
- Courses affected: _______
- Existing modules: _______

### Step 2: Run Comprehensive Test

Execute the comprehensive test script:

```bash
cd ~/IAA202/lms-backend
node migrations/test-migration-comprehensive.js
```

This script will:
1. Analyze pre-migration state
2. Create sample data if needed
3. Run the migration
4. Verify data integrity
5. Test rollback capability
6. Re-run migration
7. Perform final verification

**Expected Results:**
- ✓ Initial migration data integrity
- ✓ Rollback functionality
- ✓ Re-migration after rollback

### Step 3: Manual Verification Queries

After the migration completes, run these SQL queries to verify:

#### Query 1: Check for Orphaned Lessons
```sql
SELECT COUNT(*) as orphaned_lessons
FROM lessons
WHERE module_id IS NULL;
```
**Expected Result**: 0 rows

#### Query 2: View Created Modules
```sql
SELECT 
    m.id,
    m.title,
    m.description,
    m.order_index,
    c.title as course_title,
    COUNT(l.id) as lesson_count
FROM modules m
JOIN courses c ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
WHERE m.title = 'General'
GROUP BY m.id, m.title, m.description, m.order_index, c.title
ORDER BY c.title;
```
**Expected Result**: One "General" module per course with orphaned lessons

#### Query 3: Verify Lesson Order Preservation
```sql
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
**Expected Result**: Lessons maintain their original order_index values

#### Query 4: Verify Module References
```sql
SELECT COUNT(*) as invalid_references
FROM lessons l
LEFT JOIN modules m ON l.module_id = m.id
WHERE l.module_id IS NOT NULL AND m.id IS NULL;
```
**Expected Result**: 0 invalid references

#### Query 5: Check Module Order Index
```sql
SELECT 
    m.id,
    m.title,
    m.order_index,
    c.title as course_title
FROM modules m
JOIN courses c ON m.course_id = c.id
WHERE m.title = 'General'
ORDER BY c.title;
```
**Expected Result**: All "General" modules have order_index = 0

## Test Cases

### Test Case 1: Sample Data Creation and Migration

**Objective**: Verify migration works with fresh sample data

**Steps**:
1. Run comprehensive test script
2. Script creates sample course with 5 lessons
3. Migration executes
4. Verify all 5 lessons are assigned to "General" module

**Pass Criteria**:
- All 5 lessons have module_id assigned
- "General" module created with order_index = 0
- Lesson order preserved (1, 2, 3, 4, 5)

### Test Case 2: Data Integrity Verification

**Objective**: Ensure no data loss or corruption

**Steps**:
1. Count total lessons before migration
2. Run migration
3. Count total lessons after migration
4. Verify all lesson data (title, content, order_index) unchanged

**Pass Criteria**:
- Lesson count unchanged
- All lesson data preserved
- No NULL module_id values remain

### Test Case 3: Rollback Capability

**Objective**: Verify migration can be safely rolled back

**Steps**:
1. Run migration
2. Record state (module count, lesson assignments)
3. Run rollback: `node migrations/002_migrate_lessons_to_modules.js --rollback`
4. Verify state restored to pre-migration

**Pass Criteria**:
- "General" modules deleted
- Lessons have module_id = NULL again
- No data loss during rollback

### Test Case 4: Idempotency

**Objective**: Verify migration can be run multiple times safely

**Steps**:
1. Run migration first time
2. Record created module IDs
3. Run migration second time
4. Verify no duplicate modules created

**Pass Criteria**:
- Second run uses existing "General" modules
- No duplicate modules created
- All lessons still properly assigned

### Test Case 5: Multiple Courses

**Objective**: Verify migration handles multiple courses correctly

**Steps**:
1. Ensure database has multiple courses with lessons
2. Run migration
3. Verify each course gets its own "General" module

**Pass Criteria**:
- One "General" module per course
- Lessons assigned to correct course's module
- No cross-course contamination

### Test Case 6: Edge Cases

**Objective**: Test edge cases and boundary conditions

**Test 6a: Empty Course**
- Course with no lessons
- Expected: No module created

**Test 6b: Course with Existing Modules**
- Course already has modules
- Expected: "General" module created only if orphaned lessons exist

**Test 6c: Large Dataset**
- Course with 100+ lessons
- Expected: All lessons migrated successfully

## Verification Checklist

After running all tests, verify:

- [ ] No orphaned lessons (module_id IS NULL)
- [ ] All "General" modules have order_index = 0
- [ ] Lesson order_index values preserved
- [ ] No invalid module references
- [ ] Migration can be rolled back successfully
- [ ] Migration is idempotent (can run multiple times)
- [ ] Transaction rollback works on errors
- [ ] Console output is clear and informative

## Performance Metrics

Record the following metrics:

- Migration execution time: _______ seconds
- Number of courses processed: _______
- Number of lessons migrated: _______
- Number of modules created: _______

**Expected Performance**:
- < 1 second per 100 lessons
- Transaction-based (all or nothing)
- No database locks or deadlocks

## Error Scenarios

### Scenario 1: Database Connection Failure

**Trigger**: Stop database during migration

**Expected Behavior**:
- Migration fails with clear error message
- Transaction rolls back
- No partial updates

### Scenario 2: Invalid Foreign Key

**Trigger**: Manually create lesson with invalid course_id

**Expected Behavior**:
- Migration skips invalid lessons
- Logs warning
- Continues with valid lessons

### Scenario 3: Concurrent Execution

**Trigger**: Run migration twice simultaneously

**Expected Behavior**:
- One succeeds, one may fail
- No data corruption
- Database constraints prevent duplicates

## Rollback Testing

### Rollback Test 1: Immediate Rollback

**Steps**:
1. Run migration
2. Immediately run rollback
3. Verify state restored

**Pass Criteria**:
- All "General" modules removed
- Lessons orphaned again
- No data loss

### Rollback Test 2: Rollback After Data Changes

**Steps**:
1. Run migration
2. Add new lesson to "General" module
3. Run rollback
4. Verify new lesson also orphaned

**Pass Criteria**:
- All lessons in "General" modules orphaned
- Modules deleted
- New lessons also handled

## Post-Test Actions

After successful testing:

1. [ ] Document any issues found
2. [ ] Verify application still works correctly
3. [ ] Test frontend course content display
4. [ ] Create database backup
5. [ ] Update deployment documentation

## Troubleshooting

### Issue: Migration Fails with "Module not found"

**Solution**: Verify Migration 001 was applied successfully

### Issue: Some Lessons Still Have NULL module_id

**Solution**: 
1. Check transaction logs
2. Verify no database errors
3. Re-run migration (it's idempotent)

### Issue: Rollback Doesn't Restore State

**Solution**:
1. Check if "General" modules were manually modified
2. Verify module description matches exactly
3. Check database logs for errors

## Success Criteria

The migration test is considered successful when:

1. ✅ All orphaned lessons assigned to modules
2. ✅ One "General" module per course with orphaned lessons
3. ✅ Lesson order preserved
4. ✅ No data loss or corruption
5. ✅ Rollback works correctly
6. ✅ Migration is idempotent
7. ✅ All verification queries pass
8. ✅ Application functions correctly after migration

## Test Results

**Date**: _______________
**Tester**: _______________
**Environment**: Production / Staging / Development

**Overall Result**: PASS / FAIL

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Issues Found**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Recommendations**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
