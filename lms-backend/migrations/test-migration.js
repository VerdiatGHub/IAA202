/**
 * Test script for migration 002
 * 
 * This script tests the migration by:
 * 1. Checking current state of lessons
 * 2. Running the migration
 * 3. Verifying the results
 * 
 * Usage: node migrations/test-migration.js
 */

const { query } = require('../config/db');
const { migrate } = require('./002_migrate_lessons_to_modules');

async function testMigration() {
    try {
        console.log('='.repeat(60));
        console.log('TESTING MIGRATION: 002_migrate_lessons_to_modules');
        console.log('='.repeat(60));
        
        // Step 1: Check current state
        console.log('\n1. Checking current state...');
        
        const orphanedLessonsResult = await query(`
            SELECT 
                l.id, 
                l.course_id, 
                l.title, 
                l.module_id,
                c.title as course_title
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.module_id IS NULL
            ORDER BY l.course_id, l.order_index
        `);
        
        console.log(`   Found ${orphanedLessonsResult.rows.length} lessons without module_id`);
        
        if (orphanedLessonsResult.rows.length > 0) {
            console.log('\n   Sample orphaned lessons:');
            orphanedLessonsResult.rows.slice(0, 5).forEach(lesson => {
                console.log(`   - ${lesson.title} (Course: ${lesson.course_title})`);
            });
        }
        
        // Step 2: Check existing modules
        const modulesResult = await query('SELECT COUNT(*) as count FROM modules');
        console.log(`\n   Existing modules: ${modulesResult.rows[0].count}`);
        
        // Step 3: Run migration
        console.log('\n2. Running migration...');
        await migrate();
        
        // Step 4: Verify results
        console.log('\n3. Verifying results...');
        
        const remainingOrphansResult = await query(`
            SELECT COUNT(*) as count 
            FROM lessons 
            WHERE module_id IS NULL
        `);
        
        const remainingOrphans = parseInt(remainingOrphansResult.rows[0].count);
        console.log(`   Lessons without module_id: ${remainingOrphans}`);
        
        if (remainingOrphans === 0) {
            console.log('   ✓ SUCCESS: All lessons now have module assignments');
        } else {
            console.log(`   ✗ FAILURE: ${remainingOrphans} lessons still without module_id`);
        }
        
        // Step 5: Show created modules
        const newModulesResult = await query(`
            SELECT 
                m.id,
                m.title,
                m.course_id,
                c.title as course_title,
                COUNT(l.id) as lesson_count
            FROM modules m
            JOIN courses c ON m.course_id = c.id
            LEFT JOIN lessons l ON l.module_id = m.id
            WHERE m.title = 'General'
            GROUP BY m.id, m.title, m.course_id, c.title
            ORDER BY c.title
        `);
        
        console.log(`\n   Created/Updated "General" modules: ${newModulesResult.rows.length}`);
        if (newModulesResult.rows.length > 0) {
            console.log('\n   Module details:');
            newModulesResult.rows.forEach(module => {
                console.log(`   - ${module.course_title}: ${module.lesson_count} lessons`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('TEST COMPLETE');
        console.log('='.repeat(60));
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n✗ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run test
testMigration();
