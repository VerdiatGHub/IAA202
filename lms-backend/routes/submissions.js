const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/submissions - Get submissions for an assignment
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { assignmentId, studentId } = req.query;

        if (!assignmentId) {
            return res.status(400).json({ error: 'Assignment ID is required' });
        }

        let sql = `
            SELECT 
                s.id, s.assignment_id, s.student_id, s.file_url, s.content,
                s.score, s.feedback, s.submitted_at, s.graded_at,
                u.full_name as student_name, u.email as student_email,
                a.max_score, a.title as assignment_title
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            JOIN assignments a ON s.assignment_id = a.id
            WHERE s.assignment_id = $1
        `;

        const params = [assignmentId];

        if (studentId) {
            sql += ` AND s.student_id = $2`;
            params.push(studentId);
        }

        sql += ` ORDER BY s.submitted_at DESC`;

        const result = await query(sql, params);

        res.json({
            submissions: result.rows.map(s => ({
                id: s.id,
                assignmentId: s.assignment_id,
                studentId: s.student_id,
                fileUrl: s.file_url,
                content: s.content,
                score: s.score,
                feedback: s.feedback,
                submittedAt: s.submitted_at,
                gradedAt: s.graded_at,
                student: {
                    id: s.student_id,
                    fullName: s.student_name,
                    email: s.student_email
                },
                assignment: {
                    maxScore: s.max_score,
                    title: s.assignment_title
                }
            }))
        });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/submissions/:id - Get submission by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT 
                s.id, s.assignment_id, s.student_id, s.file_url, s.content,
                s.score, s.feedback, s.submitted_at, s.graded_at,
                u.full_name as student_name, u.email as student_email,
                a.max_score, a.title as assignment_title, a.course_id
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            JOIN assignments a ON s.assignment_id = a.id
            WHERE s.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const s = result.rows[0];
        res.json({
            id: s.id,
            assignmentId: s.assignment_id,
            studentId: s.student_id,
            fileUrl: s.file_url,
            content: s.content,
            score: s.score,
            feedback: s.feedback,
            submittedAt: s.submitted_at,
            gradedAt: s.graded_at,
            student: {
                id: s.student_id,
                fullName: s.student_name,
                email: s.student_email
            },
            assignment: {
                maxScore: s.max_score,
                title: s.assignment_title,
                courseId: s.course_id
            }
        });
    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/submissions - Submit an assignment
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { assignmentId, fileUrl, content } = req.body;

        if (!assignmentId) {
            return res.status(400).json({ error: 'Assignment ID is required' });
        }

        // Check if assignment exists
        const assignment = await query('SELECT id FROM assignments WHERE id = $1', [assignmentId]);
        if (assignment.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Check if already submitted
        const existing = await query(
            'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
            [assignmentId, req.user.id]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Already submitted this assignment' });
        }

        const result = await query(`
            INSERT INTO submissions (assignment_id, student_id, file_url, content)
            VALUES ($1, $2, $3, $4)
            RETURNING id, assignment_id, student_id, file_url, content, submitted_at
        `, [assignmentId, req.user.id, fileUrl, content]);

        const submission = result.rows[0];
        res.status(201).json({
            id: submission.id,
            assignmentId: submission.assignment_id,
            studentId: submission.student_id,
            fileUrl: submission.file_url,
            content: submission.content,
            submittedAt: submission.submitted_at
        });
    } catch (error) {
        console.error('Create submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/submissions/:id/grade - Grade a submission (instructor/admin only)
router.put('/:id/grade', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { score, feedback } = req.body;

        // Get submission with course info
        const submission = await query(`
            SELECT s.id, s.assignment_id, a.course_id, a.max_score, c.instructor_id
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN courses c ON a.course_id = c.id
            WHERE s.id = $1
        `, [id]);

        if (submission.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const sub = submission.rows[0];

        // Check if user is the course instructor or admin
        if (req.user.role !== 'admin' && sub.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (score !== undefined && (score < 0 || score > sub.max_score)) {
            return res.status(400).json({ error: `Score must be between 0 and ${sub.max_score}` });
        }

        const result = await query(`
            UPDATE submissions
            SET score = $1, feedback = $2, graded_at = NOW()
            WHERE id = $3
            RETURNING id, assignment_id, student_id, file_url, content, score, feedback, submitted_at, graded_at
        `, [score, feedback, id]);

        const graded = result.rows[0];
        res.json({
            id: graded.id,
            assignmentId: graded.assignment_id,
            studentId: graded.student_id,
            fileUrl: graded.file_url,
            content: graded.content,
            score: graded.score,
            feedback: graded.feedback,
            submittedAt: graded.submitted_at,
            gradedAt: graded.graded_at
        });
    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/submissions/:id - Delete submission
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const existing = await query('SELECT student_id FROM submissions WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        if (req.user.role !== 'admin' && existing.rows[0].student_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await query('DELETE FROM submissions WHERE id = $1', [id]);
        res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
