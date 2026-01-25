const fc = require('fast-check');
const { query } = require('../../config/db');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');

// Feature: course-content-management, Property 3: Cascading Deletion
// Validates: Requirements 2.3

describe('Lesson Cascading Deletion Property Tests', () => {
    let testUser;
    let testCourse;
    let testModule;

    beforeAll(async () => {
        testUser = await createTestUser({ role: 'instructor' });
        testCourse = await createTestCourse(testUser.id);
        testModule = await createTestModule(testCourse.id);
    });

    afterAll(async () => {
        await cleanupTestData();
        await closePool();
    });

    describe('Property 3: Cascading Deletion', () => {
        test('when a lesson is deleted, all its content items should also be deleted', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        lessonTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        contentItems: fc.array(
                            fc.record({
                                contentType: fc.constantFrom('video', 'text', 'quiz', 'assignment', 'resource'),
                                title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                                description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
                                // Video fields
                                videoUrl: fc.option(fc.webUrl(), { nil: null }),
                                duration: fc.option(fc.integer({ min: 1, max: 300 }), { nil: null }),
                                // Text fields
                                textContent: fc.option(fc.string({ maxLength: 2000 }), { nil: null }),
                                // Resource fields
                                resourceType: fc.option(fc.constantFrom('file', 'link'), { nil: null }),
                                resourceUrl: fc.option(fc.webUrl(), { nil: null })
                            }),
                            { minLength: 1, maxLength: 10 }
                        )
                    }),
                    async (data) => {
                        // Create a lesson
                        const lessonResult = await query(`
                            INSERT INTO lessons (course_id, module_id, title, order_index)
                            VALUES ($1, $2, $3, 0)
                            RETURNING id
                        `, [testCourse.id, testModule.id, data.lessonTitle.trim()]);

                        const lessonId = lessonResult.rows[0].id;
                        const createdContentIds = [];

                        try {
                            // Create content items for the lesson
                            for (let i = 0; i < data.contentItems.length; i++) {
                                const item = data.contentItems[i];
                                
                                const contentResult = await query(`
                                    INSERT INTO content_items (
                                        lesson_id, content_type, title, description, order_index,
                                        video_url, duration, text_content, resource_type, resource_url
                                    )
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                                    RETURNING id
                                `, [
                                    lessonId,
                                    item.contentType,
                                    item.title.trim(),
                                    item.description,
                                    i,
                                    item.videoUrl,
                                    item.duration,
                                    item.textContent,
                                    item.resourceType,
                                    item.resourceUrl
                                ]);

                                createdContentIds.push(contentResult.rows[0].id);
                            }

                            // Verify content items were created
                            const beforeDeleteResult = await query(
                                'SELECT id FROM content_items WHERE lesson_id = $1',
                                [lessonId]
                            );
                            expect(beforeDeleteResult.rows.length).toBe(data.contentItems.length);

                            // Delete the lesson
                            await query('DELETE FROM lessons WHERE id = $1', [lessonId]);

                            // Verify the lesson was deleted
                            const lessonCheckResult = await query(
                                'SELECT id FROM lessons WHERE id = $1',
                                [lessonId]
                            );
                            expect(lessonCheckResult.rows.length).toBe(0);

                            // Verify all content items were cascaded deleted
                            const afterDeleteResult = await query(
                                'SELECT id FROM content_items WHERE lesson_id = $1',
                                [lessonId]
                            );
                            expect(afterDeleteResult.rows.length).toBe(0);

                            // Verify each specific content item was deleted
                            for (const contentId of createdContentIds) {
                                const contentCheckResult = await query(
                                    'SELECT id FROM content_items WHERE id = $1',
                                    [contentId]
                                );
                                expect(contentCheckResult.rows.length).toBe(0);
                            }
                        } catch (error) {
                            // Clean up in case of error
                            await query('DELETE FROM lessons WHERE id = $1', [lessonId]);
                            throw error;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a lesson with no content items is deleted, it should be removed without errors', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        lessonTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)
                    }),
                    async (data) => {
                        // Create a lesson without content items
                        const lessonResult = await query(`
                            INSERT INTO lessons (course_id, module_id, title, order_index)
                            VALUES ($1, $2, $3, 0)
                            RETURNING id
                        `, [testCourse.id, testModule.id, data.lessonTitle.trim()]);

                        const lessonId = lessonResult.rows[0].id;

                        try {
                            // Verify no content items exist
                            const beforeDeleteResult = await query(
                                'SELECT id FROM content_items WHERE lesson_id = $1',
                                [lessonId]
                            );
                            expect(beforeDeleteResult.rows.length).toBe(0);

                            // Delete the lesson
                            const deleteResult = await query(
                                'DELETE FROM lessons WHERE id = $1',
                                [lessonId]
                            );
                            expect(deleteResult.rowCount).toBe(1);

                            // Verify the lesson was deleted
                            const lessonCheckResult = await query(
                                'SELECT id FROM lessons WHERE id = $1',
                                [lessonId]
                            );
                            expect(lessonCheckResult.rows.length).toBe(0);
                        } catch (error) {
                            // Clean up in case of error
                            await query('DELETE FROM lessons WHERE id = $1', [lessonId]);
                            throw error;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a lesson with mixed content types is deleted, all content types should be cascaded deleted', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        lessonTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        numVideos: fc.integer({ min: 1, max: 3 }),
                        numTexts: fc.integer({ min: 1, max: 3 }),
                        numResources: fc.integer({ min: 1, max: 3 })
                    }),
                    async (data) => {
                        // Create a lesson
                        const lessonResult = await query(`
                            INSERT INTO lessons (course_id, module_id, title, order_index)
                            VALUES ($1, $2, $3, 0)
                            RETURNING id
                        `, [testCourse.id, testModule.id, data.lessonTitle.trim()]);

                        const lessonId = lessonResult.rows[0].id;
                        const contentByType = { video: [], text: [], resource: [] };

                        try {
                            // Create video content items
                            for (let i = 0; i < data.numVideos; i++) {
                                const result = await query(`
                                    INSERT INTO content_items (lesson_id, content_type, title, order_index, video_url)
                                    VALUES ($1, 'video', $2, $3, $4)
                                    RETURNING id
                                `, [lessonId, `Video ${i}`, i, 'https://example.com/video']);
                                contentByType.video.push(result.rows[0].id);
                            }

                            // Create text content items
                            for (let i = 0; i < data.numTexts; i++) {
                                const result = await query(`
                                    INSERT INTO content_items (lesson_id, content_type, title, order_index, text_content)
                                    VALUES ($1, 'text', $2, $3, $4)
                                    RETURNING id
                                `, [lessonId, `Text ${i}`, data.numVideos + i, 'Sample text content']);
                                contentByType.text.push(result.rows[0].id);
                            }

                            // Create resource content items
                            for (let i = 0; i < data.numResources; i++) {
                                const result = await query(`
                                    INSERT INTO content_items (lesson_id, content_type, title, order_index, resource_type, resource_url)
                                    VALUES ($1, 'resource', $2, $3, 'link', $4)
                                    RETURNING id
                                `, [lessonId, `Resource ${i}`, data.numVideos + data.numTexts + i, 'https://example.com/resource']);
                                contentByType.resource.push(result.rows[0].id);
                            }

                            const totalContentItems = data.numVideos + data.numTexts + data.numResources;

                            // Verify all content items were created
                            const beforeDeleteResult = await query(
                                'SELECT id, content_type FROM content_items WHERE lesson_id = $1',
                                [lessonId]
                            );
                            expect(beforeDeleteResult.rows.length).toBe(totalContentItems);

                            // Verify counts by type
                            const videoCount = beforeDeleteResult.rows.filter(r => r.content_type === 'video').length;
                            const textCount = beforeDeleteResult.rows.filter(r => r.content_type === 'text').length;
                            const resourceCount = beforeDeleteResult.rows.filter(r => r.content_type === 'resource').length;
                            
                            expect(videoCount).toBe(data.numVideos);
                            expect(textCount).toBe(data.numTexts);
                            expect(resourceCount).toBe(data.numResources);

                            // Delete the lesson
                            await query('DELETE FROM lessons WHERE id = $1', [lessonId]);

                            // Verify all content items of all types were deleted
                            const afterDeleteResult = await query(
                                'SELECT id FROM content_items WHERE lesson_id = $1',
                                [lessonId]
                            );
                            expect(afterDeleteResult.rows.length).toBe(0);

                            // Verify each specific content item was deleted
                            for (const type in contentByType) {
                                for (const contentId of contentByType[type]) {
                                    const contentCheckResult = await query(
                                        'SELECT id FROM content_items WHERE id = $1',
                                        [contentId]
                                    );
                                    expect(contentCheckResult.rows.length).toBe(0);
                                }
                            }
                        } catch (error) {
                            // Clean up in case of error
                            await query('DELETE FROM lessons WHERE id = $1', [lessonId]);
                            throw error;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('deleting one lesson should not affect content items of other lessons', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        lesson1Title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        lesson2Title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        lesson1ContentCount: fc.integer({ min: 1, max: 5 }),
                        lesson2ContentCount: fc.integer({ min: 1, max: 5 })
                    }),
                    async (data) => {
                        // Create two lessons
                        const lesson1Result = await query(`
                            INSERT INTO lessons (course_id, module_id, title, order_index)
                            VALUES ($1, $2, $3, 0)
                            RETURNING id
                        `, [testCourse.id, testModule.id, data.lesson1Title.trim()]);
                        const lesson1Id = lesson1Result.rows[0].id;

                        const lesson2Result = await query(`
                            INSERT INTO lessons (course_id, module_id, title, order_index)
                            VALUES ($1, $2, $3, 1)
                            RETURNING id
                        `, [testCourse.id, testModule.id, data.lesson2Title.trim()]);
                        const lesson2Id = lesson2Result.rows[0].id;

                        const lesson2ContentIds = [];

                        try {
                            // Create content items for lesson 1
                            for (let i = 0; i < data.lesson1ContentCount; i++) {
                                await query(`
                                    INSERT INTO content_items (lesson_id, content_type, title, order_index)
                                    VALUES ($1, 'text', $2, $3)
                                `, [lesson1Id, `Lesson 1 Content ${i}`, i]);
                            }

                            // Create content items for lesson 2
                            for (let i = 0; i < data.lesson2ContentCount; i++) {
                                const result = await query(`
                                    INSERT INTO content_items (lesson_id, content_type, title, order_index)
                                    VALUES ($1, 'text', $2, $3)
                                    RETURNING id
                                `, [lesson2Id, `Lesson 2 Content ${i}`, i]);
                                lesson2ContentIds.push(result.rows[0].id);
                            }

                            // Verify both lessons have their content items
                            const lesson1ContentBefore = await query(
                                'SELECT id FROM content_items WHERE lesson_id = $1',
                                [lesson1Id]
                            );
                            expect(lesson1ContentBefore.rows.length).toBe(data.lesson1ContentCount);

                            const lesson2ContentBefore = await query(
                                'SELECT id FROM content_items WHERE lesson_id = $1',
                                [lesson2Id]
                            );
                            expect(lesson2ContentBefore.rows.length).toBe(data.lesson2ContentCount);

                            // Delete lesson 1
                            await query('DELETE FROM lessons WHERE id = $1', [lesson1Id]);

                            // Verify lesson 1 and its content items are deleted
                            const lesson1Check = await query(
                                'SELECT id FROM lessons WHERE id = $1',
                                [lesson1Id]
                            );
                            expect(lesson1Check.rows.length).toBe(0);

                            const lesson1ContentAfter = await query(
                                'SELECT id FROM content_items WHERE lesson_id = $1',
                                [lesson1Id]
                            );
                            expect(lesson1ContentAfter.rows.length).toBe(0);

                            // Verify lesson 2 and its content items still exist
                            const lesson2Check = await query(
                                'SELECT id FROM lessons WHERE id = $1',
                                [lesson2Id]
                            );
                            expect(lesson2Check.rows.length).toBe(1);

                            const lesson2ContentAfter = await query(
                                'SELECT id FROM content_items WHERE lesson_id = $1',
                                [lesson2Id]
                            );
                            expect(lesson2ContentAfter.rows.length).toBe(data.lesson2ContentCount);

                            // Verify each specific content item of lesson 2 still exists
                            for (const contentId of lesson2ContentIds) {
                                const contentCheck = await query(
                                    'SELECT id FROM content_items WHERE id = $1',
                                    [contentId]
                                );
                                expect(contentCheck.rows.length).toBe(1);
                            }
                        } finally {
                            // Clean up
                            await query('DELETE FROM lessons WHERE id = $1', [lesson1Id]);
                            await query('DELETE FROM lessons WHERE id = $1', [lesson2Id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
