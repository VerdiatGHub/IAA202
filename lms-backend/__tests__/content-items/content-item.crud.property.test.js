const fc = require('fast-check');
const { query } = require('../../config/db');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');

// Feature: course-content-management, Property 1: CRUD Operations Preserve Data Integrity
// Feature: course-content-management, Property 2: Updates Persist Correctly
// Validates: Requirements 3.1, 3.3, 4.1, 4.2, 5.1, 6.1, 7.1

describe('Content Item CRUD Property Tests', () => {
    let testUser;
    let testCourse;
    let testModule;
    let testLesson;

    beforeAll(async () => {
        testUser = await createTestUser({ role: 'instructor' });
        testCourse = await createTestCourse(testUser.id);
        testModule = await query(`
            INSERT INTO modules (course_id, title, order_index)
            VALUES ($1, $2, $3)
            RETURNING id, course_id, title, order_index
        `, [testCourse.id, 'Test Module', 0]);
        testModule = testModule.rows[0];

        testLesson = await query(`
            INSERT INTO lessons (course_id, module_id, title, order_index)
            VALUES ($1, $2, $3, $4)
            RETURNING id, course_id, module_id, title, order_index
        `, [testCourse.id, testModule.id, 'Test Lesson', 0]);
        testLesson = testLesson.rows[0];
    });

    afterAll(async () => {
        await query('DELETE FROM lessons WHERE id = $1', [testLesson.id]);
        await query('DELETE FROM modules WHERE id = $1', [testModule.id]);
        await cleanupTestData();
        await closePool();
    });

    describe('Property 1: CRUD Operations Preserve Data Integrity', () => {
        test('when a video content item is created with valid data, retrieving it should return the same data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        videoUrl: fc.option(fc.webUrl(), { nil: null }),
                        duration: fc.option(fc.integer({ min: 1, max: 300 }), { nil: null }),
                        isRequired: fc.boolean()
                    }),
                    async (contentData) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, description, 
                                video_url, duration, is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
                            RETURNING id, lesson_id, content_type, title, description, 
                                      video_url, duration, is_required, order_index
                        `, [
                            testLesson.id,
                            'video',
                            contentData.title.trim(),
                            contentData.description,
                            contentData.videoUrl,
                            contentData.duration,
                            contentData.isRequired
                        ]);

                        const createdContent = createResult.rows[0];

                        try {
                            const retrieveResult = await query(`
                                SELECT id, lesson_id, content_type, title, description, 
                                       video_url, duration, is_required, order_index
                                FROM content_items WHERE id = $1
                            `, [createdContent.id]);

                            expect(retrieveResult.rows.length).toBe(1);
                            const retrievedContent = retrieveResult.rows[0];

                            expect(retrievedContent.id).toBe(createdContent.id);
                            expect(retrievedContent.lesson_id).toBe(testLesson.id);
                            expect(retrievedContent.content_type).toBe('video');
                            expect(retrievedContent.title).toBe(contentData.title.trim());
                            expect(retrievedContent.description).toBe(contentData.description);
                            expect(retrievedContent.video_url).toBe(contentData.videoUrl);
                            expect(retrievedContent.duration).toBe(contentData.duration);
                            expect(retrievedContent.is_required).toBe(contentData.isRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [createdContent.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a text content item is created with valid data, retrieving it should return the same data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        textContent: fc.option(fc.string({ maxLength: 5000 }), { nil: null }),
                        isRequired: fc.boolean()
                    }),
                    async (contentData) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, description, 
                                text_content, is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, 0)
                            RETURNING id, lesson_id, content_type, title, description, 
                                      text_content, is_required, order_index
                        `, [
                            testLesson.id,
                            'text',
                            contentData.title.trim(),
                            contentData.description,
                            contentData.textContent,
                            contentData.isRequired
                        ]);

                        const createdContent = createResult.rows[0];

                        try {
                            const retrieveResult = await query(`
                                SELECT id, lesson_id, content_type, title, description, 
                                       text_content, is_required, order_index
                                FROM content_items WHERE id = $1
                            `, [createdContent.id]);

                            expect(retrieveResult.rows.length).toBe(1);
                            const retrievedContent = retrieveResult.rows[0];

                            expect(retrievedContent.id).toBe(createdContent.id);
                            expect(retrievedContent.lesson_id).toBe(testLesson.id);
                            expect(retrievedContent.content_type).toBe('text');
                            expect(retrievedContent.title).toBe(contentData.title.trim());
                            expect(retrievedContent.description).toBe(contentData.description);
                            expect(retrievedContent.text_content).toBe(contentData.textContent);
                            expect(retrievedContent.is_required).toBe(contentData.isRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [createdContent.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a quiz content item is created with valid data, retrieving it should return the same data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        isRequired: fc.boolean()
                    }),
                    async (contentData) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, description, 
                                is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, 0)
                            RETURNING id, lesson_id, content_type, title, description, 
                                      is_required, order_index
                        `, [
                            testLesson.id,
                            'quiz',
                            contentData.title.trim(),
                            contentData.description,
                            contentData.isRequired
                        ]);

                        const createdContent = createResult.rows[0];

                        try {
                            const retrieveResult = await query(`
                                SELECT id, lesson_id, content_type, title, description, 
                                       is_required, order_index
                                FROM content_items WHERE id = $1
                            `, [createdContent.id]);

                            expect(retrieveResult.rows.length).toBe(1);
                            const retrievedContent = retrieveResult.rows[0];

                            expect(retrievedContent.id).toBe(createdContent.id);
                            expect(retrievedContent.lesson_id).toBe(testLesson.id);
                            expect(retrievedContent.content_type).toBe('quiz');
                            expect(retrievedContent.title).toBe(contentData.title.trim());
                            expect(retrievedContent.description).toBe(contentData.description);
                            expect(retrievedContent.is_required).toBe(contentData.isRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [createdContent.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when an assignment content item is created with valid data, retrieving it should return the same data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        isRequired: fc.boolean()
                    }),
                    async (contentData) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, description, 
                                is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, 0)
                            RETURNING id, lesson_id, content_type, title, description, 
                                      is_required, order_index
                        `, [
                            testLesson.id,
                            'assignment',
                            contentData.title.trim(),
                            contentData.description,
                            contentData.isRequired
                        ]);

                        const createdContent = createResult.rows[0];

                        try {
                            const retrieveResult = await query(`
                                SELECT id, lesson_id, content_type, title, description, 
                                       is_required, order_index
                                FROM content_items WHERE id = $1
                            `, [createdContent.id]);

                            expect(retrieveResult.rows.length).toBe(1);
                            const retrievedContent = retrieveResult.rows[0];

                            expect(retrievedContent.id).toBe(createdContent.id);
                            expect(retrievedContent.lesson_id).toBe(testLesson.id);
                            expect(retrievedContent.content_type).toBe('assignment');
                            expect(retrievedContent.title).toBe(contentData.title.trim());
                            expect(retrievedContent.description).toBe(contentData.description);
                            expect(retrievedContent.is_required).toBe(contentData.isRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [createdContent.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a resource content item is created with valid data, retrieving it should return the same data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        resourceType: fc.constantFrom('file', 'link'),
                        resourceUrl: fc.option(fc.webUrl(), { nil: null }),
                        filePath: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
                        isRequired: fc.boolean()
                    }),
                    async (contentData) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, description, 
                                resource_type, resource_url, file_path, is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
                            RETURNING id, lesson_id, content_type, title, description, 
                                      resource_type, resource_url, file_path, is_required, order_index
                        `, [
                            testLesson.id,
                            'resource',
                            contentData.title.trim(),
                            contentData.description,
                            contentData.resourceType,
                            contentData.resourceUrl,
                            contentData.filePath,
                            contentData.isRequired
                        ]);

                        const createdContent = createResult.rows[0];

                        try {
                            const retrieveResult = await query(`
                                SELECT id, lesson_id, content_type, title, description, 
                                       resource_type, resource_url, file_path, is_required, order_index
                                FROM content_items WHERE id = $1
                            `, [createdContent.id]);

                            expect(retrieveResult.rows.length).toBe(1);
                            const retrievedContent = retrieveResult.rows[0];

                            expect(retrievedContent.id).toBe(createdContent.id);
                            expect(retrievedContent.lesson_id).toBe(testLesson.id);
                            expect(retrievedContent.content_type).toBe('resource');
                            expect(retrievedContent.title).toBe(contentData.title.trim());
                            expect(retrievedContent.description).toBe(contentData.description);
                            expect(retrievedContent.resource_type).toBe(contentData.resourceType);
                            expect(retrievedContent.resource_url).toBe(contentData.resourceUrl);
                            expect(retrievedContent.file_path).toBe(contentData.filePath);
                            expect(retrievedContent.is_required).toBe(contentData.isRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [createdContent.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 2: Updates Persist Correctly', () => {
        test('when a video content item is updated with new data, retrieving it should return the updated data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        initialTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        initialDescription: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        initialVideoUrl: fc.option(fc.webUrl(), { nil: null }),
                        initialDuration: fc.option(fc.integer({ min: 1, max: 300 }), { nil: null }),
                        initialIsRequired: fc.boolean(),
                        updatedTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        updatedDescription: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        updatedVideoUrl: fc.option(fc.webUrl(), { nil: null }),
                        updatedDuration: fc.option(fc.integer({ min: 1, max: 300 }), { nil: null }),
                        updatedIsRequired: fc.boolean()
                    }),
                    async (data) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, description, 
                                video_url, duration, is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
                            RETURNING id
                        `, [
                            testLesson.id,
                            'video',
                            data.initialTitle.trim(),
                            data.initialDescription,
                            data.initialVideoUrl,
                            data.initialDuration,
                            data.initialIsRequired
                        ]);

                        const contentId = createResult.rows[0].id;

                        try {
                            await query(`
                                UPDATE content_items
                                SET title = $1, description = $2, video_url = $3, 
                                    duration = $4, is_required = $5
                                WHERE id = $6
                            `, [
                                data.updatedTitle.trim(),
                                data.updatedDescription,
                                data.updatedVideoUrl,
                                data.updatedDuration,
                                data.updatedIsRequired,
                                contentId
                            ]);

                            const retrieveResult = await query(`
                                SELECT title, description, video_url, duration, is_required 
                                FROM content_items WHERE id = $1
                            `, [contentId]);

                            const retrievedContent = retrieveResult.rows[0];
                            expect(retrievedContent.title).toBe(data.updatedTitle.trim());
                            expect(retrievedContent.description).toBe(data.updatedDescription);
                            expect(retrievedContent.video_url).toBe(data.updatedVideoUrl);
                            expect(retrievedContent.duration).toBe(data.updatedDuration);
                            expect(retrievedContent.is_required).toBe(data.updatedIsRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a text content item is updated with new data, retrieving it should return the updated data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        initialTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        initialTextContent: fc.option(fc.string({ maxLength: 5000 }), { nil: null }),
                        initialIsRequired: fc.boolean(),
                        updatedTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        updatedDescription: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        updatedTextContent: fc.option(fc.string({ maxLength: 5000 }), { nil: null }),
                        updatedIsRequired: fc.boolean()
                    }),
                    async (data) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, text_content, is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, 0)
                            RETURNING id
                        `, [
                            testLesson.id,
                            'text',
                            data.initialTitle.trim(),
                            data.initialTextContent,
                            data.initialIsRequired
                        ]);

                        const contentId = createResult.rows[0].id;

                        try {
                            await query(`
                                UPDATE content_items
                                SET title = $1, description = $2, text_content = $3, is_required = $4
                                WHERE id = $5
                            `, [
                                data.updatedTitle.trim(),
                                data.updatedDescription,
                                data.updatedTextContent,
                                data.updatedIsRequired,
                                contentId
                            ]);

                            const retrieveResult = await query(`
                                SELECT title, description, text_content, is_required 
                                FROM content_items WHERE id = $1
                            `, [contentId]);

                            const retrievedContent = retrieveResult.rows[0];
                            expect(retrievedContent.title).toBe(data.updatedTitle.trim());
                            expect(retrievedContent.description).toBe(data.updatedDescription);
                            expect(retrievedContent.text_content).toBe(data.updatedTextContent);
                            expect(retrievedContent.is_required).toBe(data.updatedIsRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a resource content item is updated with new data, retrieving it should return the updated data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        initialTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        initialResourceType: fc.constantFrom('file', 'link'),
                        initialResourceUrl: fc.option(fc.webUrl(), { nil: null }),
                        initialIsRequired: fc.boolean(),
                        updatedTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        updatedDescription: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        updatedResourceType: fc.constantFrom('file', 'link'),
                        updatedResourceUrl: fc.option(fc.webUrl(), { nil: null }),
                        updatedFilePath: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
                        updatedIsRequired: fc.boolean()
                    }),
                    async (data) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, resource_type, 
                                resource_url, is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, 0)
                            RETURNING id
                        `, [
                            testLesson.id,
                            'resource',
                            data.initialTitle.trim(),
                            data.initialResourceType,
                            data.initialResourceUrl,
                            data.initialIsRequired
                        ]);

                        const contentId = createResult.rows[0].id;

                        try {
                            await query(`
                                UPDATE content_items
                                SET title = $1, description = $2, resource_type = $3, 
                                    resource_url = $4, file_path = $5, is_required = $6
                                WHERE id = $7
                            `, [
                                data.updatedTitle.trim(),
                                data.updatedDescription,
                                data.updatedResourceType,
                                data.updatedResourceUrl,
                                data.updatedFilePath,
                                data.updatedIsRequired,
                                contentId
                            ]);

                            const retrieveResult = await query(`
                                SELECT title, description, resource_type, resource_url, 
                                       file_path, is_required 
                                FROM content_items WHERE id = $1
                            `, [contentId]);

                            const retrievedContent = retrieveResult.rows[0];
                            expect(retrievedContent.title).toBe(data.updatedTitle.trim());
                            expect(retrievedContent.description).toBe(data.updatedDescription);
                            expect(retrievedContent.resource_type).toBe(data.updatedResourceType);
                            expect(retrievedContent.resource_url).toBe(data.updatedResourceUrl);
                            expect(retrievedContent.file_path).toBe(data.updatedFilePath);
                            expect(retrievedContent.is_required).toBe(data.updatedIsRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when multiple content types are created and updated, all should persist correctly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('video', 'text', 'quiz', 'assignment', 'resource'),
                    fc.record({
                        initialTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        updatedTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        updatedDescription: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        updatedIsRequired: fc.boolean()
                    }),
                    async (contentType, data) => {
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, is_required, order_index
                            )
                            VALUES ($1, $2, $3, $4, 0)
                            RETURNING id
                        `, [testLesson.id, contentType, data.initialTitle.trim(), true]);

                        const contentId = createResult.rows[0].id;

                        try {
                            await query(`
                                UPDATE content_items
                                SET title = $1, description = $2, is_required = $3
                                WHERE id = $4
                            `, [
                                data.updatedTitle.trim(),
                                data.updatedDescription,
                                data.updatedIsRequired,
                                contentId
                            ]);

                            const retrieveResult = await query(`
                                SELECT content_type, title, description, is_required 
                                FROM content_items WHERE id = $1
                            `, [contentId]);

                            const retrievedContent = retrieveResult.rows[0];
                            expect(retrievedContent.content_type).toBe(contentType);
                            expect(retrievedContent.title).toBe(data.updatedTitle.trim());
                            expect(retrievedContent.description).toBe(data.updatedDescription);
                            expect(retrievedContent.is_required).toBe(data.updatedIsRequired);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
