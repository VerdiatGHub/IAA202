const { query, getClient } = require('../config/db');

/**
 * Module Service Layer
 * Handles business logic for module operations
 */

/**
 * Find all modules for a course
 * @param {string} courseId - Course UUID
 * @returns {Promise<Array>} Array of modules with lesson counts
 */
async function findByCourseId(courseId) {
    const result = await query(`
        SELECT 
            m.id, m.course_id, m.title, m.description, m.order_index,
            m.created_at, m.updated_at,
            COUNT(l.id) as lesson_count
        FROM modules m
        LEFT JOIN lessons l ON l.module_id = m.id
        WHERE m.course_id = $1
        GROUP BY m.id
        ORDER BY m.order_index ASC
    `, [courseId]);

    return result.rows.map(module => ({
        id: module.id,
        courseId: module.course_id,
        title: module.title,
        description: module.description,
        orderIndex: module.order_index,
        lessonCount: parseInt(module.lesson_count),
        createdAt: module.created_at,
        updatedAt: module.updated_at
    }));
}

/**
 * Find a specific module by ID
 * @param {string} moduleId - Module UUID
 * @param {string} courseId - Course UUID (for validation)
 * @returns {Promise<Object|null>} Module object or null if not found
 */
async function findById(moduleId, courseId) {
    const result = await query(`
        SELECT id, course_id, title, description, order_index, created_at, updated_at
        FROM modules
        WHERE id = $1 AND course_id = $2
    `, [moduleId, courseId]);

    if (result.rows.length === 0) {
        return null;
    }

    const module = result.rows[0];
    return {
        id: module.id,
        courseId: module.course_id,
        title: module.title,
        description: module.description,
        orderIndex: module.order_index,
        createdAt: module.created_at,
        updatedAt: module.updated_at
    };
}

/**
 * Calculate the next order_index for a new module
 * @param {string} courseId - Course UUID
 * @returns {Promise<number>} Next order index (max + 1, or 0 if no modules exist)
 */
async function getNextOrderIndex(courseId) {
    const result = await query(
        'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM modules WHERE course_id = $1',
        [courseId]
    );
    return result.rows[0].next_order;
}

/**
 * Create a new module
 * @param {string} courseId - Course UUID
 * @param {Object} data - Module data {title, description}
 * @returns {Promise<Object>} Created module
 */
async function create(courseId, data) {
    const { title, description } = data;

    // Validate required fields
    if (!title || title.trim() === '') {
        throw new Error('Title is required');
    }

    // Get next order index
    const orderIndex = await getNextOrderIndex(courseId);

    // Insert module
    const result = await query(`
        INSERT INTO modules (course_id, title, description, order_index)
        VALUES ($1, $2, $3, $4)
        RETURNING id, course_id, title, description, order_index, created_at, updated_at
    `, [courseId, title.trim(), description || null, orderIndex]);

    const module = result.rows[0];
    return {
        id: module.id,
        courseId: module.course_id,
        title: module.title,
        description: module.description,
        orderIndex: module.order_index,
        createdAt: module.created_at,
        updatedAt: module.updated_at
    };
}

/**
 * Update a module
 * @param {string} moduleId - Module UUID
 * @param {string} courseId - Course UUID (for validation)
 * @param {Object} data - Update data {title?, description?, orderIndex?}
 * @returns {Promise<Object>} Updated module
 */
async function update(moduleId, courseId, data) {
    const { title, description, orderIndex } = data;

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined && title.trim() !== '') {
        updates.push(`title = $${paramIndex++}`);
        params.push(title.trim());
    }

    if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(description || null);
    }

    if (orderIndex !== undefined) {
        updates.push(`order_index = $${paramIndex++}`);
        params.push(orderIndex);
    }

    if (updates.length === 0) {
        throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    params.push(moduleId);
    params.push(courseId);

    const result = await query(`
        UPDATE modules 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++} AND course_id = $${paramIndex}
        RETURNING id, course_id, title, description, order_index, created_at, updated_at
    `, params);

    if (result.rows.length === 0) {
        throw new Error('Module not found');
    }

    const module = result.rows[0];
    return {
        id: module.id,
        courseId: module.course_id,
        title: module.title,
        description: module.description,
        orderIndex: module.order_index,
        createdAt: module.created_at,
        updatedAt: module.updated_at
    };
}

/**
 * Delete a module (cascades to lessons)
 * @param {string} moduleId - Module UUID
 * @param {string} courseId - Course UUID (for validation)
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteModule(moduleId, courseId) {
    const result = await query(
        'DELETE FROM modules WHERE id = $1 AND course_id = $2',
        [moduleId, courseId]
    );

    return result.rowCount > 0;
}

/**
 * Reorder modules within a course
 * @param {string} courseId - Course UUID
 * @param {Array<{id: string, orderIndex: number}>} orderMap - Array of module IDs with new order indices
 * @returns {Promise<void>}
 */
async function reorder(courseId, orderMap) {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Update each module's order_index
        for (const item of orderMap) {
            await client.query(
                'UPDATE modules SET order_index = $1, updated_at = NOW() WHERE id = $2 AND course_id = $3',
                [item.orderIndex, item.id, courseId]
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    findByCourseId,
    findById,
    getNextOrderIndex,
    create,
    update,
    deleteModule,
    reorder
};
