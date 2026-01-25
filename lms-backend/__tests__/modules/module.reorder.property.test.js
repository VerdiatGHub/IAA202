const fc = require('fast-check');
const moduleService = require('../../services/moduleService');
const { query } = require('../../config/db');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');

// Feature: course-content-management, Property 5: Reordering Updates All Affected Indices
// Feature: course-content-management, Property 6: Reordering Preserves Relationships
// Validates: Requirements 8.1, 8.3

describe('Module Reordering Property Tests', () => {
    let testUser;
    let testCourse;

    beforeAll(async () => {
        // Create test user and course once for all tests
        testUser = await createTestUser({ role: 'instructor' });
        testCourse = await createTestCourse(testUser.id);
    });

    afterAll(async () => {
        await cleanupTestData();
        await closePool();
    });

    describe('Property 5: Reordering Updates All Affected Indices', () => {
        test('when modules are reordered, all affected entities should have their order_index values updated to reflect the new order, and no two entities should have the same order_index', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate between 2 and 10 modules
                    fc.integer({ min: 2, max: 10 }),
                    async (numModules) => {
                        // Create modules with sequential order indices
                        const modules = [];
                        for (let i = 0; i < numModules; i++) {
                            const module = await createTestModule(testCourse.id, {
                                title: `Module ${i}`,
                                description: `Description ${i}`,
                                orderIndex: i
                            });
                            modules.push(module);
                        }

                        try {
                            // Generate a random permutation of module IDs
                            const shuffledModules = [...modules];
                            // Fisher-Yates shuffle
                            for (let i = shuffledModules.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [shuffledModules[i], shuffledModules[j]] = [shuffledModules[j], shuffledModules[i]];
                            }

                            // Create order map with new indices
                            const orderMap = shuffledModules.map((module, index) => ({
                                id: module.id,
                                orderIndex: index
                            }));

                            // Reorder modules
                            await moduleService.reorder(testCourse.id, orderMap);

                            // Retrieve all modules after reordering
                            const reorderedModules = await moduleService.findByCourseId(testCourse.id);

                            // Property 5.1: All modules should have their order_index updated
                            expect(reorderedModules.length).toBe(numModules);

                            // Property 5.2: order_index values should be sequential starting from 0
                            const sortedByOrder = [...reorderedModules].sort((a, b) => a.orderIndex - b.orderIndex);
                            for (let i = 0; i < sortedByOrder.length; i++) {
                                expect(sortedByOrder[i].orderIndex).toBe(i);
                            }

                            // Property 5.3: No two modules should have the same order_index
                            const orderIndices = reorderedModules.map(m => m.orderIndex);
                            const uniqueIndices = new Set(orderIndices);
                            expect(uniqueIndices.size).toBe(orderIndices.length);

                            // Property 5.4: The order should match the requested order
                            for (let i = 0; i < orderMap.length; i++) {
                                const expectedModule = shuffledModules[i];
                                const actualModule = reorderedModules.find(m => m.id === expectedModule.id);
                                expect(actualModule).toBeDefined();
                                expect(actualModule.orderIndex).toBe(i);
                            }

                        } finally {
                            // Clean up created modules
                            for (const module of modules) {
                                await moduleService.deleteModule(module.id, testCourse.id);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering should handle edge case with minimum modules (2)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title1: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        title2: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
                    }),
                    async (data) => {
                        // Create exactly 2 modules
                        const module1 = await createTestModule(testCourse.id, {
                            title: data.title1,
                            orderIndex: 0
                        });
                        const module2 = await createTestModule(testCourse.id, {
                            title: data.title2,
                            orderIndex: 1
                        });

                        try {
                            // Swap the order
                            const orderMap = [
                                { id: module2.id, orderIndex: 0 },
                                { id: module1.id, orderIndex: 1 }
                            ];

                            await moduleService.reorder(testCourse.id, orderMap);

                            // Verify the swap
                            const reorderedModules = await moduleService.findByCourseId(testCourse.id);
                            const mod1After = reorderedModules.find(m => m.id === module1.id);
                            const mod2After = reorderedModules.find(m => m.id === module2.id);

                            expect(mod1After.orderIndex).toBe(1);
                            expect(mod2After.orderIndex).toBe(0);

                            // No duplicates
                            expect(mod1After.orderIndex).not.toBe(mod2After.orderIndex);

                        } finally {
                            await moduleService.deleteModule(module1.id, testCourse.id);
                            await moduleService.deleteModule(module2.id, testCourse.id);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering should correctly update indices when moving first module to last position', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 3, max: 8 }),
                    async (numModules) => {
                        // Create modules
                        const modules = [];
                        for (let i = 0; i < numModules; i++) {
                            const module = await createTestModule(testCourse.id, {
                                title: `Module ${i}`,
                                orderIndex: i
                            });
                            modules.push(module);
                        }

                        try {
                            // Move first module to last position
                            const firstModule = modules[0];
                            const reorderedIds = [...modules.slice(1), firstModule];
                            const orderMap = reorderedIds.map((module, index) => ({
                                id: module.id,
                                orderIndex: index
                            }));

                            await moduleService.reorder(testCourse.id, orderMap);

                            // Verify all indices are updated correctly
                            const reorderedModules = await moduleService.findByCourseId(testCourse.id);
                            
                            // First module should now be last
                            const movedModule = reorderedModules.find(m => m.id === firstModule.id);
                            expect(movedModule.orderIndex).toBe(numModules - 1);

                            // All other modules should be shifted down
                            for (let i = 1; i < modules.length; i++) {
                                const module = reorderedModules.find(m => m.id === modules[i].id);
                                expect(module.orderIndex).toBe(i - 1);
                            }

                            // Verify no gaps or duplicates
                            const indices = reorderedModules.map(m => m.orderIndex).sort((a, b) => a - b);
                            for (let i = 0; i < indices.length; i++) {
                                expect(indices[i]).toBe(i);
                            }

                        } finally {
                            for (const module of modules) {
                                await moduleService.deleteModule(module.id, testCourse.id);
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
                    async (numModules, permutationSeed) => {
                        // Create modules
                        const modules = [];
                        for (let i = 0; i < numModules; i++) {
                            const module = await createTestModule(testCourse.id, {
                                title: `Module ${i}`,
                                orderIndex: i
                            });
                            modules.push(module);
                        }

                        try {
                            // Generate a permutation based on seed
                            const shuffled = [...modules];
                            for (let i = 0; i < Math.min(permutationSeed.length, numModules); i++) {
                                const swapIndex = permutationSeed[i] % numModules;
                                [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
                            }

                            const orderMap = shuffled.map((module, index) => ({
                                id: module.id,
                                orderIndex: index
                            }));

                            await moduleService.reorder(testCourse.id, orderMap);

                            // Verify the reordering
                            const reorderedModules = await moduleService.findByCourseId(testCourse.id);

                            // Check that each module has the correct order_index
                            for (let i = 0; i < shuffled.length; i++) {
                                const module = reorderedModules.find(m => m.id === shuffled[i].id);
                                expect(module.orderIndex).toBe(i);
                            }

                            // Verify uniqueness
                            const orderIndices = reorderedModules.map(m => m.orderIndex);
                            const uniqueIndices = new Set(orderIndices);
                            expect(uniqueIndices.size).toBe(numModules);

                        } finally {
                            for (const module of modules) {
                                await moduleService.deleteModule(module.id, testCourse.id);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 6: Reordering Preserves Relationships', () => {
        test('when modules are reordered, lessons within each module should remain associated with their original parent module', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate 2-5 modules, each with 1-4 lessons
                    fc.integer({ min: 2, max: 5 }),
                    fc.array(fc.integer({ min: 1, max: 4 }), { minLength: 2, maxLength: 5 }),
                    async (numModules, lessonsPerModule) => {
                        // Ensure we have the right number of lesson counts
                        const lessonCounts = lessonsPerModule.slice(0, numModules);
                        
                        // Create modules with lessons
                        const modulesWithLessons = [];
                        for (let i = 0; i < numModules; i++) {
                            const module = await createTestModule(testCourse.id, {
                                title: `Module ${i}`,
                                orderIndex: i
                            });

                            const lessons = [];
                            const numLessons = lessonCounts[i] || 1;
                            for (let j = 0; j < numLessons; j++) {
                                const lessonResult = await query(`
                                    INSERT INTO lessons (course_id, module_id, title, order_index)
                                    VALUES ($1, $2, $3, $4)
                                    RETURNING id, course_id, module_id, title, order_index
                                `, [testCourse.id, module.id, `Lesson ${i}-${j}`, j]);
                                lessons.push(lessonResult.rows[0]);
                            }

                            modulesWithLessons.push({ module, lessons });
                        }

                        try {
                            // Store original module-lesson relationships
                            const originalRelationships = new Map();
                            for (const { module, lessons } of modulesWithLessons) {
                                originalRelationships.set(module.id, lessons.map(l => l.id));
                            }

                            // Reorder modules (reverse order)
                            const reversedModules = [...modulesWithLessons].reverse();
                            const orderMap = reversedModules.map(({ module }, index) => ({
                                id: module.id,
                                orderIndex: index
                            }));

                            await moduleService.reorder(testCourse.id, orderMap);

                            // Verify relationships are preserved
                            for (const { module, lessons } of modulesWithLessons) {
                                // Check each lesson still belongs to its original module
                                for (const lesson of lessons) {
                                    const lessonResult = await query(
                                        'SELECT module_id FROM lessons WHERE id = $1',
                                        [lesson.id]
                                    );
                                    
                                    expect(lessonResult.rows.length).toBe(1);
                                    expect(lessonResult.rows[0].module_id).toBe(module.id);
                                }

                                // Verify the count of lessons hasn't changed
                                const lessonCountResult = await query(
                                    'SELECT COUNT(*) as count FROM lessons WHERE module_id = $1',
                                    [module.id]
                                );
                                expect(parseInt(lessonCountResult.rows[0].count)).toBe(lessons.length);
                            }

                            // Verify no lessons were orphaned or reassigned
                            for (const [moduleId, lessonIds] of originalRelationships.entries()) {
                                for (const lessonId of lessonIds) {
                                    const lessonResult = await query(
                                        'SELECT module_id FROM lessons WHERE id = $1',
                                        [lessonId]
                                    );
                                    expect(lessonResult.rows[0].module_id).toBe(moduleId);
                                }
                            }

                        } finally {
                            // Clean up lessons and modules
                            for (const { module, lessons } of modulesWithLessons) {
                                for (const lesson of lessons) {
                                    await query('DELETE FROM lessons WHERE id = $1', [lesson.id]);
                                }
                                await moduleService.deleteModule(module.id, testCourse.id);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering modules should not affect lesson order within modules', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 2, max: 4 }),
                    async (numModules) => {
                        // Create modules with multiple lessons each
                        const modulesWithLessons = [];
                        for (let i = 0; i < numModules; i++) {
                            const module = await createTestModule(testCourse.id, {
                                title: `Module ${i}`,
                                orderIndex: i
                            });

                            const lessons = [];
                            for (let j = 0; j < 3; j++) {
                                const lessonResult = await query(`
                                    INSERT INTO lessons (course_id, module_id, title, order_index)
                                    VALUES ($1, $2, $3, $4)
                                    RETURNING id, course_id, module_id, title, order_index
                                `, [testCourse.id, module.id, `Lesson ${i}-${j}`, j]);
                                lessons.push(lessonResult.rows[0]);
                            }

                            modulesWithLessons.push({ module, lessons });
                        }

                        try {
                            // Store original lesson orders
                            const originalLessonOrders = new Map();
                            for (const { module, lessons } of modulesWithLessons) {
                                originalLessonOrders.set(module.id, lessons.map(l => ({
                                    id: l.id,
                                    orderIndex: l.order_index
                                })));
                            }

                            // Reorder modules
                            const shuffled = [...modulesWithLessons];
                            for (let i = shuffled.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                            }

                            const orderMap = shuffled.map(({ module }, index) => ({
                                id: module.id,
                                orderIndex: index
                            }));

                            await moduleService.reorder(testCourse.id, orderMap);

                            // Verify lesson orders within modules are unchanged
                            for (const [moduleId, originalLessons] of originalLessonOrders.entries()) {
                                for (const originalLesson of originalLessons) {
                                    const lessonResult = await query(
                                        'SELECT order_index FROM lessons WHERE id = $1',
                                        [originalLesson.id]
                                    );
                                    
                                    expect(lessonResult.rows.length).toBe(1);
                                    expect(lessonResult.rows[0].order_index).toBe(originalLesson.orderIndex);
                                }
                            }

                        } finally {
                            // Clean up
                            for (const { module, lessons } of modulesWithLessons) {
                                for (const lesson of lessons) {
                                    await query('DELETE FROM lessons WHERE id = $1', [lesson.id]);
                                }
                                await moduleService.deleteModule(module.id, testCourse.id);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('reordering should preserve module metadata (title, description, timestamps)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                            description: fc.option(fc.string({ maxLength: 500 }), { nil: null })
                        }),
                        { minLength: 2, maxLength: 5 }
                    ),
                    async (moduleDataArray) => {
                        // Create modules
                        const modules = [];
                        for (let i = 0; i < moduleDataArray.length; i++) {
                            const module = await createTestModule(testCourse.id, {
                                title: moduleDataArray[i].title,
                                description: moduleDataArray[i].description,
                                orderIndex: i
                            });
                            modules.push(module);
                        }

                        try {
                            // Store original metadata
                            const originalMetadata = modules.map(m => ({
                                id: m.id,
                                title: m.title,
                                description: m.description,
                                createdAt: m.created_at
                            }));

                            // Reorder modules
                            const reversed = [...modules].reverse();
                            const orderMap = reversed.map((module, index) => ({
                                id: module.id,
                                orderIndex: index
                            }));

                            await moduleService.reorder(testCourse.id, orderMap);

                            // Verify metadata is preserved
                            const reorderedModules = await moduleService.findByCourseId(testCourse.id);
                            
                            for (const original of originalMetadata) {
                                const reordered = reorderedModules.find(m => m.id === original.id);
                                
                                expect(reordered).toBeDefined();
                                expect(reordered.title).toBe(original.title);
                                expect(reordered.description).toBe(original.description);
                                expect(reordered.createdAt).toBe(original.createdAt);
                                // updatedAt should be updated
                                expect(reordered.updatedAt).toBeDefined();
                            }

                        } finally {
                            for (const module of modules) {
                                await moduleService.deleteModule(module.id, testCourse.id);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
