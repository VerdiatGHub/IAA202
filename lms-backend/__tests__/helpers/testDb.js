const { query, pool } = require('../../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * Test Database Helper
 * Provides utilities for setting up and tearing down test data
 */

/**
 * Create a test user
 * @param {Object} userData - User data {email, password, role, fullName}
 * @returns {Promise<Object>} Created user with id
 */
async function createTestUser(userData = {}) {
    const {
        email = `test-${uuidv4()}@example.com`,
        password = 'password123',
        role = 'instructor',
        fullName = 'Test User'
    } = userData;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(`
        INSERT INTO users (email, password, role, full_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, role, full_name
    `, [email, hashedPassword, role, fullName]);

    return {
        ...result.rows[0],
        plainPassword: password
    };
}

/**
 * Create a test course
 * @param {string} instructorId - Instructor UUID
 * @param {Object} courseData - Course data {title, description, isPublished}
 * @returns {Promise<Object>} Created course
 */
async function createTestCourse(instructorId, courseData = {}) {
    const {
        title = `Test Course ${uuidv4().substring(0, 8)}`,
        description = 'Test course description',
        isPublished = true,
        category = 'programming',
        level = 'beginner'
    } = courseData;

    const result = await query(`
        INSERT INTO courses (title, description, instructor_id, is_published, category, level)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, description, instructor_id, is_published, category, level, created_at
    `, [title, description, instructorId, isPublished, category, level]);

    return result.rows[0];
}

/**
 * Create a test module
 * @param {string} courseId - Course UUID
 * @param {Object} moduleData - Module data {title, description, orderIndex}
 * @returns {Promise<Object>} Created module
 */
async function createTestModule(courseId, moduleData = {}) {
    const {
        title = `Test Module ${uuidv4().substring(0, 8)}`,
        description = 'Test module description',
        orderIndex = 0
    } = moduleData;

    const result = await query(`
        INSERT INTO modules (course_id, title, description, order_index)
        VALUES ($1, $2, $3, $4)
        RETURNING id, course_id, title, description, order_index, created_at, updated_at
    `, [courseId, title, description, orderIndex]);

    return result.rows[0];
}

/**
 * Clean up test data
 * Deletes all test users, courses, modules, etc.
 */
async function cleanupTestData() {
    // Delete in reverse order of dependencies
    await query('DELETE FROM modules WHERE course_id IN (SELECT id FROM courses WHERE title LIKE $1)', ['Test Course%']);
    await query('DELETE FROM courses WHERE title LIKE $1', ['Test Course%']);
    await query('DELETE FROM users WHERE email LIKE $1', ['test-%@example.com']);
}

/**
 * Close database connection pool
 */
async function closePool() {
    await pool.end();
}

module.exports = {
    createTestUser,
    createTestCourse,
    createTestModule,
    cleanupTestData,
    closePool
};
