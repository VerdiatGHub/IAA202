const fc = require('fast-check');
const { query } = require('../../config/db');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');

// Feature: course-content-management, Property 1: CRUD Operations Preserve Data Integrity
// Feature: course-content-management, Property 4: Order Assignment
// Validates: Requirements 2.1, 2.2, 2.4

describe('Lesson CRUD Property Tests', () => {
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

    describe('Property 1: CRUD Operations Preserve Data Integrity', () => {
        test('when a lesson is created with valid data, retrieving it should return the same data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        content: fc.option(fc.string({ maxLength: 5000 }), { nil: null }),
                        videoUrl: fc.option(fc.webUrl(), { nil: null }),
                        duration: fc.option(fc.integer({ min: 1, max: 300 }), { nil: null }),
                        isRequired: fc.boolean()
                    }),
                    async (lessonData) => {
                        const createResult = await query(`
                            INSERT INTO lessons (course_id, module_id, title, content, video_url, duration, is_required, order_index)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
                            RETURNING id, course_id, module_id, title, content, video_url, duration, is_required, order_index
                        `, [
                            testCourse.id,
                            testModule.id,
                            lessonData.title.trim(),
                            lessonData.content,
                            lessonData.videoUrl,
                            lessonData.duration,
                            lessonData.isRequired
                        ]);

                        const createdLesson = createResult.rows[0];

                        try {
                            const retrieveResult = await query(`
                                SELECT id, course_id, module_id, title, content, video_url, duration, is_required, order_index
                                FROM lessons WHERE id = $1
                            `, [createdLesson.id]);

                            expect(retrieveResult.rows.length).toBe(1);
                            const retrievedLesson = retrieveResult.rows[0];

                            expect(retrievedLesson.id).toBe(createdLesson.id);
                            expect(retrievedLesson.course_id).toBe(testCourse.id);
                            expect(retrievedLesson.module_id).toBe(testModule.id);
                            expect(retrievedLesson.title).toBe(lessonData.title.trim());
                            expect(retrievedLesson.content).toBe(lessonData.content);
                            expect(retrievedLesson.video_url).toBe(lessonData.videoUrl);
                            expect(retrievedLesson.duration).toBe(lessonData.duration);
                            expect(retrievedLesson.is_required).toBe(lessonData.isRequired);
                        } finally {
                            await query('DELETE FROM lessons WHERE id = $1', [createdLesson.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a lesson is updated with new data, retrieving it should return the updated data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        initialTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        initialContent: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        initialIsRequired: fc.boolean(),
                        updatedTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        updatedContent: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        updatedVideoUrl: fc.option(fc.webUrl(), { nil: null }),
                        updatedDuration: fc.option(fc.integer({ min: 1, max: 300 }), { nil: null }),
                        updatedIsRequired: fc.boolean()
                    }),
                    async (data) => {
                        const createResult = await query(`
                            INSERT INTO lessons (course_id, module_id, title, content, is_required, order_index)
                            VALUES ($1, $2, $3, $4, $5, 0)
                            RETURNING id
                        `, [testCourse.id, testModule.id, data.initialTitle.trim(), data.initialContent, data.initialIsRequired]);

                        const lessonId = createResult.rows[0].id;

                        try {
                            await query(`
                                UPDATE lessons
                                SET title = $1, content = $2, video_url = $3, duration = $4, is_required = $5
                                WHERE id = $6
                            `, [data.updatedTitle.trim(), data.updatedContent, data.updatedVideoUrl, data.updatedDuration, data.updatedIsRequired, lessonId]);

                            const retrieveResult = await query(`
                                SELECT title, content, video_url, duration, is_required FROM lessons WHERE id = $1
                            `, [lessonId]);

                            const retrievedLesson = retrieveResult.rows[0];
                            expect(retrievedLesson.title).toBe(data.updatedTitle.trim());
                            expect(retrievedLesson.content).toBe(data.updatedContent);
                            expect(retrievedLesson.video_url).toBe(data.updatedVideoUrl);
                            expect(retrievedLesson.duration).toBe(data.updatedDuration);
                            expect(retrievedLesson.is_required).toBe(data.updatedIsRequired);
                        } finally {
                            await query('DELETE FROM lessons WHERE id = $1', [lessonId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });


    describe('Property 4: Order Assignment', () => {
        test('when a new lesson is added, its order_index should be max + 1 or 0 if no siblings exist', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 0, max: 5 }),
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        content: fc.option(fc.string({ maxLength: 1000 }), { nil: null })
                    }),
                    async (numExistingLessons, newLessonData) => {
                        const existingLessons = [];
                        for (let i = 0; i < numExistingLessons; i++) {
                            const result = await query(`
                                INSERT INTO lessons (course_id, module_id, title, order_index)
                                VALUES ($1, $2, $3, $4) RETURNING id
                            `, [testCourse.id, testModule.id, `Existing ${i}`, i]);
                            existingLessons.push(result.rows[0]);
                        }

                        try {
                            const expectedOrderIndex = numExistingLessons;
                            const orderResult = await query(
                                'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM lessons WHERE module_id = $1',
                                [testModule.id]
                            );
                            const nextOrder = orderResult.rows[0].next_order;

                            expect(nextOrder).toBe(expectedOrderIndex);

                            const createResult = await query(`
                                INSERT INTO lessons (course_id, module_id, title, content, order_index)
                                VALUES ($1, $2, $3, $4, $5) RETURNING id, order_index
                            `, [testCourse.id, testModule.id, newLessonData.title.trim(), newLessonData.content, nextOrder]);

                            const newLesson = createResult.rows[0];
                            expect(newLesson.order_index).toBe(expectedOrderIndex);

                            const allLessonsResult = await query(
                                'SELECT order_index FROM lessons WHERE module_id = $1',
                                [testModule.id]
                            );
                            const orderIndices = allLessonsResult.rows.map(row => row.order_index);
                            const uniqueIndices = new Set(orderIndices);
                            expect(uniqueIndices.size).toBe(orderIndices.length);

                            await query('DELETE FROM lessons WHERE id = $1', [newLesson.id]);
                        } finally {
                            for (const lesson of existingLessons) {
                                await query('DELETE FROM lessons WHERE id = $1', [lesson.id]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when multiple lessons are added sequentially, each should get the next order_index', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)
                        }),
                        { minLength: 2, maxLength: 6 }
                    ),
                    async (lessonsData) => {
                        const createdLessons = [];

                        try {
                            for (let i = 0; i < lessonsData.length; i++) {
                                const orderResult = await query(
                                    'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM lessons WHERE module_id = $1',
                                    [testModule.id]
                                );
                                const nextOrder = orderResult.rows[0].next_order;
                                expect(nextOrder).toBe(i);

                                const createResult = await query(`
                                    INSERT INTO lessons (course_id, module_id, title, order_index)
                                    VALUES ($1, $2, $3, $4) RETURNING id, order_index
                                `, [testCourse.id, testModule.id, lessonsData[i].title.trim(), nextOrder]);

                                const newLesson = createResult.rows[0];
                                createdLessons.push(newLesson);
                                expect(newLesson.order_index).toBe(i);
                            }

                            const allLessonsResult = await query(
                                'SELECT order_index FROM lessons WHERE module_id = $1 ORDER BY order_index',
                                [testModule.id]
                            );

                            expect(allLessonsResult.rows.length).toBe(lessonsData.length);
                            for (let i = 0; i < allLessonsResult.rows.length; i++) {
                                expect(allLessonsResult.rows[i].order_index).toBe(i);
                            }
                        } finally {
                            for (const lesson of createdLessons) {
                                await query('DELETE FROM lessons WHERE id = $1', [lesson.id]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('order assignment should work with non-sequential existing indices', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 2, maxLength: 5 }),
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)
                    }),
                    async (orderIndices, newLessonData) => {
                        const existingLessons = [];
                        for (let i = 0; i < orderIndices.length; i++) {
                            const result = await query(`
                                INSERT INTO lessons (course_id, module_id, title, order_index)
                                VALUES ($1, $2, $3, $4) RETURNING id
                            `, [testCourse.id, testModule.id, `Lesson ${i}`, orderIndices[i]]);
                            existingLessons.push(result.rows[0]);
                        }

                        try {
                            const maxOrderIndex = Math.max(...orderIndices);
                            const orderResult = await query(
                                'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM lessons WHERE module_id = $1',
                                [testModule.id]
                            );
                            const nextOrder = orderResult.rows[0].next_order;

                            expect(nextOrder).toBe(maxOrderIndex + 1);

                            const createResult = await query(`
                                INSERT INTO lessons (course_id, module_id, title, order_index)
                                VALUES ($1, $2, $3, $4) RETURNING id, order_index
                            `, [testCourse.id, testModule.id, newLessonData.title.trim(), nextOrder]);

                            const newLesson = createResult.rows[0];
                            expect(newLesson.order_index).toBe(maxOrderIndex + 1);

                            await query('DELETE FROM lessons WHERE id = $1', [newLesson.id]);
                        } finally {
                            for (const lesson of existingLessons) {
                                await query('DELETE FROM lessons WHERE id = $1', [lesson.id]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
