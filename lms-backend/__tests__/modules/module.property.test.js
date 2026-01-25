const fc = require('fast-check');
const moduleService = require('../../services/moduleService');
const { createTestUser, createTestCourse, cleanupTestData, closePool } = require('../helpers/testDb');

// Feature: course-content-management, Property 1: CRUD Operations Preserve Data Integrity
// Validates: Requirements 1.1, 1.2

describe('Module CRUD Property Tests', () => {
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

    describe('Property 1: CRUD Operations Preserve Data Integrity', () => {
        test('creating a module with valid data and retrieving it returns the same data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        description: fc.option(fc.string({ maxLength: 1000 }), { nil: null })
                    }),
                    async (moduleData) => {
                        // Create module
                        const created = await moduleService.create(testCourse.id, moduleData);

                        // Verify creation
                        expect(created).toBeDefined();
                        expect(created.id).toBeDefined();
                        expect(created.courseId).toBe(testCourse.id);
                        expect(created.title).toBe(moduleData.title.trim());
                        expect(created.description).toBe(moduleData.description);
                        expect(created.orderIndex).toBeGreaterThanOrEqual(0);
                        expect(created.createdAt).toBeDefined();
                        expect(created.updatedAt).toBeDefined();

                        // Retrieve module
                        const retrieved = await moduleService.findById(created.id, testCourse.id);

                        // Verify retrieved data matches created data
                        expect(retrieved).toBeDefined();
                        expect(retrieved.id).toBe(created.id);
                        expect(retrieved.courseId).toBe(created.courseId);
                        expect(retrieved.title).toBe(created.title);
                        expect(retrieved.description).toBe(created.description);
                        expect(retrieved.orderIndex).toBe(created.orderIndex);

                        // Clean up
                        await moduleService.deleteModule(created.id, testCourse.id);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('updating a module with new valid data and retrieving it returns the updated data', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        initialTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        initialDescription: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
                        updatedTitle: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        updatedDescription: fc.option(fc.string({ maxLength: 1000 }), { nil: null })
                    }),
                    async (data) => {
                        // Create initial module
                        const created = await moduleService.create(testCourse.id, {
                            title: data.initialTitle,
                            description: data.initialDescription
                        });

                        // Update module
                        const updated = await moduleService.update(created.id, testCourse.id, {
                            title: data.updatedTitle,
                            description: data.updatedDescription
                        });

                        // Verify update
                        expect(updated.id).toBe(created.id);
                        expect(updated.title).toBe(data.updatedTitle.trim());
                        expect(updated.description).toBe(data.updatedDescription);

                        // Retrieve and verify
                        const retrieved = await moduleService.findById(created.id, testCourse.id);
                        expect(retrieved.title).toBe(data.updatedTitle.trim());
                        expect(retrieved.description).toBe(data.updatedDescription);

                        // Clean up
                        await moduleService.deleteModule(created.id, testCourse.id);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('deleting a module removes it from the database', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        description: fc.option(fc.string({ maxLength: 1000 }), { nil: null })
                    }),
                    async (moduleData) => {
                        // Create module
                        const created = await moduleService.create(testCourse.id, moduleData);

                        // Verify it exists
                        const beforeDelete = await moduleService.findById(created.id, testCourse.id);
                        expect(beforeDelete).toBeDefined();

                        // Delete module
                        const deleted = await moduleService.deleteModule(created.id, testCourse.id);
                        expect(deleted).toBe(true);

                        // Verify it no longer exists
                        const afterDelete = await moduleService.findById(created.id, testCourse.id);
                        expect(afterDelete).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
