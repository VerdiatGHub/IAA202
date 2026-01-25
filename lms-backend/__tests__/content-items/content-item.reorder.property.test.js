const fc = require('fast-check');
const contentItemService = require('../../services/contentItemService');
const { query } = require('../../config/db');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');

// Feature: course-content-management, Property 5: Reordering Updates All Affected Indices
// Feature: course-content-management, Property 6: Reordering Preserves Relationships
// Validates: Requirements 8.1, 8.3

describe('Content Item Reordering Property Tests', () => {
    let testUser;
    let testCourse;
    let testModule;
    let testLesson;

    beforeAll(async () => {
        // Create test user, course, module, and lesson once for all tests
        testUser = await createTestUser({ role: 'instructor' });
        testCourse = await createTestCourse(testUser.id);
        
        const moduleResult = await query(`
            INSERT INTO modules (course_id, title, order_index)
            VALUES ($1, $2, $3)
            RETURNING id, course_id, title, order_index
        `, [testCourse.id, 'Test Module', 0]);
        testModule = moduleResult.rows[0];

        const lessonResult = await query(`
            INSERT INTO lessons (course_id, module_id, title, order_index)
            VALUES ($1, $2, $3, $4)
            RETURNING id, course_id, module_id, title, order_index
        `, [testCourse.id, testModule.id, 'Test Lesson', 0]);
        testLesson = lessonResult.rows[0];
    });

    afterAll(async () => {
        await query('DELETE FROM lessons WHERE id = $1', [testLesson.id]);
        await query('DELETE FROM modules WHERE id = $1', [testModule.id]);
        await cleanupTestData();
        await closePool();
    });

    describe('Property 5: Reordering Updates All Affected Indices', () => {
        test('when content items are reordered, all affected entities should have their order_index values updated to reflect the new order, and no two entities should have the same order_index', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate between 2 and 10 content items
                    fc.integer({ min: 2, max: 10 }),
                    async (numContentItems) => {
                        // Create content items with sequential order indices
                        const contentItems = [];
                        for (let i = 0; i < numContentItems; i++) {
                            const result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, order_index, is_required
                                )
                                VALUES ($1, $2, $3, $4, $5)
                                RETURNING id, lesson_id, content_type, title, order_index
                            `, [testLesson.id, 'text', `Content Item ${i}`, i, true]);
                            contentItems.push(result.rows[0]);
                        }

                        try {
                            // Generate a random permutation of content item IDs
                            const shuffledItems = [...contentItems];
                            // Fisher-Yates shuffle
                            for (let i = shuffledItems.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
                            }

                            // Create order map with new indices
                            const orderMap = shuffledItems.map((item, index) => ({
                                id: item.id,
                                orderIndex: index
                            }));

                            // Reorder content items
                            await contentItemService.reorder(testLesson.id, orderMap);

                            // Retrieve all content items after reordering
                            const reorderedItems = await contentItemService.findByLessonId(testLesson.id);

                            // Property 5.1: All content items should have their order_index updated
                            expect(reorderedItems.length).toBe(numContentItems);

                            // Property 5.2: order_index values should be sequential starting from 0
                            const sortedByOrder = [...reorderedItems].sort((a, b) => a.orderIndex - b.orderIndex);
                            for (let i = 0; i < sortedByOrder.length; i++) {
                                expect(sortedByOrder[i].orderIndex).toBe(i);
                            }

                            // Property 5.3: No two content items should have the same order_index
                            const orderIndices = reorderedItems.map(item => item.orderIndex);
                            const uniqueIndices = new Set(orderIndices);
                            expect(uniqueIndices.size).toBe(orderIndices.length);

                            // Property 5.4: The order should match the requested order
                            for (let i = 0; i < orderMap.length; i++) {
                                const expectedItem = shuffledItems[i];
                                const actualItem = reorderedItems.find(item => item.id === expectedItem.id);
                                expect(actualItem).toBeDefined();
                                expect(actualItem.orderIndex).toBe(i);
                            }

                        } finally {
                            // Clean up created content items
                            for (const item of contentItems) {
                                await query('DELETE FROM content_items WHERE id = $1', [item.id]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering should handle edge case with minimum content items (2)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title1: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        title2: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
                    }),
                    async (data) => {
                        // Create exactly 2 content items
                        const item1Result = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, order_index, is_required
                            )
                            VALUES ($1, $2, $3, $4, $5)
                            RETURNING id, order_index
                        `, [testLesson.id, 'text', data.title1, 0, true]);
                        const item1 = item1Result.rows[0];

                        const item2Result = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, order_index, is_required
                            )
                            VALUES ($1, $2, $3, $4, $5)
                            RETURNING id, order_index
                        `, [testLesson.id, 'text', data.title2, 1, true]);
                        const item2 = item2Result.rows[0];

                        try {
                            // Swap the order
                            const orderMap = [
                                { id: item2.id, orderIndex: 0 },
                                { id: item1.id, orderIndex: 1 }
                            ];

                            await contentItemService.reorder(testLesson.id, orderMap);

                            // Verify the swap
                            const reorderedItems = await contentItemService.findByLessonId(testLesson.id);
                            const item1After = reorderedItems.find(item => item.id === item1.id);
                            const item2After = reorderedItems.find(item => item.id === item2.id);

                            expect(item1After.orderIndex).toBe(1);
                            expect(item2After.orderIndex).toBe(0);

                            // No duplicates
                            expect(item1After.orderIndex).not.toBe(item2After.orderIndex);

                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [item1.id]);
                            await query('DELETE FROM content_items WHERE id = $1', [item2.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering should correctly update indices when moving first content item to last position', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 3, max: 8 }),
                    async (numContentItems) => {
                        // Create content items
                        const contentItems = [];
                        for (let i = 0; i < numContentItems; i++) {
                            const result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, order_index, is_required
                                )
                                VALUES ($1, $2, $3, $4, $5)
                                RETURNING id, order_index
                            `, [testLesson.id, 'text', `Content Item ${i}`, i, true]);
                            contentItems.push(result.rows[0]);
                        }

                        try {
                            // Move first content item to last position
                            const firstItem = contentItems[0];
                            const reorderedIds = [...contentItems.slice(1), firstItem];
                            const orderMap = reorderedIds.map((item, index) => ({
                                id: item.id,
                                orderIndex: index
                            }));

                            await contentItemService.reorder(testLesson.id, orderMap);

                            // Verify all indices are updated correctly
                            const reorderedItems = await contentItemService.findByLessonId(testLesson.id);
                            
                            // First content item should now be last
                            const movedItem = reorderedItems.find(item => item.id === firstItem.id);
                            expect(movedItem.orderIndex).toBe(numContentItems - 1);

                            // All other content items should be shifted down
                            for (let i = 1; i < contentItems.length; i++) {
                                const item = reorderedItems.find(item => item.id === contentItems[i].id);
                                expect(item.orderIndex).toBe(i - 1);
                            }

                            // Verify no gaps or duplicates
                            const indices = reorderedItems.map(item => item.orderIndex).sort((a, b) => a - b);
                            for (let i = 0; i < indices.length; i++) {
                                expect(indices[i]).toBe(i);
                            }

                        } finally {
                            for (const item of contentItems) {
                                await query('DELETE FROM content_items WHERE id = $1', [item.id]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering should handle arbitrary permutations correctly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 3, max: 7 }),
                    fc.array(fc.integer({ min: 0, max: 6 }), { minLength: 3, maxLength: 7 }),
                    async (numContentItems, permutationSeed) => {
                        // Create content items
                        const contentItems = [];
                        for (let i = 0; i < numContentItems; i++) {
                            const result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, order_index, is_required
                                )
                                VALUES ($1, $2, $3, $4, $5)
                                RETURNING id, order_index
                            `, [testLesson.id, 'text', `Content Item ${i}`, i, true]);
                            contentItems.push(result.rows[0]);
                        }

                        try {
                            // Generate a permutation based on seed
                            const shuffled = [...contentItems];
                            for (let i = 0; i < Math.min(permutationSeed.length, numContentItems); i++) {
                                const swapIndex = permutationSeed[i] % numContentItems;
                                [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
                            }

                            const orderMap = shuffled.map((item, index) => ({
                                id: item.id,
                                orderIndex: index
                            }));

                            await contentItemService.reorder(testLesson.id, orderMap);

                            // Verify the reordering
                            const reorderedItems = await contentItemService.findByLessonId(testLesson.id);

                            // Check that each content item has the correct order_index
                            for (let i = 0; i < shuffled.length; i++) {
                                const item = reorderedItems.find(item => item.id === shuffled[i].id);
                                expect(item.orderIndex).toBe(i);
                            }

                            // Verify uniqueness
                            const orderIndices = reorderedItems.map(item => item.orderIndex);
                            const uniqueIndices = new Set(orderIndices);
                            expect(uniqueIndices.size).toBe(numContentItems);

                        } finally {
                            for (const item of contentItems) {
                                await query('DELETE FROM content_items WHERE id = $1', [item.id]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 6: Reordering Preserves Relationships', () => {
        test('when content items are reordered, they should remain associated with their original parent lesson', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate 3-6 content items
                    fc.integer({ min: 3, max: 6 }),
                    async (numContentItems) => {
                        // Create content items
                        const contentItems = [];
                        for (let i = 0; i < numContentItems; i++) {
                            const result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, order_index, is_required
                                )
                                VALUES ($1, $2, $3, $4, $5)
                                RETURNING id, lesson_id, content_type, title, order_index
                            `, [testLesson.id, 'text', `Content Item ${i}`, i, true]);
                            contentItems.push(result.rows[0]);
                        }

                        try {
                            // Store original lesson_id for each content item
                            const originalLessonIds = new Map();
                            for (const item of contentItems) {
                                originalLessonIds.set(item.id, item.lesson_id);
                            }

                            // Reorder content items (reverse order)
                            const reversedItems = [...contentItems].reverse();
                            const orderMap = reversedItems.map((item, index) => ({
                                id: item.id,
                                orderIndex: index
                            }));

                            await contentItemService.reorder(testLesson.id, orderMap);

                            // Verify relationships are preserved
                            for (const item of contentItems) {
                                // Check each content item still belongs to its original lesson
                                const itemResult = await query(
                                    'SELECT lesson_id FROM content_items WHERE id = $1',
                                    [item.id]
                                );
                                
                                expect(itemResult.rows.length).toBe(1);
                                expect(itemResult.rows[0].lesson_id).toBe(testLesson.id);
                                expect(itemResult.rows[0].lesson_id).toBe(originalLessonIds.get(item.id));
                            }

                            // Verify the count of content items hasn't changed
                            const countResult = await query(
                                'SELECT COUNT(*) as count FROM content_items WHERE lesson_id = $1',
                                [testLesson.id]
                            );
                            expect(parseInt(countResult.rows[0].count)).toBe(numContentItems);

                        } finally {
                            // Clean up content items
                            for (const item of contentItems) {
                                await query('DELETE FROM content_items WHERE id = $1', [item.id]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering content items should preserve content type and metadata', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            contentType: fc.constantFrom('video', 'text', 'quiz', 'assignment', 'resource'),
                            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                            description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
                            isRequired: fc.boolean()
                        }),
                        { minLength: 2, maxLength: 5 }
                    ),
                    async (contentDataArray) => {
                        // Create content items with different types
                        const contentItems = [];
                        for (let i = 0; i < contentDataArray.length; i++) {
                            const data = contentDataArray[i];
                            const result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, description, 
                                    is_required, order_index
                                )
                                VALUES ($1, $2, $3, $4, $5, $6)
                                RETURNING id, lesson_id, content_type, title, description, 
                                          is_required, order_index, created_at
                            `, [
                                testLesson.id,
                                data.contentType,
                                data.title.trim(),
                                data.description,
                                data.isRequired,
                                i
                            ]);
                            contentItems.push(result.rows[0]);
                        }

                        try {
                            // Store original metadata
                            const originalMetadata = contentItems.map(item => ({
                                id: item.id,
                                contentType: item.content_type,
                                title: item.title,
                                description: item.description,
                                isRequired: item.is_required,
                                createdAt: item.created_at
                            }));

                            // Reorder content items (reverse)
                            const reversed = [...contentItems].reverse();
                            const orderMap = reversed.map((item, index) => ({
                                id: item.id,
                                orderIndex: index
                            }));

                            await contentItemService.reorder(testLesson.id, orderMap);

                            // Verify metadata is preserved
                            const reorderedItems = await contentItemService.findByLessonId(testLesson.id);
                            
                            for (const original of originalMetadata) {
                                const reordered = reorderedItems.find(item => item.id === original.id);
                                
                                expect(reordered).toBeDefined();
                                expect(reordered.contentType).toBe(original.contentType);
                                expect(reordered.title).toBe(original.title);
                                expect(reordered.description).toBe(original.description);
                                expect(reordered.isRequired).toBe(original.isRequired);
                                expect(reordered.createdAt).toBe(original.createdAt);
                                // updatedAt should be updated
                                expect(reordered.updatedAt).toBeDefined();
                            }

                        } finally {
                            for (const item of contentItems) {
                                await query('DELETE FROM content_items WHERE id = $1', [item.id]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering content items with type-specific data should preserve all fields', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        videoUrl: fc.webUrl(),
                        duration: fc.integer({ min: 1, max: 300 }),
                        textContent: fc.string({ minLength: 10, maxLength: 1000 }),
                        resourceUrl: fc.webUrl()
                    }),
                    async (data) => {
                        // Create content items with type-specific data
                        const videoResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, video_url, duration, 
                                order_index, is_required
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                            RETURNING id, video_url, duration
                        `, [testLesson.id, 'video', 'Video Content', data.videoUrl, data.duration, 0, true]);
                        const videoItem = videoResult.rows[0];

                        const textResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, text_content, 
                                order_index, is_required
                            )
                            VALUES ($1, $2, $3, $4, $5, $6)
                            RETURNING id, text_content
                        `, [testLesson.id, 'text', 'Text Content', data.textContent, 1, true]);
                        const textItem = textResult.rows[0];

                        const resourceResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, resource_type, resource_url, 
                                order_index, is_required
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                            RETURNING id, resource_type, resource_url
                        `, [testLesson.id, 'resource', 'Resource Content', 'link', data.resourceUrl, 2, true]);
                        const resourceItem = resourceResult.rows[0];

                        try {
                            // Reorder: swap first and last
                            const orderMap = [
                                { id: resourceItem.id, orderIndex: 0 },
                                { id: textItem.id, orderIndex: 1 },
                                { id: videoItem.id, orderIndex: 2 }
                            ];

                            await contentItemService.reorder(testLesson.id, orderMap);

                            // Verify type-specific data is preserved
                            const videoCheck = await query(
                                'SELECT video_url, duration FROM content_items WHERE id = $1',
                                [videoItem.id]
                            );
                            expect(videoCheck.rows[0].video_url).toBe(data.videoUrl);
                            expect(videoCheck.rows[0].duration).toBe(data.duration);

                            const textCheck = await query(
                                'SELECT text_content FROM content_items WHERE id = $1',
                                [textItem.id]
                            );
                            expect(textCheck.rows[0].text_content).toBe(data.textContent);

                            const resourceCheck = await query(
                                'SELECT resource_type, resource_url FROM content_items WHERE id = $1',
                                [resourceItem.id]
                            );
                            expect(resourceCheck.rows[0].resource_type).toBe('link');
                            expect(resourceCheck.rows[0].resource_url).toBe(data.resourceUrl);

                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [videoItem.id]);
                            await query('DELETE FROM content_items WHERE id = $1', [textItem.id]);
                            await query('DELETE FROM content_items WHERE id = $1', [resourceItem.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering should not affect content items in other lessons', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 2, max: 4 }),
                    async (numItemsPerLesson) => {
                        // Create a second lesson
                        const lesson2Result = await query(`
                            INSERT INTO lessons (course_id, module_id, title, order_index)
                            VALUES ($1, $2, $3, $4)
                            RETURNING id
                        `, [testCourse.id, testModule.id, 'Test Lesson 2', 1]);
                        const lesson2 = lesson2Result.rows[0];

                        // Create content items in both lessons
                        const lesson1Items = [];
                        const lesson2Items = [];

                        for (let i = 0; i < numItemsPerLesson; i++) {
                            const item1Result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, order_index, is_required
                                )
                                VALUES ($1, $2, $3, $4, $5)
                                RETURNING id, order_index
                            `, [testLesson.id, 'text', `Lesson1 Item ${i}`, i, true]);
                            lesson1Items.push(item1Result.rows[0]);

                            const item2Result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, order_index, is_required
                                )
                                VALUES ($1, $2, $3, $4, $5)
                                RETURNING id, order_index
                            `, [lesson2.id, 'text', `Lesson2 Item ${i}`, i, true]);
                            lesson2Items.push(item2Result.rows[0]);
                        }

                        try {
                            // Store original order of lesson2 items
                            const originalLesson2Order = lesson2Items.map(item => ({
                                id: item.id,
                                orderIndex: item.order_index
                            }));

                            // Reorder lesson1 items (reverse)
                            const reversed = [...lesson1Items].reverse();
                            const orderMap = reversed.map((item, index) => ({
                                id: item.id,
                                orderIndex: index
                            }));

                            await contentItemService.reorder(testLesson.id, orderMap);

                            // Verify lesson2 items are unchanged
                            for (const originalItem of originalLesson2Order) {
                                const itemResult = await query(
                                    'SELECT order_index FROM content_items WHERE id = $1',
                                    [originalItem.id]
                                );
                                
                                expect(itemResult.rows.length).toBe(1);
                                expect(itemResult.rows[0].order_index).toBe(originalItem.orderIndex);
                            }

                            // Verify lesson2 still has all its items
                            const lesson2CountResult = await query(
                                'SELECT COUNT(*) as count FROM content_items WHERE lesson_id = $1',
                                [lesson2.id]
                            );
                            expect(parseInt(lesson2CountResult.rows[0].count)).toBe(numItemsPerLesson);

                        } finally {
                            // Clean up
                            for (const item of lesson1Items) {
                                await query('DELETE FROM content_items WHERE id = $1', [item.id]);
                            }
                            for (const item of lesson2Items) {
                                await query('DELETE FROM content_items WHERE id = $1', [item.id]);
                            }
                            await query('DELETE FROM lessons WHERE id = $1', [lesson2.id]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
