# End-to-End Integration Tests

## Overview

This directory contains end-to-end integration tests for the Course Content Management System. These tests validate complete workflows across modules, lessons, and content items.

## Test File: `course-content.e2e.test.js`

### Test Coverage

The integration tests cover the following scenarios:

#### 1. Complete Flow: Create Module → Add Lesson → Add Content
- **Step 1**: Create a new module
- **Step 2**: Add a lesson to the module
- **Step 3**: Add video content to the lesson
- **Step 4**: Add text content to the lesson
- **Step 5**: Add resource content to the lesson
- **Step 6**: Verify complete hierarchy

**Validates**: Requirements 1.1, 2.1, 3.1, 4.1, 7.1, 14.1

#### 2. Reordering Across All Levels
- Reorder modules (reverse order)
- Reorder lessons within module (reverse order)
- Reorder content items within lesson (reverse order)
- Verify reordering persists across requests
- Reorder with mixed positions

**Validates**: Requirements 8.1, 8.2, 8.4, 14.2

#### 3. Preview Mode - Data Retrieval for Student View
- Retrieve module with all nested data for preview
- Verify required/optional indicators are present
- Verify content type information is available
- Verify content is sorted by orderIndex

**Validates**: Requirements 11.1, 11.2, 11.3, 11.4, 15.1, 15.2, 15.3, 15.4, 15.5

#### 4. Student View - Read-Only Access
- Student can retrieve course modules
- Student can retrieve specific module with lessons
- Student can retrieve lesson content items
- Student cannot create modules
- Student cannot create lessons
- Student cannot create content items
- Student cannot update modules
- Student cannot delete modules
- Student cannot reorder modules

**Validates**: Requirements 12.5, 15.1, 15.2, 15.3

#### 5. Complex Hierarchy Management
- Create and manage a complex course structure (3 modules, 2 lessons each, multiple content types)
- Delete module cascades to lessons and content

**Validates**: Requirements 1.3, 2.3, Property 3 (Cascading Deletion)

#### 6. Data Integrity and Validation
- Reject invalid video URL format
- Reject invalid resource URL format
- Preserve rich text formatting in text content
- Enforce required fields for module creation
- Enforce required fields for lesson creation
- Enforce required fields for content item creation

**Validates**: Requirements 3.5, 4.4, 7.4, Property 8 (URL Validation), Property 9 (Rich Text Preservation)

#### 7. Order Index Consistency
- New modules get sequential order indices
- No duplicate order indices after reordering

**Validates**: Requirements 1.4, 2.4, 8.5, 14.1, Property 4 (Order Assignment), Property 5 (Reordering Updates)

## Running the Tests

### Prerequisites

1. **Database Connection**: Tests require a PostgreSQL database connection
2. **Environment Variables**: Ensure `.env` file is configured with database credentials
3. **Database Schema**: Run migrations before testing

### Run All Integration Tests

```bash
npm test -- __tests__/integration/
```

### Run Specific Test File

```bash
npm test -- __tests__/integration/course-content.e2e.test.js
```

### Run with Verbose Output

```bash
npm test -- __tests__/integration/course-content.e2e.test.js --verbose
```

## Test Structure

Each test suite follows this pattern:

1. **Setup** (`beforeAll`): Create test users, courses, and initial data
2. **Test Execution**: Run specific test scenarios
3. **Assertions**: Verify expected behavior
4. **Cleanup** (`afterAll`): Remove test data and close database connections

## Database Requirements

The tests require the following database tables:
- `users`
- `courses`
- `modules`
- `lessons`
- `content_items`

All tables must have proper foreign key relationships and cascading delete rules.

## Test Data

Tests create isolated test data with unique identifiers to avoid conflicts:
- Test users: `e2e-instructor@test.com`, `e2e-student@test.com`
- Test courses: `E2E Test Course`
- Test modules: Various titles with unique identifiers
- Test lessons: Various titles with unique identifiers
- Test content items: Various types (video, text, resource)

## Expected Results

When the database is properly configured and accessible:
- **34 tests** should pass
- **0 tests** should fail
- All test suites should complete successfully

## Troubleshooting

### Database Connection Errors

If you see `ECONNREFUSED` errors:
1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists and migrations are applied
4. Verify network connectivity to database server

### Test Failures

If tests fail:
1. Check that all migrations have been applied
2. Verify API routes are properly configured
3. Ensure authentication middleware is working
4. Check that all required tables exist

## Notes for VM Deployment

Since the database runs on a VM (Ubuntu Server 22.04):

1. **Push code to GitHub** after making changes
2. **Pull on VM** and deploy using:
   ```bash
   cd ~/IAA202 && git pull && \
   cp -r lms-backend/* /var/www/lms/backend/ && \
   cd /var/www/lms/backend && npm install && \
   cp -r ~/IAA202/lms-frontend/* /var/www/lms/frontend/ && \
   cd /var/www/lms/frontend && npm install && npm run build && \
   pm2 restart lms-api
   ```
3. **Run tests on VM** where database is accessible

## Integration with CI/CD

These tests are suitable for:
- Pre-deployment validation
- Continuous integration pipelines
- Regression testing
- System verification after updates

## Maintenance

When adding new features:
1. Add corresponding integration tests
2. Update this README with new test scenarios
3. Ensure tests cover all requirements
4. Verify tests pass before merging code
