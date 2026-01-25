const fc = require('fast-check');
const moduleService = require('../../services/moduleService');
const { createTestUser, createTestCourse, cleanupTestData, closePool } = require('../helpers/testDb');

// Feature: course-content-management, Property 4: Order Assignment
// Validates: Requirements 1.4

describe('Module Order Assignment Property Tests', () => {
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

    describe('Property 4: Order Assignment', () => {
        test('when a new module is added, its order_index should be one greater than the maximum existing order_index', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 10 }), // Number of modules to create
                    async (numModules) => {
                        const createdModules = [];

                        try {
                            // Create multiple modules sequentially
                            for (let i = 0; i < numModules; i++) {
                                const module = await moduleService.create(testCourse.id, {
                                    title: `Module ${i + 1}`,
                                    description: `Description for module ${i + 1}`
                                });

                                createdModules.push(module);

                                // Verify order_index is correct
                                if (i === 0) {
                                    // First module should have order_index 0
                                    expect(module.orderIndex).toBe(0);
                                } else {
                                    // Each subsequent module should have order_index = previous max + 1
                                    const expectedOrder = createdModules[i - 1].orderIndex + 1;
                                    expect(module.orderIndex).toBe(expectedOrder);
                                }
                            }

                            // Verify all modules have unique, sequential order indices
                            const orderIndices = createdModules.map(m => m.orderIndex);
                            const uniqueIndices = new Set(orderIndices);
                            expect(uniqueIndices.size).toBe(numModules);

                            // Verify they are sequential starting from 0
                            for (let i = 0; i < numModules; i++) {
                                expect(orderIndices).toContain(i);
                            }
                        } finally {
                            // Clean up created modules
                            for (const module of createdModules) {
                                await moduleService.deleteModule(module.id, testCourse.id);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when modules exist with gaps in order_index, new module should still get max + 1', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }),
                    async (orderIndices) => {
                        const createdModules = [];

                        try {
                            // Create modules with specific order indices (simulating gaps)
                            for (let i = 0; i < orderIndices.length; i++) {
                                const module = await moduleService.create(testCourse.id, {
                                    title: `Module ${i}`,
                                    description: `Description ${i}`
                                });

                                // Manually set order_index to create gaps
                                const updated = await moduleService.update(module.id, testCourse.id, {
                                    orderIndex: orderIndices[i]
                                });

                                createdModules.push(updated);
                            }

                            // Now create a new module without specifying order_index
                            const newModule = await moduleService.create(testCourse.id, {
                                title: 'New Module',
                                description: 'Should get max + 1'
                            });

                            createdModules.push(newModule);

                            // Verify new module has order_index = max(existing) + 1
                            const maxExistingOrder = Math.max(...orderIndices);
                            expect(newModule.orderIndex).toBe(maxExistingOrder + 1);
                        } finally {
                            // Clean up
                            for (const module of createdModules) {
                                await moduleService.deleteModule(module.id, testCourse.id);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when no modules exist, first module should have order_index 0', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    async (title) => {
                        // Ensure no modules exist for this course
                        const existingModules = await moduleService.findByCourseId(testCourse.id);
                        for (const module of existingModules) {
                            await moduleService.deleteModule(module.id, testCourse.id);
                        }

                        // Create first module
                        const module = await moduleService.create(testCourse.id, {
                            title: title,
                            description: 'First module'
                        });

                        try {
                            // Verify order_index is 0
                            expect(module.orderIndex).toBe(0);
                        } finally {
                            // Clean up
                            await moduleService.deleteModule(module.id, testCourse.id);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
