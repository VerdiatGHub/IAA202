# Migration 002 Verification Checklist

**Date**: _______________  
**Tester**: _______________  
**Environment**: Production / Staging / Development  

## Pre-Migration State

- [ ] Database backup created
- [ ] Migration 001 (schema) confirmed applied
- [ ] Backend code updated from GitHub
- [ ] Dependencies installed (`npm install`)

**Pre-Migration Metrics**:
- Orphaned lessons count: _______
- Courses with orphaned lessons: _______
- Existing modules count: _______

## Test Execution

### Test 1: Simple Migration Test

**Command**: `node migrations/test-migration.js`

- [ ] Script executed without errors
- [ ] Migration completed successfully
- [ ] Verification passed

**Output Summary**:
```
Orphaned lessons before: _______
Orphaned lessons after: _______
Modules created: _______
```

### Test 2: Comprehensive Test Suite

**Command**: `node migrations/test-migration-comprehensive.js`

- [ ] Pre-migration analysis completed
- [ ] Sample data created (if needed)
- [ ] Migration executed successfully
- [ ] Data integrity checks passed (5/5)
- [ ] Rollback test passed
- [ ] Re-migration test passed
- [ ] Final verification passed

**Test Results**:
- [ ] ✓ Initial migration data integrity
- [ ] ✓ Rollback functionality
- [ ] ✓ Re-migration after rollback

**Execution Time**: _______ seconds

## Data Integrity Verification

### Check 1: No Orphaned Lessons

**Query**: 
```sql
SELECT COUNT(*) as count FROM lessons WHERE module_id IS NULL;
```

**Result**: _______ (Expected: 0)

- [ ] PASS (0 orphaned lessons)
- [ ] FAIL (orphaned lessons remain)

### Check 2: General Modules Created

**Query**:
```sql
SELECT COUNT(*) as count FROM modules WHERE title = 'General';
```

**Result**: _______ 

- [ ] PASS (matches number of courses with orphaned lessons)
- [ ] FAIL (incorrect count)

### Check 3: Lesson Order Preserved

**Query**:
```sql
SELECT l.id, l.title, l.order_index, m.title as module
FROM lessons l
JOIN modules m ON l.module_id = m.id
ORDER BY l.course_id, l.order_index
LIMIT 10;
```

**Sample Results**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

- [ ] PASS (order_index values preserved)
- [ ] FAIL (order changed)

### Check 4: Valid Module References

**Query**:
```sql
SELECT COUNT(*) as count
FROM lessons l
LEFT JOIN modules m ON l.module_id = m.id
WHERE l.module_id IS NOT NULL AND m.id IS NULL;
```

**Result**: _______ (Expected: 0)

- [ ] PASS (all references valid)
- [ ] FAIL (invalid references found)

### Check 5: Module Order Index

**Query**:
```sql
SELECT id, title, order_index FROM modules WHERE title = 'General';
```

**Results**:
```
_________________________________________________________________
_________________________________________________________________
```

- [ ] PASS (all have order_index = 0)
- [ ] FAIL (incorrect order_index)

## Rollback Testing

### Rollback Test

**Command**: `node migrations/002_migrate_lessons_to_modules.js --rollback`

- [ ] Rollback executed successfully
- [ ] "General" modules removed
- [ ] Lessons orphaned again (module_id = NULL)
- [ ] No data loss

**Orphaned lessons after rollback**: _______ (should match pre-migration count)

### Re-Migration Test

**Command**: `node migrations/002_migrate_lessons_to_modules.js`

- [ ] Re-migration successful
- [ ] All lessons assigned to modules again
- [ ] Same results as initial migration

## Idempotency Test

**Test**: Run migration twice

**Command**: 
```bash
node migrations/002_migrate_lessons_to_modules.js
node migrations/002_migrate_lessons_to_modules.js
```

- [ ] Second run completed without errors
- [ ] No duplicate modules created
- [ ] Message: "No lessons to migrate" or uses existing modules

## Edge Cases

### Edge Case 1: Empty Course

**Test**: Course with no lessons

- [ ] No module created for empty course
- [ ] No errors

### Edge Case 2: Course with Existing Modules

**Test**: Course already has modules

- [ ] "General" module created only if orphaned lessons exist
- [ ] Existing modules not affected

### Edge Case 3: Large Dataset

**Test**: Course with many lessons (if available)

- [ ] All lessons migrated successfully
- [ ] Performance acceptable (< 1 sec per 100 lessons)

## Application Testing

### Frontend Verification

- [ ] Course content page loads
- [ ] Modules display correctly
- [ ] Lessons display under "General" module
- [ ] Lesson order correct
- [ ] No console errors

**URL Tested**: _______________________________

### API Verification

**Test**: GET /api/courses/:courseId/modules

- [ ] Returns "General" modules
- [ ] Includes lesson count
- [ ] Response format correct

**Sample Response**:
```json
_________________________________________________________________
_________________________________________________________________
```

## Performance Metrics

- Migration execution time: _______ seconds
- Courses processed: _______
- Lessons migrated: _______
- Modules created: _______
- Database size before: _______ MB
- Database size after: _______ MB

## Error Handling

### Test: Database Connection Failure

- [ ] Clear error message displayed
- [ ] Transaction rolled back
- [ ] No partial updates

### Test: Invalid Data

- [ ] Invalid lessons skipped or handled
- [ ] Migration continues
- [ ] Errors logged

## Console Output Quality

- [ ] Clear progress messages
- [ ] Informative logging
- [ ] Success/failure clearly indicated
- [ ] No confusing error messages

## Documentation Review

- [ ] MIGRATION_002_GUIDE.md is accurate
- [ ] RUN_MIGRATION_TESTS.md is clear
- [ ] MIGRATION_002_TEST_PLAN.md is comprehensive
- [ ] Code comments are helpful

## Final Verification

### Database State

- [ ] All lessons have module_id
- [ ] All module references are valid
- [ ] Lesson order preserved
- [ ] No data corruption

### Application State

- [ ] Frontend displays content correctly
- [ ] API endpoints work
- [ ] No errors in logs
- [ ] User experience unchanged (except improved organization)

### Code Quality

- [ ] Migration script is well-documented
- [ ] Error handling is robust
- [ ] Transaction management is correct
- [ ] Logging is appropriate

## Overall Assessment

**Migration Status**: PASS / FAIL

**Confidence Level**: High / Medium / Low

**Ready for Production**: YES / NO

## Issues Found

**Issue 1**:
- Description: _________________________________________________
- Severity: Critical / High / Medium / Low
- Status: Resolved / Open
- Resolution: _______________________________________________

**Issue 2**:
- Description: _________________________________________________
- Severity: Critical / High / Medium / Low
- Status: Resolved / Open
- Resolution: _______________________________________________

**Issue 3**:
- Description: _________________________________________________
- Severity: Critical / High / Medium / Low
- Status: Resolved / Open
- Resolution: _______________________________________________

## Recommendations

**Recommendation 1**: _________________________________________
_________________________________________________________________

**Recommendation 2**: _________________________________________
_________________________________________________________________

**Recommendation 3**: _________________________________________
_________________________________________________________________

## Sign-Off

**Tested By**: _______________  
**Signature**: _______________  
**Date**: _______________

**Reviewed By**: _______________  
**Signature**: _______________  
**Date**: _______________

**Approved for Production**: YES / NO  
**Approver**: _______________  
**Date**: _______________

## Notes

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
