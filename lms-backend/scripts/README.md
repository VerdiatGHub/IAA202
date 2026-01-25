# LMS Backend Scripts

This directory contains utility scripts for the LMS backend system.

## Available Scripts

### generate-large-dataset.js

Generates large test datasets for performance and stress testing of the Course Content Management System.

#### Purpose

This script creates realistic test data to validate system performance with:
- 100+ modules per course
- 5-10 lessons per module
- 3-5 content items per lesson
- Mixed content types (video, text, quiz, assignment, resource)
- Mixed required/optional content

#### Prerequisites

1. PostgreSQL database running
2. Database schema created (migrations applied)
3. At least one course exists in the database
4. Node.js and npm installed

#### Environment Variables

Set these environment variables or use defaults:

```bash
DB_HOST=localhost      # Default: localhost
DB_PORT=5432          # Default: 5432
DB_NAME=lms_db        # Default: lms_db
DB_USER=postgres      # Default: postgres
DB_PASSWORD=password  # Default: password
```

#### Usage

**Generate test data:**

```bash
# Generate 100 modules (default)
node scripts/generate-large-dataset.js <courseId>

# Generate custom number of modules
node scripts/generate-large-dataset.js <courseId> <moduleCount>

# Example: Generate 150 modules
node scripts/generate-large-dataset.js 550e8400-e29b-41d4-a716-446655440000 150
```

**Cleanup test data:**

```bash
# Remove all generated test data for a course
node scripts/generate-large-dataset.js <courseId> --cleanup
```

#### Examples

1. **Generate test data for performance testing:**
   ```bash
   # First, get a course ID from your database
   psql -d lms_db -c "SELECT id, title FROM courses LIMIT 1;"
   
   # Generate 100 modules with lessons and content
   node scripts/generate-large-dataset.js 550e8400-e29b-41d4-a716-446655440000
   ```

2. **Generate large dataset for stress testing:**
   ```bash
   # Generate 200 modules (will create ~1500 lessons and ~6000 content items)
   node scripts/generate-large-dataset.js 550e8400-e29b-41d4-a716-446655440000 200
   ```

3. **Cleanup after testing:**
   ```bash
   # Remove all test data
   node scripts/generate-large-dataset.js 550e8400-e29b-41d4-a716-446655440000 --cleanup
   ```

#### Output

The script provides progress updates and a summary:

```
Starting large dataset generation for course 550e8400-e29b-41d4-a716-446655440000
Target: 100 modules
Progress: 10/100 modules created
Progress: 20/100 modules created
...
Progress: 100/100 modules created

✅ Dataset generation complete!
   Modules: 100
   Lessons: 750
   Content Items: 3000
   Total Records: 3850
```

#### Generated Data Structure

Each module contains:
- Unique UUID
- Title: "Module N: [Topic]"
- Description
- Order index (0-based)

Each lesson contains:
- Unique UUID
- Title: "Lesson N: [Topic]"
- Content (optional)
- Video URL (optional, 50% chance)
- Duration (10-60 minutes)
- Required/Optional status (random)
- Order index (0-based)

Each content item contains:
- Unique UUID
- Content type (video, text, quiz, assignment, or resource)
- Title
- Description
- Type-specific fields:
  - **Video**: URL, duration
  - **Text**: Rich text content
  - **Quiz**: Quiz ID (null in generated data)
  - **Assignment**: Assignment ID (null in generated data)
  - **Resource**: Type (file/link), URL
- Required/Optional status (random)
- Order index (0-based)

#### Performance Considerations

- **100 modules**: ~750 lessons, ~3000 content items (~5 seconds)
- **150 modules**: ~1125 lessons, ~4500 content items (~8 seconds)
- **200 modules**: ~1500 lessons, ~6000 content items (~12 seconds)

Generation time depends on database performance and network latency.

#### Database Impact

The script uses transactions to ensure data consistency:
- All inserts are wrapped in a single transaction
- If any error occurs, all changes are rolled back
- No partial data is left in the database

#### Troubleshooting

**Error: Course with ID not found**
- Verify the course ID exists in the database
- Check the UUID format is correct

**Error: Connection refused**
- Verify PostgreSQL is running
- Check database connection settings
- Verify environment variables

**Error: Permission denied**
- Verify database user has INSERT permissions
- Check database user credentials

**Error: Foreign key constraint violation**
- Verify database schema is up to date
- Run migrations if needed

#### Testing Workflow

1. **Setup:**
   ```bash
   # Create a test course or use existing one
   # Get the course ID
   ```

2. **Generate data:**
   ```bash
   node scripts/generate-large-dataset.js <courseId> 100
   ```

3. **Test application:**
   - Navigate to course Lessons tab
   - Test scrolling performance
   - Test reordering operations
   - Test CRUD operations
   - Monitor browser performance

4. **Cleanup:**
   ```bash
   node scripts/generate-large-dataset.js <courseId> --cleanup
   ```

#### Integration with Manual Testing

This script supports Task 20.2 (Manual Testing Checklist) by providing:
- Large datasets for performance testing
- Realistic data for UI testing
- Stress test scenarios
- Edge case validation

Refer to `.kiro/specs/course-content-management/task-20.2-manual-testing-checklist.md` for complete testing procedures.

## Future Scripts

Additional scripts may be added for:
- Database backup and restore
- Data migration utilities
- Performance benchmarking
- Automated testing data setup

## Contributing

When adding new scripts:
1. Add comprehensive documentation
2. Include usage examples
3. Handle errors gracefully
4. Provide progress feedback
5. Update this README
