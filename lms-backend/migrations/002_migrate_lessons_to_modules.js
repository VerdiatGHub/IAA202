/**
 * Migration Script: Migrate Existing Lessons to Default Modules
 * 
 * This script creates a default "General" module for each course that has
 * lessons without a module_id, then migrates those lessons to the default module.
 * 
 * Requirements: 1.1, 2.1
 * 
 * Usage:
 *   node migrations/002_migrate_lessons_to_modules.js
 * 
 * Rollback:
 *   node migrations/002_migrate_lessons_to_modules.js --rollback
 */

const { query, getClient } = require('../config/db');

/**
 * Main migration function
 * Creates default modules and migrates orphaned lessons
 */
async function migrate() {
    const client = await getClient();
    
    try {
        await client.query('BEGIN');
        
        console.log('Starting migration: Migrate lessons to default modules...');
        
        // Step 1: Find all courses that have lessons without module_id
        const coursesResult = await client.query(`
            SELECT DISTINCT course_id
            FROM lessons
            WHERE module_id IS NULL
            ORDER BY course_id
        `);
        
        const coursesWithOrphanedLessons = coursesResult.rows;
        console.log(`Found ${coursesWithOrphanedLessons.length} courses with lessons needing migration`);
        
        if (coursesWithOrphanedLessons.length === 0) {
            console.log('No lessons to migrate. Migration complete.');
            await client.query('COMMIT');
            return;
        }
        
        // Step 2: For each course, create a default "General" module
        for (const { course_id } of coursesWithOrphanedLessons) {
            console.log(`\nProcessing course: ${course_id}`);
            
            // Get course title for better logging
            const courseResult = await client.query(
                'SELECT title FROM courses WHERE id = $1',
                [course_id]
            );
            const courseTitle = courseResult.rows[0]?.title || 'Unknown Course';
            console.log(`  Course title: ${courseTitle}`);
            
            // Check if a "General" module already exists for this course
            const existingModuleResult = await client.query(
                'SELECT id FROM modules WHERE course_id = $1 AND title = $2',
                [course_id, 'General']
            );
            
            let moduleId;
            
            if (existingModuleResult.rows.length > 0) {
                // Use existing "General" module
                moduleId = existingModuleResult.rows[0].id;
                console.log(`  Using existing "General" module: ${moduleId}`);
            } else {
                // Create new "General" module with order_index 0
                const moduleResult = await client.query(`
                    INSERT INTO modules (course_id, title, description, order_index)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `,
                [
                    course_id,
                    'General',
                    'Default module for course content',
                    0
                ]);
                
                moduleId = moduleResult.rows[0].id;
                console.log(`  Created new "General" module: ${moduleId}`);
            }
            
            // Step 3: Count lessons to migrate
            const countResult = await client.query(
                'SELECT COUNT(*) as count FROM lessons WHERE course_id = $1 AND module_id IS NULL',
                [course_id]
            );
            const lessonCount = parseInt(countResult.rows[0].count);
            console.log(`  Found ${lessonCount} lessons to migrate`);
            
            // Step 4: Migrate lessons to the default module, preserving order_index
            const updateResult = await client.query(`
                UPDATE lessons
                SET module_id = $1, updated_at = NOW()
                WHERE course_id = $2 AND module_id IS NULL
            `,
            [moduleId, course_id]);
            
            console.log(`  Migrated ${updateResult.rowCount} lessons to module ${moduleId}`);
            
            // Step 5: Verify migration for this course
            const verifyResult = await client.query(
                'SELECT COUNT(*) as count FROM lessons WHERE course_id = $1 AND module_id IS NULL',
                [course_id]
            );
            const remainingOrphans = parseInt(verifyResult.rows[0].count);
            
            if (remainingOrphans > 0) {
                throw new Error(`Migration verification failed: ${remainingOrphans} lessons still without module_id for course ${course_id}`);
            }
            
            console.log(`  ✓ Verification passed: All lessons migrated successfully`);
        }
        
        // Final verification: Check that no lessons remain without module_id
        const finalCheckResult = await client.query(
            'SELECT COUNT(*) as count FROM lessons WHERE module_id IS NULL'
        );
        const totalOrphans = parseInt(finalCheckResult.rows[0].count);
        
        if (totalOrphans > 0) {
            throw new Error(`Migration failed: ${totalOrphans} lessons still without module_id`);
        }
        
        await client.query('COMMIT');
        
        console.log('\n✓ Migration completed successfully!');
        console.log(`  Total courses processed: ${coursesWithOrphanedLessons.length}`);
        console.log(`  All lessons now have module assignments`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n✗ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Rollback function
 * Removes default "General" modules and sets lesson module_id back to NULL
 * WARNING: This will orphan lessons again!
 */
async function rollback() {
    const client = await getClient();
    
    try {
        await client.query('BEGIN');
        
        console.log('Starting rollback: Remove default modules and orphan lessons...');
        
        // Step 1: Find all "General" modules
        const modulesResult = await client.query(`
            SELECT id, course_id
            FROM modules
            WHERE title = 'General' AND description = 'Default module for course content'
            ORDER BY course_id
        `);
        
        const defaultModules = modulesResult.rows;
        console.log(`Found ${defaultModules.length} default "General" modules to remove`);
        
        if (defaultModules.length === 0) {
            console.log('No default modules to rollback. Rollback complete.');
            await client.query('COMMIT');
            return;
        }
        
        // Step 2: For each default module, orphan its lessons and delete the module
        for (const { id, course_id } of defaultModules) {
            console.log(`\nProcessing module: ${id} (course: ${course_id})`);
            
            // Count lessons in this module
            const countResult = await client.query(
                'SELECT COUNT(*) as count FROM lessons WHERE module_id = $1',
                [id]
            );
            const lessonCount = parseInt(countResult.rows[0].count);
            console.log(`  Found ${lessonCount} lessons in this module`);
            
            // Set module_id to NULL for all lessons in this module
            const updateResult = await client.query(`
                UPDATE lessons
                SET module_id = NULL, updated_at = NOW()
                WHERE module_id = $1
            `,
            [id]);
            
            console.log(`  Orphaned ${updateResult.rowCount} lessons`);
            
            // Delete the default module
            const deleteResult = await client.query(
                'DELETE FROM modules WHERE id = $1',
                [id]
            );
            
            if (deleteResult.rowCount > 0) {
                console.log(`  ✓ Deleted module ${id}`);
            } else {
                console.log(`  ⚠ Module ${id} was not found (may have been deleted already)`);
            }
        }
        
        await client.query('COMMIT');
        
        console.log('\n✓ Rollback completed successfully!');
        console.log(`  Total modules removed: ${defaultModules.length}`);
        console.log(`  Lessons have been orphaned (module_id set to NULL)`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n✗ Rollback failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const isRollback = args.includes('--rollback');
    
    try {
        if (isRollback) {
            console.log('='.repeat(60));
            console.log('ROLLBACK MODE: Removing default modules');
            console.log('='.repeat(60));
            await rollback();
        } else {
            console.log('='.repeat(60));
            console.log('MIGRATION: Migrate lessons to default modules');
            console.log('='.repeat(60));
            await migrate();
        }
        
        console.log('\nDone!');
        process.exit(0);
    } catch (error) {
        console.error('\nFatal error:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { migrate, rollback };
