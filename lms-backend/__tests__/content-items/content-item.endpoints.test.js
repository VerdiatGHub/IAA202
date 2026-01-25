const request = require('supertest');
const app = require('../../server');
const { query } = require('../../config/db');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');
const jwt = require('jsonwebtoken');

describe('Content Item Endpoints', () => {
    let adminToken, instructorToken, instructor2Token, studentToken;
    let adminUser, instructorUser, instructor2User, studentUser;
    let testCourse, testModule, testLesson;

    beforeAll(async () => {
        // Create test users
        adminUser = await createTestUser({ role: 'admin', email: 'admin-content@test.com' });
        instructorUser = await createTestUser({ role: 'instructor', email: 'instructor-content@test.com' });
        instructor2User = await createTestUser({ role: 'instructor', email: 'instructor2-content@test.com' });
        studentUser = await createTestUser({ role: 'student', email: 'student-content@test.com' });

        // Generate tokens
        adminToken = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: adminUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        instructorToken = jwt.sign(
            { id: instructorUser.id, email: instructorUser.email, role: instructorUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        instructor2Token = jwt.sign(
            { id: instructor2User.id, email: instructor2User.email, role: instructor2User.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        studentToken = jwt.sign(
            { id: studentUser.id, email: studentUser.email, role: studentUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Create test course and module
        testCourse = await createTestCourse(instructorUser.id, { title: 'Content Test Course' });
        testModule = await createTestModule(testCourse.id, { title: 'Content Test Module' });

        // Create test lesson
        const lessonResult = await query(`
            INSERT INTO lessons (course_id, module_id, title, content, order_index)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, course_id, module_id, title, content, order_index
        `, [testCourse.id, testModule.id, 'Test Lesson', 'Test content', 0]);
        testLesson = lessonResult.rows[0];
    });

    afterAll(async () => {
        await cleanupTestData();
        await closePool();
    });

    describe('POST /api/lessons/:lessonId/content', () => {
        it('should create video content item with valid data', async () => {
            const response = await request(app)
                .post(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'video',
                    title: 'Introduction Video',
                    description: 'Course introduction',
                    videoUrl: 'https://example.com/video.mp4',
                    duration: 15,
                    isRequired: true
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Introduction Video');
            expect(response.body.contentType).toBe('video');
            expect(response.body.videoUrl).toBe('https://example.com/video.mp4');
            expect(response.body.duration).toBe(15);
            expect(response.body.orderIndex).toBe(0);
        });

        it('should create text content item', async () => {
            const response = await request(app)
                .post(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'text',
                    title: 'Reading Material',
                    textContent: '<p>This is <strong>rich text</strong> content</p>',
                    isRequired: true
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Reading Material');
            expect(response.body.contentType).toBe('text');
            expect(response.body.textContent).toContain('rich text');
            expect(response.body.orderIndex).toBe(1); // Second item
        });

        it('should create resource content item with link', async () => {
            const response = await request(app)
                .post(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'resource',
                    title: 'External Resource',
                    resourceType: 'link',
                    resourceUrl: 'https://example.com/resource.pdf',
                    isRequired: false
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('External Resource');
            expect(response.body.contentType).toBe('resource');
            expect(response.body.resourceType).toBe('link');
            expect(response.body.isRequired).toBe(false);
        });

        it('should return 400 for missing title', async () => {
            const response = await request(app)
                .post(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'video',
                    videoUrl: 'https://example.com/video.mp4'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Title is required');
        });

        it('should return 400 for missing content type', async () => {
            const response = await request(app)
                .post(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Test Content'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Content type is required');
        });

        it('should return 400 for invalid content type', async () => {
            const response = await request(app)
                .post(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'invalid',
                    title: 'Test Content'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid content type');
        });

        it('should return 400 for invalid video URL', async () => {
            const response = await request(app)
                .post(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'video',
                    title: 'Video with bad URL',
                    videoUrl: 'not-a-valid-url'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid video URL');
        });

        it('should return 403 when instructor tries to add content to another instructor\'s course', async () => {
            const response = await request(app)
                .post(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructor2Token}`)
                .send({
                    contentType: 'text',
                    title: 'Unauthorized Content'
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .post('/api/lessons/00000000-0000-0000-0000-000000000000/content')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'text',
                    title: 'Test Content'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Lesson not found');
        });
    });

    describe('GET /api/lessons/:lessonId/content', () => {
        let contentItem1, contentItem2;

        beforeAll(async () => {
            // Create test content items
            const result1 = await query(`
                INSERT INTO content_items (lesson_id, content_type, title, order_index)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [testLesson.id, 'video', 'Video 1', 0]);
            contentItem1 = result1.rows[0];

            const result2 = await query(`
                INSERT INTO content_items (lesson_id, content_type, title, order_index)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [testLesson.id, 'text', 'Text 1', 1]);
            contentItem2 = result2.rows[0];
        });

        it('should get all content items for a lesson', async () => {
            const response = await request(app)
                .get(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.contentItems).toBeDefined();
            expect(response.body.contentItems.length).toBeGreaterThanOrEqual(2);
            expect(response.body.contentItems[0].orderIndex).toBeLessThanOrEqual(response.body.contentItems[1].orderIndex);
        });

        it('should allow student to view content in published course', async () => {
            const response = await request(app)
                .get(`/api/lessons/${testLesson.id}/content`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.contentItems).toBeDefined();
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .get('/api/lessons/00000000-0000-0000-0000-000000000000/content')
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Lesson not found');
        });
    });

    describe('GET /api/content/:contentId', () => {
        let testContentItem;

        beforeAll(async () => {
            const result = await query(`
                INSERT INTO content_items (lesson_id, content_type, title, description, order_index)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [testLesson.id, 'video', 'Specific Video', 'Test description', 0]);
            testContentItem = result.rows[0];
        });

        it('should get specific content item', async () => {
            const response = await request(app)
                .get(`/api/content/${testContentItem.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(testContentItem.id);
            expect(response.body.title).toBe('Specific Video');
            expect(response.body.description).toBe('Test description');
        });

        it('should return 404 for non-existent content item', async () => {
            const response = await request(app)
                .get('/api/content/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Content item not found');
        });
    });

    describe('PUT /api/content/:contentId', () => {
        let testContentItem;

        beforeEach(async () => {
            const result = await query(`
                INSERT INTO content_items (lesson_id, content_type, title, video_url, order_index)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [testLesson.id, 'video', 'Original Title', 'https://example.com/original.mp4', 0]);
            testContentItem = result.rows[0];
        });

        afterEach(async () => {
            await query('DELETE FROM content_items WHERE id = $1', [testContentItem.id]);
        });

        it('should update content item title', async () => {
            const response = await request(app)
                .put(`/api/content/${testContentItem.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Updated Title'
                });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Updated Title');
            expect(response.body.videoUrl).toBe('https://example.com/original.mp4'); // Unchanged
        });

        it('should update video URL', async () => {
            const response = await request(app)
                .put(`/api/content/${testContentItem.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    videoUrl: 'https://example.com/updated.mp4',
                    duration: 20
                });

            expect(response.status).toBe(200);
            expect(response.body.videoUrl).toBe('https://example.com/updated.mp4');
            expect(response.body.duration).toBe(20);
        });

        it('should return 400 for invalid URL', async () => {
            const response = await request(app)
                .put(`/api/content/${testContentItem.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    videoUrl: 'invalid-url'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid');
        });

        it('should return 403 when instructor tries to update another instructor\'s content', async () => {
            const response = await request(app)
                .put(`/api/content/${testContentItem.id}`)
                .set('Authorization', `Bearer ${instructor2Token}`)
                .send({
                    title: 'Unauthorized Update'
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });

        it('should return 404 for non-existent content item', async () => {
            const response = await request(app)
                .put('/api/content/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Updated Title'
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/content/:contentId', () => {
        let testContentItem;

        beforeEach(async () => {
            const result = await query(`
                INSERT INTO content_items (lesson_id, content_type, title, order_index)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [testLesson.id, 'text', 'To Delete', 0]);
            testContentItem = result.rows[0];
        });

        it('should delete content item', async () => {
            const response = await request(app)
                .delete(`/api/content/${testContentItem.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Content item deleted successfully');

            // Verify deletion
            const checkResult = await query('SELECT id FROM content_items WHERE id = $1', [testContentItem.id]);
            expect(checkResult.rows.length).toBe(0);
        });

        it('should return 403 when instructor tries to delete another instructor\'s content', async () => {
            const response = await request(app)
                .delete(`/api/content/${testContentItem.id}`)
                .set('Authorization', `Bearer ${instructor2Token}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });

        it('should return 404 for non-existent content item', async () => {
            const response = await request(app)
                .delete('/api/content/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Content item not found');
        });
    });

    describe('PUT /api/lessons/:lessonId/content/reorder', () => {
        let contentItems;

        beforeEach(async () => {
            // Create multiple content items
            const result1 = await query(`
                INSERT INTO content_items (lesson_id, content_type, title, order_index)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [testLesson.id, 'video', 'Item 1', 0]);

            const result2 = await query(`
                INSERT INTO content_items (lesson_id, content_type, title, order_index)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [testLesson.id, 'text', 'Item 2', 1]);

            const result3 = await query(`
                INSERT INTO content_items (lesson_id, content_type, title, order_index)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [testLesson.id, 'resource', 'Item 3', 2]);

            contentItems = [result1.rows[0], result2.rows[0], result3.rows[0]];
        });

        afterEach(async () => {
            await query('DELETE FROM content_items WHERE lesson_id = $1', [testLesson.id]);
        });

        it('should reorder content items', async () => {
            // Reverse the order
            const newOrder = [contentItems[2].id, contentItems[1].id, contentItems[0].id];

            const response = await request(app)
                .put(`/api/lessons/${testLesson.id}/content/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentItemIds: newOrder
                });

            expect(response.status).toBe(200);
            expect(response.body.contentItems).toBeDefined();
            expect(response.body.contentItems[0].id).toBe(contentItems[2].id);
            expect(response.body.contentItems[0].orderIndex).toBe(0);
            expect(response.body.contentItems[2].id).toBe(contentItems[0].id);
            expect(response.body.contentItems[2].orderIndex).toBe(2);
        });

        it('should return 400 for missing contentItemIds', async () => {
            const response = await request(app)
                .put(`/api/lessons/${testLesson.id}/content/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('contentItemIds array is required');
        });

        it('should return 400 when content items do not belong to lesson', async () => {
            const response = await request(app)
                .put(`/api/lessons/${testLesson.id}/content/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentItemIds: ['00000000-0000-0000-0000-000000000000']
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('do not belong to this lesson');
        });

        it('should return 403 when instructor tries to reorder another instructor\'s content', async () => {
            const response = await request(app)
                .put(`/api/lessons/${testLesson.id}/content/reorder`)
                .set('Authorization', `Bearer ${instructor2Token}`)
                .send({
                    contentItemIds: [contentItems[0].id, contentItems[1].id]
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });
    });
});
