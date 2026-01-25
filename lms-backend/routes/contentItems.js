const express = require('express');
const { query, getClient } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const contentItemService = require('../services/contentItemService');

const router = express.Router();

// GET /api/lessons/:lessonId/content - Get all content items for a lesson
router.get('/lessons/:lessonId/content', authenticateToken, async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Check if lesson exists and user has access
        const lessonResult = await query(`
            SELECT l.id, l.course_id, c.instructor_id, c.is_published
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const lesson = lessonResult.rows[0];

        // Check access - students can only see published courses
        if (!lesson.is_published && 
            req.user.role !== 'admin' && 
            lesson.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get content items using service layer
        const contentItems = await contentItemService.findByLessonId(lessonId);

        res.json({ contentItems });
    } catch (error) {
        console.error('Get content items error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/lessons/:lessonId/content - Create new content item
router.post('/lessons/:lessonId/content', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { lessonId } = req.params;
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
        } = req.body;

        // Validate required fields
        if (!contentType) {
            return res.status(400).json({ error: 'Content type is required' });
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Validate content type
        const validTypes = ['video', 'text', 'quiz', 'assignment', 'resource'];
        if (!validTypes.includes(contentType)) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        // Check if lesson exists and user has permission
        const lessonResult = await query(`
            SELECT l.id, l.course_id, c.instructor_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const lesson = lessonResult.rows[0];

        // Check authorization - instructor can only edit their own courses
        if (req.user.role !== 'admin' && lesson.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Create content item using service layer
        const contentItem = await contentItemService.create(lessonId, {
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
        });

        res.status(201).json(contentItem);
    } catch (error) {
        console.error('Create content item error:', error);
        if (error.message === 'Invalid content type' || 
            error.message === 'Title is required' ||
            error.message.includes('Invalid') ||
            error.message.includes('URL')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/content/:contentId - Get specific content item
router.get('/content/:contentId', authenticateToken, async (req, res) => {
    try {
        const { contentId } = req.params;

        // Get content item using service layer
        const contentItem = await contentItemService.findById(contentId);

        if (!contentItem) {
            return res.status(404).json({ error: 'Content item not found' });
        }

        // Check access
        if (!contentItem.isPublished && 
            req.user.role !== 'admin' && 
            contentItem.instructorId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Remove internal fields before sending response
        const { instructorId, isPublished, courseId, ...contentData } = contentItem;

        res.json(contentData);
    } catch (error) {
        console.error('Get content item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/content/:contentId - Update content item
router.put('/content/:contentId', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { contentId } = req.params;
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
        } = req.body;

        // Get content item with course info to check permissions
        const contentCheck = await query(`
            SELECT ci.id, l.course_id, c.instructor_id
            FROM content_items ci
            JOIN lessons l ON ci.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE ci.id = $1
        `, [contentId]);

        if (contentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Content item not found' });
        }

        const content = contentCheck.rows[0];

        // Check authorization
        if (req.user.role !== 'admin' && content.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update content item using service layer
        const updatedContentItem = await contentItemService.update(contentId, {
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
        });

        res.json(updatedContentItem);
    } catch (error) {
        console.error('Update content item error:', error);
        if (error.message === 'No fields to update' ||
            error.message === 'Content item not found' ||
            error.message.includes('Invalid') ||
            error.message.includes('URL')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/content/:contentId - Delete content item
router.delete('/content/:contentId', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { contentId } = req.params;

        // Get content item with course info to check permissions
        const contentCheck = await query(`
            SELECT ci.id, l.course_id, c.instructor_id
            FROM content_items ci
            JOIN lessons l ON ci.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE ci.id = $1
        `, [contentId]);

        if (contentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Content item not found' });
        }

        const content = contentCheck.rows[0];

        // Check authorization
        if (req.user.role !== 'admin' && content.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete content item using service layer
        await contentItemService.deleteContentItem(contentId);

        res.json({ message: 'Content item deleted successfully' });
    } catch (error) {
        console.error('Delete content item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/lessons/:lessonId/content/reorder - Reorder content items within a lesson
router.put('/lessons/:lessonId/content/reorder', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { contentItemIds } = req.body;

        // Validate request body
        if (!contentItemIds || !Array.isArray(contentItemIds) || contentItemIds.length === 0) {
            return res.status(400).json({ error: 'contentItemIds array is required' });
        }

        // Check if lesson exists and user has permission
        const lessonResult = await query(`
            SELECT l.id, l.course_id, c.instructor_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const lesson = lessonResult.rows[0];

        // Check authorization
        if (req.user.role !== 'admin' && lesson.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Verify all content items belong to this lesson
        const contentCheckResult = await query(
            'SELECT id FROM content_items WHERE id = ANY($1) AND lesson_id = $2',
            [contentItemIds, lessonId]
        );

        if (contentCheckResult.rows.length !== contentItemIds.length) {
            return res.status(400).json({ error: 'One or more content items do not belong to this lesson' });
        }

        // Reorder content items using service layer
        const orderMap = contentItemIds.map((id, index) => ({ id, orderIndex: index }));
        await contentItemService.reorder(lessonId, orderMap);

        // Fetch updated content items
        const contentItems = await contentItemService.findByLessonId(lessonId);

        res.json({ contentItems });
    } catch (error) {
        console.error('Reorder content items error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
