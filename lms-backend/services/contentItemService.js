const { query, getClient } = require('../config/db');

/**
 * Content Item Service Layer
 * Handles business logic for content item operations
 */

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUrl(url) {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

/**
 * Validate content item data based on content type
 * @param {string} contentType - Type of content
 * @param {Object} data - Content item data
 * @throws {Error} If validation fails
 */
function validateContentItem(contentType, data) {
    const { title, videoUrl, resourceUrl, resourceType } = data;

    // Title is required for all content types
    if (!title || title.trim() === '') {
        throw new Error('Title is required');
    }

    // Type-specific validation
    switch (contentType) {
        case 'video':
            if (videoUrl && !isValidUrl(videoUrl)) {
                throw new Error('Invalid video URL format');
            }
            break;

        case 'resource':
            if (resourceType === 'link' && resourceUrl && !isValidUrl(resourceUrl)) {
                throw new Error('Invalid resource URL format');
            }
            break;

        case 'text':
        case 'quiz':
        case 'assignment':
            // No additional validation needed
            break;

        default:
            throw new Error('Invalid content type');
    }
}

/**
 * Find all content items for a lesson
 * @param {string} lessonId - Lesson UUID
 * @returns {Promise<Array>} Array of content items
 */
async function findByLessonId(lessonId) {
    const result = await query(`
        SELECT 
            id, lesson_id, content_type, title, description, order_index, is_required,
            video_url, duration, text_content, quiz_id, assignment_id,
            resource_type, resource_url, file_path,
            created_at, updated_at
        FROM content_items
        WHERE lesson_id = $1
        ORDER BY order_index ASC
    `, [lessonId]);

    return result.rows.map(item => ({
        id: item.id,
        lessonId: item.lesson_id,
        contentType: item.content_type,
        title: item.title,
        description: item.description,
        orderIndex: item.order_index,
        isRequired: item.is_required,
        videoUrl: item.video_url,
        duration: item.duration,
        textContent: item.text_content,
        quizId: item.quiz_id,
        assignmentId: item.assignment_id,
        resourceType: item.resource_type,
        resourceUrl: item.resource_url,
        filePath: item.file_path,
        createdAt: item.created_at,
        updatedAt: item.updated_at
    }));
}

/**
 * Find a specific content item by ID
 * @param {string} contentId - Content item UUID
 * @returns {Promise<Object|null>} Content item object or null if not found
 */
async function findById(contentId) {
    const result = await query(`
        SELECT 
            ci.id, ci.lesson_id, ci.content_type, ci.title, ci.description, 
            ci.order_index, ci.is_required,
            ci.video_url, ci.duration, ci.text_content, ci.quiz_id, ci.assignment_id,
            ci.resource_type, ci.resource_url, ci.file_path,
            ci.created_at, ci.updated_at,
            l.course_id, c.instructor_id, c.is_published
        FROM content_items ci
        JOIN lessons l ON ci.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        WHERE ci.id = $1
    `, [contentId]);

    if (result.rows.length === 0) {
        return null;
    }

    const item = result.rows[0];
    return {
        id: item.id,
        lessonId: item.lesson_id,
        contentType: item.content_type,
        title: item.title,
        description: item.description,
        orderIndex: item.order_index,
        isRequired: item.is_required,
        videoUrl: item.video_url,
        duration: item.duration,
        textContent: item.text_content,
        quizId: item.quiz_id,
        assignmentId: item.assignment_id,
        resourceType: item.resource_type,
        resourceUrl: item.resource_url,
        filePath: item.file_path,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        courseId: item.course_id,
        instructorId: item.instructor_id,
        isPublished: item.is_published
    };
}

/**
 * Calculate the next order_index for a new content item within a lesson
 * @param {string} lessonId - Lesson UUID
 * @returns {Promise<number>} Next order index (max + 1, or 0 if no content items exist)
 */
async function getNextOrderIndex(lessonId) {
    const result = await query(
        'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM content_items WHERE lesson_id = $1',
        [lessonId]
    );
    return result.rows[0].next_order;
}

/**
 * Create a new content item within a lesson
 * @param {string} lessonId - Lesson UUID
 * @param {Object} data - Content item data
 * @returns {Promise<Object>} Created content item
 */
async function create(lessonId, data) {
    const {
        contentType,
        title,
        description,
        isRequired,
        videoUrl,
        duration,
        textContent,
        quizId,
        assignmentId,
        resourceType,
        resourceUrl,
        filePath
    } = data;

    // Validate content type
    const validTypes = ['video', 'text', 'quiz', 'assignment', 'resource'];
    if (!validTypes.includes(contentType)) {
        throw new Error('Invalid content type');
    }

    // Validate content item data
    validateContentItem(contentType, data);

    // Get next order index within the lesson scope
    const orderIndex = await getNextOrderIndex(lessonId);

    // Insert content item
    const result = await query(`
        INSERT INTO content_items (
            lesson_id, content_type, title, description, is_required, order_index,
            video_url, duration, text_content, quiz_id, assignment_id,
            resource_type, resource_url, file_path
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING 
            id, lesson_id, content_type, title, description, order_index, is_required,
            video_url, duration, text_content, quiz_id, assignment_id,
            resource_type, resource_url, file_path,
            created_at, updated_at
    `, [
        lessonId,
        contentType,
        title.trim(),
        description || null,
        isRequired !== undefined ? isRequired : true,
        orderIndex,
        videoUrl || null,
        duration || null,
        textContent || null,
        quizId || null,
        assignmentId || null,
        resourceType || null,
        resourceUrl || null,
        filePath || null
    ]);

    const item = result.rows[0];
    return {
        id: item.id,
        lessonId: item.lesson_id,
        contentType: item.content_type,
        title: item.title,
        description: item.description,
        orderIndex: item.order_index,
        isRequired: item.is_required,
        videoUrl: item.video_url,
        duration: item.duration,
        textContent: item.text_content,
        quizId: item.quiz_id,
        assignmentId: item.assignment_id,
        resourceType: item.resource_type,
        resourceUrl: item.resource_url,
        filePath: item.file_path,
        createdAt: item.created_at,
        updatedAt: item.updated_at
    };
}

/**
 * Update a content item
 * @param {string} contentId - Content item UUID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated content item
 */
async function update(contentId, data) {
    const {
        title,
        description,
        isRequired,
        orderIndex,
        videoUrl,
        duration,
        textContent,
        quizId,
        assignmentId,
        resourceType,
        resourceUrl,
        filePath
    } = data;

    // Get current content item to validate against content type
    const currentItem = await findById(contentId);
    if (!currentItem) {
        throw new Error('Content item not found');
    }

    // Validate if updating type-specific fields
    if (title !== undefined || videoUrl !== undefined || resourceUrl !== undefined) {
        validateContentItem(currentItem.contentType, {
            title: title !== undefined ? title : currentItem.title,
            videoUrl: videoUrl !== undefined ? videoUrl : currentItem.videoUrl,
            resourceUrl: resourceUrl !== undefined ? resourceUrl : currentItem.resourceUrl,
            resourceType: resourceType !== undefined ? resourceType : currentItem.resourceType
        });
    }

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

    if (isRequired !== undefined) {
        updates.push(`is_required = $${paramIndex++}`);
        params.push(isRequired);
    }

    if (orderIndex !== undefined) {
        updates.push(`order_index = $${paramIndex++}`);
        params.push(orderIndex);
    }

    if (videoUrl !== undefined) {
        updates.push(`video_url = $${paramIndex++}`);
        params.push(videoUrl || null);
    }

    if (duration !== undefined) {
        updates.push(`duration = $${paramIndex++}`);
        params.push(duration || null);
    }

    if (textContent !== undefined) {
        updates.push(`text_content = $${paramIndex++}`);
        params.push(textContent || null);
    }

    if (quizId !== undefined) {
        updates.push(`quiz_id = $${paramIndex++}`);
        params.push(quizId || null);
    }

    if (assignmentId !== undefined) {
        updates.push(`assignment_id = $${paramIndex++}`);
        params.push(assignmentId || null);
    }

    if (resourceType !== undefined) {
        updates.push(`resource_type = $${paramIndex++}`);
        params.push(resourceType || null);
    }

    if (resourceUrl !== undefined) {
        updates.push(`resource_url = $${paramIndex++}`);
        params.push(resourceUrl || null);
    }

    if (filePath !== undefined) {
        updates.push(`file_path = $${paramIndex++}`);
        params.push(filePath || null);
    }

    if (updates.length === 0) {
        throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    params.push(contentId);

    const result = await query(`
        UPDATE content_items 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
            id, lesson_id, content_type, title, description, order_index, is_required,
            video_url, duration, text_content, quiz_id, assignment_id,
            resource_type, resource_url, file_path,
            created_at, updated_at
    `, params);

    if (result.rows.length === 0) {
        throw new Error('Content item not found');
    }

    const item = result.rows[0];
    return {
        id: item.id,
        lessonId: item.lesson_id,
        contentType: item.content_type,
        title: item.title,
        description: item.description,
        orderIndex: item.order_index,
        isRequired: item.is_required,
        videoUrl: item.video_url,
        duration: item.duration,
        textContent: item.text_content,
        quizId: item.quiz_id,
        assignmentId: item.assignment_id,
        resourceType: item.resource_type,
        resourceUrl: item.resource_url,
        filePath: item.file_path,
        createdAt: item.created_at,
        updatedAt: item.updated_at
    };
}

/**
 * Delete a content item
 * @param {string} contentId - Content item UUID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteContentItem(contentId) {
    const result = await query(
        'DELETE FROM content_items WHERE id = $1',
        [contentId]
    );

    return result.rowCount > 0;
}

/**
 * Reorder content items within a lesson
 * @param {string} lessonId - Lesson UUID
 * @param {Array<{id: string, orderIndex: number}>} orderMap - Array of content item IDs with new order indices
 * @returns {Promise<void>}
 */
async function reorder(lessonId, orderMap) {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Update each content item's order_index
        for (const item of orderMap) {
            await client.query(
                'UPDATE content_items SET order_index = $1, updated_at = NOW() WHERE id = $2 AND lesson_id = $3',
                [item.orderIndex, item.id, lessonId]
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
    findByLessonId,
    findById,
    getNextOrderIndex,
    create,
    update,
    deleteContentItem,
    reorder,
    isValidUrl,
    validateContentItem
};
