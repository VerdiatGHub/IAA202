/**
 * Comprehensive Test Script for Migration 002
 * 
 * This script performs thorough testing of the migration including:
 * 1. Pre-migration state analysis
 * 2. Sample data creation (if needed)
 * 3. Migration execution
 * 4. Data integrity verification
 * 5. Rollback testing
 * 
 * Requirements: 1.1, 2.1
 * 
 * Usage: node migrations/test-migration-comprehensive.js
 */

const { query, getClient } = require('../config/db');
const { migrate, rollback } = require('./002_migrate_lessons_to_modules');

/**
 * Create sample test data for migration testing
 */
async function createSampleData() {
    const client = await getClient();
    
    try {
        await client.query('BEGIN');
        
        console.log('\n📝 Creating sample test data...');
        
        // Create a test course
        const courseResult = await client.query(`
            INSERT INTO courses (title, description, level, instructor_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [
            'Test Course for Migration',
            'This course is used to test the migration script',
            'beginner',
            (await client.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['instructor'])).rows[0]?.id || '00000000-0000-0000-0000-000000000001'
        ]);
        
        const courseId = courseResult.rows[0].id;
        console.log(`   ✓ Created test course: ${courseId}`);
        
        // Create sample lessons without module_id
        const lessonTitles = [
            'Introduction to the Course',
            'Getting Started',
            'Basic Concepts',
            'Advanced Topics',
            'Final Project'
        ];
        
        for (let i = 0; i < lessonTitles.length; i++) {
            await client.query(`
                INSERT INTO lessons (course_id, title, content, order_index)
                VALUES ($1, $2, $3, $4)
            `, [
                courseId,
                lessonTitles[i],
                `Content for ${lessonTitles[i]}`,
                i + 1
            ]);
        }
        
        console.log(`   ✓ Created ${lessonTitles.length} test lessons`);
        
        await client.query('COMMIT');
        
        return courseId;
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('   ✗ Failed to create sample data:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Analyze pre-migration state
 */
async function analyzePreMigrationState() {
    console.log('\n📊 Analyzing pre-migration state...');
    
    // Count orphaned lessons
    const orphanedResult = await query(`
        SELECT COUNT(*) as count 
        FROM lessons 
        WHERE module_id IS NULL
    `);
    const orphanedCount = parseInt(orphanedResult.rows[0].count);
    console.log(`   Lessons without module_id: ${orphanedCount}`);
    
    // Count courses with orphaned lessons
    const coursesResult = await query(`
        SELECT COUNT(DISTINCT course_id) as count
        FROM lessons
        WHERE module_id IS NULL
    `);
    const coursesCount = parseInt(coursesResult.rows[0].count);
    console.log(`   Courses with orphaned lessons: ${coursesCount}`);
    
    // Count existing modules
    const modulesResult = await query('SELECT COUNT(*) as count FROM modules');
    const modulesCount = parseInt(modulesResult.rows[0].count);
    console.log(`   Existing modules: ${modulesCount}`);
    
    // Show sample orphaned lessons
    if (orphanedCount > 0) {
        const sampleResult = await query(`
            SELECT 
                l.id, 
                l.course_id, 
                l.title, 
                l.order_index,
                c.title as course_title
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.module_id IS NULL
            ORDER BY l.course_id, l.order_index
            LIMIT 5
        `);
        
        console.log('\n   Sample orphaned lessons:');
        sampleResult.rows.forEach(lesson => {
            console.log(`   - [${lesson.order_index}] ${lesson.title} (Course: ${lesson.course_title})`);
        });
    }
    
    return {
        orphanedCount,
        coursesCount,
        modulesCount
    };
}

/**
 * Verify data integrity after migration
 */
async function verifyDataIntegrity(preMigrationState) {
    console.log('\n🔍 Verifying data integrity...');
    
    let allChecksPass = true;
    
    // Check 1: No orphaned lessons
    const orphanedResult = await query(`
        SELECT COUNT(*) as count 
        FROM lessons 
        WHERE module_id IS NULL
    `);
    const orphanedCount = parseInt(orphanedResult.rows[0].count);
    
    if (orphanedCount === 0) {
        console.log('   ✓ Check 1: No orphaned lessons remain');
    } else {
        console.log(`   ✗ Check 1 FAILED: ${orphanedCount} lessons still without module_id`);
        allChecksPass = false;
    }
    
    // Check 2: All courses have "General" module
    const generalModulesResult = await query(`
        SELECT 
            m.id,
            m.course_id,
            c.title as course_title,
            COUNT(l.id) as lesson_count
        FROM modules m
        JOIN courses c ON m.course_id = c.id
        LEFT JOIN lessons l ON l.module_id = m.id
        WHERE m.title = 'General'
        GROUP BY m.id, m.course_id, c.title
        ORDER BY c.title
    `);
    
    if (generalModulesResult.rows.length === preMigrationState.coursesCount) {
        console.log(`   ✓ Check 2: Created ${generalModulesResult.rows.length} "General" modules`);
        
        // Show details
        generalModulesResult.rows.forEach(module => {
            console.log(`      - ${module.course_title}: ${module.lesson_count} lessons`);
        });
    } else {
        console.log(`   ✗ Check 2 FAILED: Expected ${preMigrationState.coursesCount} modules, found ${generalModulesResult.rows.length}`);
        allChecksPass = false;
    }
    
    // Check 3: Lesson order preserved
    const orderCheckResult = await query(`
        SELECT 
            l.id,
            l.title,
            l.order_index,
            l.module_id,
            m.title as module_title
        FROM lessons l
        LEFT JOIN modules m ON l.module_id = m.id
        ORDER BY l.course_id, l.order_index
    `);
    
    let orderPreserved = true;
    let prevOrderIndex = 0;
    let prevCourseId = null;
    
    for (const lesson of orderCheckResult.rows) {
        // Reset for new course
        if (lesson.course_id !== prevCourseId) {
            prevOrderIndex = 0;
            prevCourseId = lesson.course_id;
        }
        
        // Check order is sequential (allowing gaps)
        if (lesson.order_index < prevOrderIndex) {
            orderPreserved = false;
            break;
        }
        prevOrderIndex = lesson.order_index;
    }
    
    if (orderPreserved) {
        console.log('   ✓ Check 3: Lesson order preserved');
    } else {
        console.log('   ✗ Check 3 FAILED: Lesson order not preserved');
        allChecksPass = false;
    }
    
    // Check 4: All lessons have valid module references
    const invalidRefsResult = await query(`
        SELECT COUNT(*) as count
        FROM lessons l
        LEFT JOIN modules m ON l.module_id = m.id
        WHERE l.module_id IS NOT NULL AND m.id IS NULL
    `);
    const invalidRefs = parseInt(invalidRefsResult.rows[0].count);
    
    if (invalidRefs === 0) {
        console.log('   ✓ Check 4: All module references are valid');
    } else {
        console.log(`   ✗ Check 4 FAILED: ${invalidRefs} lessons have invalid module_id`);
        allChecksPass = false;
    }
    
    // Check 5: Module order_index is correct
    const moduleOrderResult = await query(`
        SELECT 
            m.id,
            m.title,
            m.order_index,
            m.course_id
        FROM modules m
        WHERE m.title = 'General'
        ORDER BY m.course_id
    `);
    
    let moduleOrderCorrect = true;
    for (const module of moduleOrderResult.rows) {
        if (module.order_index !== 0) {
            moduleOrderCorrect = false;
            console.log(`      ⚠ Module ${module.id} has order_index ${module.order_index}, expected 0`);
        }
    }
    
    if (moduleOrderCorrect) {
        console.log('   ✓ Check 5: Module order_index is correct (0 for all "General" modules)');
    } else {
        console.log('   ✗ Check 5 FAILED: Some modules have incorrect order_index');
        allChecksPass = false;
    }
    
    return allChecksPass;
}

/**
 * Test rollback functionality
 */
async function testRollback(preMigrationState) {
    console.log('\n🔄 Testing rollback functionality...');
    
    try {
        // Execute rollback
        await rollback();
        
        // Verify rollback
        const orphanedResult = await query(`
            SELECT COUNT(*) as count 
            FROM lessons 
            WHERE module_id IS NULL
        `);
        const orphanedCount = parseInt(orphanedResult.rows[0].count);
        
        const generalModulesResult = await query(`
            SELECT COUNT(*) as count
            FROM modules
            WHERE title = 'General' AND description = 'Default module for course content'
        `);
        const generalModulesCount = parseInt(generalModulesResult.rows[0].count);
        
        if (orphanedCount === preMigrationState.orphanedCount && generalModulesCount === 0) {
            console.log('   ✓ Rollback successful: State restored to pre-migration');
            console.log(`      - Orphaned lessons: ${orphanedCount}`);
            console.log(`      - "General" modules: ${generalModulesCount}`);
            return true;
        } else {
            console.log('   ✗ Rollback verification failed:');
            console.log(`      - Expected ${preMigrationState.orphanedCount} orphaned lessons, found ${orphanedCount}`);
            console.log(`      - Expected 0 "General" modules, found ${generalModulesCount}`);
            return false;
        }
        
    } catch (error) {
        console.error('   ✗ Rollback failed:', error.message);
        return false;
    }
}

/**
 * Clean up test data
 */
async function cleanupTestData(courseId) {
    if (!courseId) return;
    
    const client = await getClient();
    
    try {
        await client.query('BEGIN');
        
        console.log('\n🧹 Cleaning up test data...');
        
        // Delete test course (cascades to lessons and modules)
        await client.query('DELETE FROM courses WHERE id = $1', [courseId]);
        
        console.log('   ✓ Test data cleaned up');
        
        await client.query('COMMIT');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('   ✗ Cleanup failed:', error.message);
    } finally {
        client.release();
    }
}

/**
 * Main test execution
 */
async function main() {
    let testCourseId = null;
    let preMigrationState = null;
    
    try {
        console.log('='.repeat(70));
        console.log('COMPREHENSIVE MIGRATION TEST: 002_migrate_lessons_to_modules');
        console.log('='.repeat(70));
        
        // Step 1: Analyze current state
        preMigrationState = await analyzePreMigrationState();
        
        // Step 2: Create sample data if no orphaned lessons exist
        if (preMigrationState.orphanedCount === 0) {
            console.log('\n⚠️  No orphaned lessons found. Creating sample data for testing...');
            testCourseId = await createSampleData();
            
            // Re-analyze state
            preMigrationState = await analyzePreMigrationState();
        }
        
        // Step 3: Run migration
        console.log('\n' + '='.repeat(70));
        console.log('RUNNING MIGRATION');
        console.log('='.repeat(70));
        await migrate();
        
        // Step 4: Verify data integrity
        console.log('\n' + '='.repeat(70));
        console.log('VERIFICATION');
        console.log('='.repeat(70));
        const integrityCheckPassed = await verifyDataIntegrity(preMigrationState);
        
        // Step 5: Test rollback
        console.log('\n' + '='.repeat(70));
        console.log('ROLLBACK TEST');
        console.log('='.repeat(70));
        const rollbackPassed = await testRollback(preMigrationState);
        
        // Step 6: Re-run migration after rollback
        console.log('\n' + '='.repeat(70));
        console.log('RE-RUNNING MIGRATION AFTER ROLLBACK');
        console.log('='.repeat(70));
        await migrate();
        
        // Step 7: Final verification
        console.log('\n' + '='.repeat(70));
        console.log('FINAL VERIFICATION');
        console.log('='.repeat(70));
        const finalCheckPassed = await verifyDataIntegrity(preMigrationState);
        
        // Step 8: Summary
        console.log('\n' + '='.repeat(70));
        console.log('TEST SUMMARY');
        console.log('='.repeat(70));
        
        const allTestsPassed = integrityCheckPassed && rollbackPassed && finalCheckPassed;
        
        console.log('\nTest Results:');
        console.log(`   ${integrityCheckPassed ? '✓' : '✗'} Initial migration data integrity`);
        console.log(`   ${rollbackPassed ? '✓' : '✗'} Rollback functionality`);
        console.log(`   ${finalCheckPassed ? '✓' : '✗'} Re-migration after rollback`);
        
        if (allTestsPassed) {
            console.log('\n🎉 ALL TESTS PASSED! Migration is working correctly.');
        } else {
            console.log('\n❌ SOME TESTS FAILED. Please review the output above.');
        }
        
        // Step 9: Cleanup (optional)
        if (testCourseId) {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            readline.question('\nClean up test data? (y/n): ', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                    await cleanupTestData(testCourseId);
                }
                readline.close();
                process.exit(allTestsPassed ? 0 : 1);
            });
        } else {
            process.exit(allTestsPassed ? 0 : 1);
        }
        
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        console.error(error);
        
        // Attempt cleanup on error
        if (testCourseId) {
            await cleanupTestData(testCourseId);
        }
        
        process.exit(1);
    }
}

// Run test
main();
