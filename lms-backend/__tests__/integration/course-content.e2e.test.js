const request = require('supertest');
const express = require('express');
const { generateToken } = require('../../middleware/auth');
const { 
    createTestUser, 
    createTestCourse, 
    createTestModule,
    createTestLesson,
    createTestContentItem,
    cleanupTestData, 
    closePool 
} = require('../helpers/testDb');
const moduleRoutes = require('../../routes/modules');
const lessonRoutes = require('../../routes/lessons');
const contentItemRoutes = require('../../routes/contentItems');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api', moduleRoutes);
app.use('/api', lessonRoutes);
app.use('/api', contentItemRoutes);

/**
 * End-to-End Integration Tests for Course Content Management
 * Tests complete workflows across modules, lessons, and content items
 * Validates: All requirements
 */
describe('Course Content Management - End-to-End Integration Tests', () => {
    let instructorUser, instructorToken;
    let studentUser, studentToken;
    let testCourse;

    beforeAll(async () => {
        // Create test users
        instructorUser = await createTestUser({ 
            role: 'instructor', 
            email: 'e2e-instructor@test.com' 
        });
        instructorToken = generateToken(instructorUser);

        studentUser = await createTestUser({ 
            role: 'student', 
            email: 'e2e-student@test.com' 
        });
        studentToken = generateToken(studentUser);

        // Create test course
        testCourse = await createTestCourse(instructorUser.id, { 
            title: 'E2E Test Course',
            description: 'Course for end-to-end testing'
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await closePool();
    });

    /**
     * Test 1: Complete Flow - Create Module → Add Lesson → Add Content
     * Validates the entire content creation workflow
     */
    describe('Complete Flow: Create Module → Add Lesson → Add Content', () => {
        let createdModule, createdLesson, createdContent;

        test('Step 1: Create a new module', async () => {
            const moduleData = {
                title: 'Week 1: Introduction to Programming',
                description: 'Learn the basics of programming'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(moduleData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(moduleData.title);
            expect(response.body.description).toBe(moduleData.description);
            expect(response.body.orderIndex).toBe(0);

            createdModule = response.body;
        });

        test('Step 2: Add a lesson to the module', async () => {
            const lessonData = {
                title: 'Lesson 1.1: Variables and Data Types',
                content: 'Introduction to variables',
                isRequired: true
            };

            const response = await request(app)
                .post(`/api/modules/${createdModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(lessonData.title);
            expect(response.body.moduleId).toBe(createdModule.id);
            expect(response.body.isRequired).toBe(true);
            expect(response.body.orderIndex).toBe(0);

            createdLesson = response.body;
        });

        test('Step 3: Add video content to the lesson', async () => {
            const videoContent = {
                contentType: 'video',
                title: 'Introduction Video',
                description: 'Watch this video to get started',
                videoUrl: 'https://example.com/video1.mp4',
                duration: 15,
                isRequired: true
            };

            const response = await request(app)
                .post(`/api/lessons/${createdLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(videoContent);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.contentType).toBe('video');
            expect(response.body.title).toBe(videoContent.title);
            expect(response.body.videoUrl).toBe(videoContent.videoUrl);
            expect(response.body.duration).toBe(videoContent.duration);
            expect(response.body.orderIndex).toBe(0);

            createdContent = response.body;
        });

        test('Step 4: Add text content to the lesson', async () => {
            const textContent = {
                contentType: 'text',
                title: 'Reading Material',
                description: 'Important concepts to understand',
                textContent: '<h1>Variables</h1><p>Variables are containers for storing data values.</p>',
                isRequired: true
            };

            const response = await request(app)
                .post(`/api/lessons/${createdLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(textContent);

            expect(response.status).toBe(201);
            expect(response.body.contentType).toBe('text');
            expect(response.body.textContent).toBe(textContent.textContent);
            expect(response.body.orderIndex).toBe(1); // Second content item
        });

        test('Step 5: Add resource content to the lesson', async () => {
            const resourceContent = {
                contentType: 'resource',
                title: 'Downloadable Cheat Sheet',
                description: 'Quick reference guide',
                resourceType: 'link',
                resourceUrl: 'https://example.com/cheatsheet.pdf',
                isRequired: false
            };

            const response = await request(app)
                .post(`/api/lessons/${createdLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(resourceContent);

            expect(response.status).toBe(201);
            expect(response.body.contentType).toBe('resource');
            expect(response.body.resourceType).toBe('link');
            expect(response.body.resourceUrl).toBe(resourceContent.resourceUrl);
            expect(response.body.isRequired).toBe(false);
            expect(response.body.orderIndex).toBe(2); // Third content item
        });

        test('Step 6: Verify complete hierarchy', async () => {
            // Get module with all nested data
            const moduleResponse = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${createdModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(moduleResponse.status).toBe(200);
            expect(moduleResponse.body.lessons).toHaveLength(1);
            
            const lesson = moduleResponse.body.lessons[0];
            expect(lesson.id).toBe(createdLesson.id);
            expect(lesson.contentItems).toHaveLength(3);
            
            // Verify content items are in correct order
            expect(lesson.contentItems[0].contentType).toBe('video');
            expect(lesson.contentItems[1].contentType).toBe('text');
            expect(lesson.contentItems[2].contentType).toBe('resource');
        });
    });

    /**
     * Test 2: Reordering Across All Levels
     * Tests module, lesson, and content item reordering
     */
    describe('Reordering Across All Levels', () => {
        let module1, module2, module3;
        let lesson1, lesson2, lesson3;
        let content1, content2, content3;

        beforeAll(async () => {
            // Create multiple modules
            module1 = await createTestModule(testCourse.id, { 
                title: 'Module A', 
                orderIndex: 0 
            });
            module2 = await createTestModule(testCourse.id, { 
                title: 'Module B', 
                orderIndex: 1 
            });
            module3 = await createTestModule(testCourse.id, { 
                title: 'Module C', 
                orderIndex: 2 
            });

            // Create multiple lessons in module1
            lesson1 = await createTestLesson(module1.id, { 
                title: 'Lesson A1', 
                orderIndex: 0 
            });
            lesson2 = await createTestLesson(module1.id, { 
                title: 'Lesson A2', 
                orderIndex: 1 
            });
            lesson3 = await createTestLesson(module1.id, { 
                title: 'Lesson A3', 
                orderIndex: 2 
            });

            // Create multiple content items in lesson1
            content1 = await createTestContentItem(lesson1.id, { 
                contentType: 'video',
                title: 'Content 1', 
                orderIndex: 0 
            });
            content2 = await createTestContentItem(lesson1.id, { 
                contentType: 'text',
                title: 'Content 2', 
                orderIndex: 1 
            });
            content3 = await createTestContentItem(lesson1.id, { 
                contentType: 'resource',
                title: 'Content 3', 
                orderIndex: 2 
            });
        });

        test('Reorder modules: reverse order', async () => {
            const reorderData = {
                moduleIds: [module3.id, module2.id, module1.id]
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            expect(response.body.modules).toHaveLength(3);
            
            // Verify new order
            expect(response.body.modules[0].id).toBe(module3.id);
            expect(response.body.modules[0].orderIndex).toBe(0);
            expect(response.body.modules[1].id).toBe(module2.id);
            expect(response.body.modules[1].orderIndex).toBe(1);
            expect(response.body.modules[2].id).toBe(module1.id);
            expect(response.body.modules[2].orderIndex).toBe(2);
        });

        test('Reorder lessons within module: reverse order', async () => {
            const reorderData = {
                lessonIds: [lesson3.id, lesson2.id, lesson1.id]
            };

            const response = await request(app)
                .put(`/api/modules/${module1.id}/lessons/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            expect(response.body.lessons).toHaveLength(3);
            
            // Verify new order
            expect(response.body.lessons[0].id).toBe(lesson3.id);
            expect(response.body.lessons[0].orderIndex).toBe(0);
            expect(response.body.lessons[1].id).toBe(lesson2.id);
            expect(response.body.lessons[1].orderIndex).toBe(1);
            expect(response.body.lessons[2].id).toBe(lesson1.id);
            expect(response.body.lessons[2].orderIndex).toBe(2);
        });

        test('Reorder content items within lesson: reverse order', async () => {
            const reorderData = {
                contentItemIds: [content3.id, content2.id, content1.id]
            };

            const response = await request(app)
                .put(`/api/lessons/${lesson1.id}/content/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            expect(response.body.contentItems).toHaveLength(3);
            
            // Verify new order
            expect(response.body.contentItems[0].id).toBe(content3.id);
            expect(response.body.contentItems[0].orderIndex).toBe(0);
            expect(response.body.contentItems[1].id).toBe(content2.id);
            expect(response.body.contentItems[1].orderIndex).toBe(1);
            expect(response.body.contentItems[2].id).toBe(content1.id);
            expect(response.body.contentItems[2].orderIndex).toBe(2);
        });

        test('Verify reordering persists across requests', async () => {
            // Get modules and verify order persists
            const modulesResponse = await request(app)
                .get(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(modulesResponse.status).toBe(200);
            const modules = modulesResponse.body.modules;
            
            // Find our test modules (there may be others from previous tests)
            const testModules = modules.filter(m => 
                [module1.id, module2.id, module3.id].includes(m.id)
            ).sort((a, b) => a.orderIndex - b.orderIndex);

            expect(testModules[0].id).toBe(module3.id);
            expect(testModules[1].id).toBe(module2.id);
            expect(testModules[2].id).toBe(module1.id);
        });

        test('Reorder with mixed positions', async () => {
            // Reorder modules: B, C, A
            const reorderData = {
                moduleIds: [module2.id, module3.id, module1.id]
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            expect(response.body.modules[0].id).toBe(module2.id);
            expect(response.body.modules[1].id).toBe(module3.id);
            expect(response.body.modules[2].id).toBe(module1.id);
        });
    });

    /**
     * Test 3: Preview Mode Simulation
     * Tests that content is displayed correctly in read-only format
     * (Backend provides the data; frontend handles the preview UI)
     */
    describe('Preview Mode - Data Retrieval for Student View', () => {
        let previewModule, previewLesson1, previewLesson2;
        let requiredContent, optionalContent;

        beforeAll(async () => {
            // Create module with lessons and content
            previewModule = await createTestModule(testCourse.id, { 
                title: 'Preview Test Module',
                description: 'Module for preview testing',
                orderIndex: 100 // High order to avoid conflicts
            });

            previewLesson1 = await createTestLesson(previewModule.id, { 
                title: 'Required Lesson',
                isRequired: true,
                orderIndex: 0
            });

            previewLesson2 = await createTestLesson(previewModule.id, { 
                title: 'Optional Lesson',
                isRequired: false,
                orderIndex: 1
            });

            requiredContent = await createTestContentItem(previewLesson1.id, { 
                contentType: 'video',
                title: 'Required Video',
                videoUrl: 'https://example.com/required.mp4',
                isRequired: true,
                orderIndex: 0
            });

            optionalContent = await createTestContentItem(previewLesson1.id, { 
                contentType: 'text',
                title: 'Optional Reading',
                textContent: 'This is optional content',
                isRequired: false,
                orderIndex: 1
            });
        });

        test('Retrieve module with all nested data for preview', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${previewModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(previewModule.id);
            expect(response.body.lessons).toHaveLength(2);
            
            // Verify lessons are in order
            expect(response.body.lessons[0].orderIndex).toBeLessThan(
                response.body.lessons[1].orderIndex
            );
        });

        test('Verify required/optional indicators are present', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${previewModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            const lessons = response.body.lessons;
            
            // Find our test lessons
            const reqLesson = lessons.find(l => l.id === previewLesson1.id);
            const optLesson = lessons.find(l => l.id === previewLesson2.id);

            expect(reqLesson.isRequired).toBe(true);
            expect(optLesson.isRequired).toBe(false);

            // Check content items
            const reqContentItem = reqLesson.contentItems.find(c => c.id === requiredContent.id);
            const optContentItem = reqLesson.contentItems.find(c => c.id === optionalContent.id);

            expect(reqContentItem.isRequired).toBe(true);
            expect(optContentItem.isRequired).toBe(false);
        });

        test('Verify content type information is available', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${previewModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            const lesson = response.body.lessons.find(l => l.id === previewLesson1.id);
            const contentItems = lesson.contentItems;

            // Verify content types are present for icon display
            expect(contentItems[0].contentType).toBe('video');
            expect(contentItems[1].contentType).toBe('text');
        });

        test('Verify content is sorted by orderIndex', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${previewModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            const lessons = response.body.lessons;
            
            // Check lessons are sorted
            for (let i = 1; i < lessons.length; i++) {
                expect(lessons[i].orderIndex).toBeGreaterThanOrEqual(
                    lessons[i - 1].orderIndex
                );
            }

            // Check content items are sorted
            lessons.forEach(lesson => {
                const items = lesson.contentItems;
                for (let i = 1; i < items.length; i++) {
                    expect(items[i].orderIndex).toBeGreaterThanOrEqual(
                        items[i - 1].orderIndex
                    );
                }
            });
        });
    });

    /**
     * Test 4: Student View
     * Tests that students can view content but not edit
     */
    describe('Student View - Read-Only Access', () => {
        let studentModule, studentLesson, studentContent;

        beforeAll(async () => {
            // Create content for student viewing
            studentModule = await createTestModule(testCourse.id, { 
                title: 'Student View Module',
                orderIndex: 200
            });

            studentLesson = await createTestLesson(studentModule.id, { 
                title: 'Student View Lesson',
                content: 'Lesson content for students',
                orderIndex: 0
            });

            studentContent = await createTestContentItem(studentLesson.id, { 
                contentType: 'video',
                title: 'Student Video',
                videoUrl: 'https://example.com/student-video.mp4',
                duration: 10,
                orderIndex: 0
            });
        });

        test('Student can retrieve course modules', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('modules');
            expect(Array.isArray(response.body.modules)).toBe(true);
            
            // Verify student module is in the list
            const module = response.body.modules.find(m => m.id === studentModule.id);
            expect(module).toBeDefined();
            expect(module.title).toBe('Student View Module');
        });

        test('Student can retrieve specific module with lessons', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${studentModule.id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(studentModule.id);
            expect(response.body.lessons).toHaveLength(1);
            expect(response.body.lessons[0].id).toBe(studentLesson.id);
        });

        test('Student can retrieve lesson content items', async () => {
            const response = await request(app)
                .get(`/api/lessons/${studentLesson.id}/content`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('contentItems');
            expect(response.body.contentItems).toHaveLength(1);
            expect(response.body.contentItems[0].id).toBe(studentContent.id);
            expect(response.body.contentItems[0].videoUrl).toBe('https://example.com/student-video.mp4');
        });

        test('Student cannot create modules', async () => {
            const moduleData = {
                title: 'Unauthorized Module',
                description: 'Student should not create this'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(moduleData);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });

        test('Student cannot create lessons', async () => {
            const lessonData = {
                title: 'Unauthorized Lesson',
                content: 'Student should not create this'
            };

            const response = await request(app)
                .post(`/api/modules/${studentModule.id}/lessons`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(lessonData);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });

        test('Student cannot create content items', async () => {
            const contentData = {
                contentType: 'text',
                title: 'Unauthorized Content',
                textContent: 'Student should not create this'
            };

            const response = await request(app)
                .post(`/api/lessons/${studentLesson.id}/content`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(contentData);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });

        test('Student cannot update modules', async () => {
            const updateData = {
                title: 'Unauthorized Update'
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/${studentModule.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(updateData);

            expect(response.status).toBe(403);
        });

        test('Student cannot delete modules', async () => {
            const response = await request(app)
                .delete(`/api/courses/${testCourse.id}/modules/${studentModule.id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
        });

        test('Student cannot reorder modules', async () => {
            const reorderData = {
                moduleIds: [studentModule.id]
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(reorderData);

            expect(response.status).toBe(403);
        });
    });

    /**
     * Test 5: Complex Hierarchy Management
     * Tests managing multiple modules with multiple lessons and content items
     */
    describe('Complex Hierarchy Management', () => {
        test('Create and manage a complex course structure', async () => {
            // Create 3 modules
            const modules = [];
            for (let i = 1; i <= 3; i++) {
                const response = await request(app)
                    .post(`/api/courses/${testCourse.id}/modules`)
                    .set('Authorization', `Bearer ${instructorToken}`)
                    .send({
                        title: `Week ${i}: Advanced Topics`,
                        description: `Week ${i} content`
                    });
                
                expect(response.status).toBe(201);
                modules.push(response.body);
            }

            // Add 2 lessons to each module
            const lessons = [];
            for (const module of modules) {
                for (let j = 1; j <= 2; j++) {
                    const response = await request(app)
                        .post(`/api/modules/${module.id}/lessons`)
                        .set('Authorization', `Bearer ${instructorToken}`)
                        .send({
                            title: `Lesson ${j}`,
                            content: `Content for lesson ${j}`,
                            isRequired: j === 1 // First lesson required
                        });
                    
                    expect(response.status).toBe(201);
                    lessons.push(response.body);
                }
            }

            // Add 3 different content types to first lesson
            const firstLesson = lessons[0];
            
            // Video content
            const videoResponse = await request(app)
                .post(`/api/lessons/${firstLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'video',
                    title: 'Intro Video',
                    videoUrl: 'https://example.com/intro.mp4',
                    duration: 20
                });
            expect(videoResponse.status).toBe(201);

            // Text content
            const textResponse = await request(app)
                .post(`/api/lessons/${firstLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'text',
                    title: 'Reading Material',
                    textContent: '<h1>Important Concepts</h1><p>Read carefully.</p>'
                });
            expect(textResponse.status).toBe(201);

            // Resource content
            const resourceResponse = await request(app)
                .post(`/api/lessons/${firstLesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'resource',
                    title: 'Additional Resources',
                    resourceType: 'link',
                    resourceUrl: 'https://example.com/resources.pdf'
                });
            expect(resourceResponse.status).toBe(201);

            // Verify the complete structure
            const allModulesResponse = await request(app)
                .get(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(allModulesResponse.status).toBe(200);
            
            // Find our newly created modules
            const createdModules = allModulesResponse.body.modules.filter(m =>
                modules.some(mod => mod.id === m.id)
            );
            
            expect(createdModules.length).toBe(3);
        });

        test('Delete module cascades to lessons and content', async () => {
            // Create a module with lesson and content
            const moduleResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Module to Delete',
                    description: 'Will be deleted with all children'
                });
            const moduleToDelete = moduleResponse.body;

            const lessonResponse = await request(app)
                .post(`/api/modules/${moduleToDelete.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Lesson to Delete',
                    content: 'Will be deleted'
                });
            const lessonToDelete = lessonResponse.body;

            const contentResponse = await request(app)
                .post(`/api/lessons/${lessonToDelete.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'text',
                    title: 'Content to Delete',
                    textContent: 'Will be deleted'
                });
            const contentToDelete = contentResponse.body;

            // Delete the module
            const deleteResponse = await request(app)
                .delete(`/api/courses/${testCourse.id}/modules/${moduleToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(deleteResponse.status).toBe(200);

            // Verify module is deleted
            const getModuleResponse = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${moduleToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);
            expect(getModuleResponse.status).toBe(404);

            // Verify lesson is deleted (cascaded)
            const getLessonResponse = await request(app)
                .get(`/api/lessons/${lessonToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);
            expect(getLessonResponse.status).toBe(404);

            // Verify content is deleted (cascaded)
            const getContentResponse = await request(app)
                .get(`/api/content/${contentToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);
            expect(getContentResponse.status).toBe(404);
        });
    });

    /**
     * Test 6: Data Integrity and Validation
     * Tests that data validation works across the entire system
     */
    describe('Data Integrity and Validation', () => {
        test('Reject invalid video URL format', async () => {
            const module = await createTestModule(testCourse.id, { 
                title: 'Validation Test Module' 
            });
            const lesson = await createTestLesson(module.id, { 
                title: 'Validation Test Lesson' 
            });

            const invalidVideoContent = {
                contentType: 'video',
                title: 'Invalid Video',
                videoUrl: 'not-a-valid-url', // Invalid URL
                duration: 10
            };

            const response = await request(app)
                .post(`/api/lessons/${lesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(invalidVideoContent);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/url/i);
        });

        test('Reject invalid resource URL format', async () => {
            const module = await createTestModule(testCourse.id, { 
                title: 'Resource Validation Module' 
            });
            const lesson = await createTestLesson(module.id, { 
                title: 'Resource Validation Lesson' 
            });

            const invalidResourceContent = {
                contentType: 'resource',
                title: 'Invalid Resource',
                resourceType: 'link',
                resourceUrl: 'invalid-url-format' // Invalid URL
            };

            const response = await request(app)
                .post(`/api/lessons/${lesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(invalidResourceContent);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('Preserve rich text formatting in text content', async () => {
            const module = await createTestModule(testCourse.id, { 
                title: 'Rich Text Module' 
            });
            const lesson = await createTestLesson(module.id, { 
                title: 'Rich Text Lesson' 
            });

            const richTextContent = {
                contentType: 'text',
                title: 'Rich Text Content',
                textContent: '<h1>Heading</h1><p><strong>Bold</strong> and <em>italic</em></p><ul><li>Item 1</li><li>Item 2</li></ul><a href="https://example.com">Link</a>'
            };

            const createResponse = await request(app)
                .post(`/api/lessons/${lesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(richTextContent);

            expect(createResponse.status).toBe(201);

            // Retrieve and verify formatting is preserved
            const getResponse = await request(app)
                .get(`/api/content/${createResponse.body.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.textContent).toBe(richTextContent.textContent);
        });

        test('Enforce required fields for module creation', async () => {
            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    description: 'Module without title'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/title/i);
        });

        test('Enforce required fields for lesson creation', async () => {
            const module = await createTestModule(testCourse.id, { 
                title: 'Required Fields Module' 
            });

            const response = await request(app)
                .post(`/api/modules/${module.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    content: 'Lesson without title'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/title/i);
        });

        test('Enforce required fields for content item creation', async () => {
            const module = await createTestModule(testCourse.id, { 
                title: 'Content Required Fields Module' 
            });
            const lesson = await createTestLesson(module.id, { 
                title: 'Content Required Fields Lesson' 
            });

            const response = await request(app)
                .post(`/api/lessons/${lesson.id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    contentType: 'video'
                    // Missing title
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/title/i);
        });
    });

    /**
     * Test 7: Order Index Consistency
     * Tests that order indices are maintained correctly
     */
    describe('Order Index Consistency', () => {
        test('New modules get sequential order indices', async () => {
            const modules = [];
            
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .post(`/api/courses/${testCourse.id}/modules`)
                    .set('Authorization', `Bearer ${instructorToken}`)
                    .send({
                        title: `Sequential Module ${i}`
                    });
                
                expect(response.status).toBe(201);
                modules.push(response.body);
            }

            // Verify order indices are sequential
            const allModulesResponse = await request(app)
                .get(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`);

            const createdModules = allModulesResponse.body.modules
                .filter(m => modules.some(mod => mod.id === m.id))
                .sort((a, b) => a.orderIndex - b.orderIndex);

            // Check that our modules have sequential indices
            for (let i = 1; i < createdModules.length; i++) {
                expect(createdModules[i].orderIndex).toBeGreaterThan(
                    createdModules[i - 1].orderIndex
                );
            }
        });

        test('No duplicate order indices after reordering', async () => {
            const module1 = await createTestModule(testCourse.id, { 
                title: 'Unique Order 1', 
                orderIndex: 500 
            });
            const module2 = await createTestModule(testCourse.id, { 
                title: 'Unique Order 2', 
                orderIndex: 501 
            });
            const module3 = await createTestModule(testCourse.id, { 
                title: 'Unique Order 3', 
                orderIndex: 502 
            });

            const reorderData = {
                moduleIds: [module2.id, module3.id, module1.id]
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);

            const modules = response.body.modules;
            const orderIndices = modules.map(m => m.orderIndex);
            const uniqueIndices = new Set(orderIndices);

            // No duplicates
            expect(uniqueIndices.size).toBe(orderIndices.length);
        });
    });
});
