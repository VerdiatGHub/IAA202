const { query, getClient } = require('../config/db');

/**
 * Lesson Service Layer
 * Handles business logic for lesson operations
 */

/**
 * Find all lessons for a module
 * @param {string} moduleId - Module UUID
 * @returns {Promise<Array>} Array of lessons
 */
async function findByModuleId(moduleId) {
    const result = await query(`
        SELECT 
            id, course_id, module_id, title, content, video_url,
            order_index, duration, is_required, created_at, updated_at
        FROM lessons
        WHERE module_id = $1
        ORDER BY order_index ASC
    `, [moduleId]);

    return result.rows.map(lesson => ({
        id: lesson.id,
        courseId: lesson.course_id,
        moduleId: lesson.module_id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.video_url,
        orderIndex: lesson.order_index,
        duration: lesson.duration,
        isRequired: lesson.is_required,
        createdAt: lesson.created_at,
        updatedAt: lesson.updated_at
    }));
}

/**
 * Find a specific lesson by ID
 * @param {string} lessonId - Lesson UUID
 * @returns {Promise<Object|null>} Lesson object or null if not found
 */
async function findById(lessonId) {
    const result = await query(`
        SELECT 
            l.id, l.course_id, l.module_id, l.title, l.content, l.video_url,
            l.order_index, l.duration, l.is_required, l.created_at, l.updated_at,
            c.instructor_id, c.is_published
        FROM lessons l
        JOIN courses c ON l.course_id = c.id
        WHERE l.id = $1
    `, [lessonId]);

    if (result.rows.length === 0) {
        return null;
    }

    const lesson = result.rows[0];
    return {
        id: lesson.id,
        courseId: lesson.course_id,
        moduleId: lesson.module_id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.video_url,
        orderIndex: lesson.order_index,
        duration: lesson.duration,
        isRequired: lesson.is_required,
        createdAt: lesson.created_at,
        updatedAt: lesson.updated_at,
        instructorId: lesson.instructor_id,
        isPublished: lesson.is_published
    };
}

/**
 * Calculate the next order_index for a new lesson within a module
 * @param {string} moduleId - Module UUID
 * @returns {Promise<number>} Next order index (max + 1, or 0 if no lessons exist)
 */
async function getNextOrderIndex(moduleId) {
    const result = await query(
        'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM lessons WHERE module_id = $1',
        [moduleId]
    );
    return result.rows[0].next_order;
}

/**
 * Create a new lesson within a module
 * @param {string} courseId - Course UUID
 * @param {string} moduleId - Module UUID
 * @param {Object} data - Lesson data {title, content?, videoUrl?, duration?, isRequired?}
 * @returns {Promise<Object>} Created lesson
 */
async function create(courseId, moduleId, data) {
    const { title, content, videoUrl, duration, isRequired } = data;

    // Validate required fields
    if (!title || title.trim() === '') {
        throw new Error('Title is required');
    }

    // Get next order index within the module scope
    const orderIndex = await getNextOrderIndex(moduleId);

    // Insert lesson with module_id
    const result = await query(`
        INSERT INTO lessons (course_id, module_id, title, content, video_url, duration, is_required, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, course_id, module_id, title, content, video_url, duration, is_required, order_index, created_at, updated_at
    `, [
        courseId,
        moduleId,
        title.trim(),
        content || null,
        videoUrl || null,
        duration || null,
        isRequired !== undefined ? isRequired : true,
        orderIndex
    ]);

    const lesson = result.rows[0];
    return {
        id: lesson.id,
        courseId: lesson.course_id,
        moduleId: lesson.module_id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.video_url,
        duration: lesson.duration,
        isRequired: lesson.is_required,
        orderIndex: lesson.order_index,
        createdAt: lesson.created_at,
        updatedAt: lesson.updated_at
    };
}

/**
 * Update a lesson
 * @param {string} lessonId - Lesson UUID
 * @param {Object} data - Update data {title?, content?, videoUrl?, duration?, isRequired?, orderIndex?}
 * @returns {Promise<Object>} Updated lesson
 */
async function update(lessonId, data) {
    const { title, content, videoUrl, duration, isRequired, orderIndex } = data;

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined && title.trim() !== '') {
        updates.push(`title = $${paramIndex++}`);
        params.push(title.trim());
    }

    if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        params.push(content || null);
    }

    if (videoUrl !== undefined) {
        updates.push(`video_url = $${paramIndex++}`);
        params.push(videoUrl || null);
    }

    if (duration !== undefined) {
        updates.push(`duration = $${paramIndex++}`);
        params.push(duration || null);
    }

    if (isRequired !== undefined) {
        updates.push(`is_required = $${paramIndex++}`);
        params.push(isRequired);
    }

    if (orderIndex !== undefined) {
        updates.push(`order_index = $${paramIndex++}`);
        params.push(orderIndex);
    }

    if (updates.length === 0) {
        throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    params.push(lessonId);

    const result = await query(`
        UPDATE lessons 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, course_id, module_id, title, content, video_url, duration, is_required, order_index, created_at, updated_at
    `, params);

    if (result.rows.length === 0) {
        throw new Error('Lesson not found');
    }

    const lesson = result.rows[0];
    return {
        id: lesson.id,
        courseId: lesson.course_id,
        moduleId: lesson.module_id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.video_url,
        duration: lesson.duration,
        isRequired: lesson.is_required,
        orderIndex: lesson.order_index,
        createdAt: lesson.created_at,
        updatedAt: lesson.updated_at
    };
}

/**
 * Delete a lesson (cascades to content_items)
 * @param {string} lessonId - Lesson UUID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteLesson(lessonId) {
    // The DELETE will cascade to content_items due to ON DELETE CASCADE constraint
    const result = await query(
        'DELETE FROM lessons WHERE id = $1',
        [lessonId]
    );

    return result.rowCount > 0;
}

/**
 * Reorder lessons within a module
 * @param {string} moduleId - Module UUID
 * @param {Array<{id: string, orderIndex: number}>} orderMap - Array of lesson IDs with new order indices
 * @returns {Promise<void>}
 */
async function reorder(moduleId, orderMap) {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Update each lesson's order_index
        for (const item of orderMap) {
            await client.query(
                'UPDATE lessons SET order_index = $1, updated_at = NOW() WHERE id = $2 AND module_id = $3',
                [item.orderIndex, item.id, moduleId]
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
    findByModuleId,
    findById,
    getNextOrderIndex,
    create,
    update,
    deleteLesson,
    reorder
};
