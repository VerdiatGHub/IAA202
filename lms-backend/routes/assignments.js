const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments - Get assignments for a course
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.query;

        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required' });
        }

        const result = await query(`
            SELECT 
                a.id, a.course_id, a.title, a.description, a.due_date, a.max_score, a.created_at,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as total_submissions,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.score IS NOT NULL) as graded_count,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.score IS NULL) as pending_count
            FROM assignments a
            WHERE a.course_id = $1
            ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC
        `, [courseId]);

        res.json({
            assignments: result.rows.map(a => ({
                id: a.id,
                courseId: a.course_id,
                title: a.title,
                description: a.description,
                dueDate: a.due_date,
                maxScore: a.max_score,
                createdAt: a.created_at,
                totalSubmissions: parseInt(a.total_submissions),
                gradedCount: parseInt(a.graded_count),
                pendingCount: parseInt(a.pending_count)
            }))
        });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/assignments/:id - Get assignment by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT 
                a.id, a.course_id, a.title, a.description, a.due_date, a.max_score, a.created_at,
                c.title as course_title, c.instructor_id
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const assignment = result.rows[0];
        res.json({
            id: assignment.id,
            courseId: assignment.course_id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.due_date,
            maxScore: assignment.max_score,
            createdAt: assignment.created_at,
            course: {
                id: assignment.course_id,
                title: assignment.course_title,
                instructorId: assignment.instructor_id
            }
        });
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
