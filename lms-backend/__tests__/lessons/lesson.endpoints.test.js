const request = require('supertest');
const express = require('express');
const { generateToken } = require('../../middleware/auth');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');
const { query } = require('../../config/db');
const lessonRoutes = require('../../routes/lessons');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api', lessonRoutes);

// Unit tests for lesson endpoints
// Validates: Requirements 2.1, 2.4, 9.3

describe('Lesson Endpoints Unit Tests', () => {
    let adminUser, adminToken;
    let instructorUser, instructorToken;
    let otherInstructorUser, otherInstructorToken;
    let studentUser, studentToken;
    let testCourse, otherCourse;
    let testModule, otherModule;

    beforeAll(async () => {
        // Create test users
        adminUser = await createTestUser({ role: 'admin', email: 'admin-lesson@test.com' });
        adminToken = generateToken(adminUser);

        instructorUser = await createTestUser({ role: 'instructor', email: 'instructor-lesson@test.com' });
        instructorToken = generateToken(instructorUser);

        otherInstructorUser = await createTestUser({ role: 'instructor', email: 'other-lesson@test.com' });
        otherInstructorToken = generateToken(otherInstructorUser);

        studentUser = await createTestUser({ role: 'student', email: 'student-lesson@test.com' });
        studentToken = generateToken(studentUser);

        // Create test courses and modules
        testCourse = await createTestCourse(instructorUser.id, { title: 'Test Course for Lessons' });
        otherCourse = await createTestCourse(otherInstructorUser.id, { title: 'Other Course for Lessons' });
        
        testModule = await createTestModule(testCourse.id, { title: 'Test Module 1', orderIndex: 0 });
        otherModule = await createTestModule(otherCourse.id, { title: 'Other Module 1', orderIndex: 0 });
    });

    afterAll(async () => {
        await cleanupTestData();
        await closePool();
    });

    describe('POST /api/courses/:courseId/modules/:moduleId/lessons - Create Lesson', () => {
        test('should successfully create a lesson within a module', async () => {
            const lessonData = {
                title: 'Lesson 1: Introduction to HTML',
                content: 'This lesson covers HTML basics',
                videoUrl: 'https://example.com/video1.mp4',
                duration: 30,
                isRequired: true
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${testModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(lessonData.title);
            expect(response.body.content).toBe(lessonData.content);
            expect(response.body.videoUrl).toBe(lessonData.videoUrl);
            expect(response.body.duration).toBe(lessonData.duration);
            expect(response.body.isRequired).toBe(lessonData.isRequired);
            expect(response.body.courseId).toBe(testCourse.id);
            expect(response.body.moduleId).toBe(testModule.id);
            expect(response.body.orderIndex).toBeGreaterThanOrEqual(0);
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).toHaveProperty('updatedAt');
        });

        test('should return 400 for missing title', async () => {
            const lessonData = {
                content: 'Lesson without title'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${testModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/title/i);
        });

        test('should return 400 for empty title', async () => {
            const lessonData = {
                title: '   ',
                content: 'Lesson with empty title'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${testModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/title/i);
        });

        test('should return 403 when instructor tries to create lesson in another instructor\'s course', async () => {
            const lessonData = {
                title: 'Unauthorized Lesson',
                content: 'Should not be created'
            };

            const response = await request(app)
                .post(`/api/courses/${otherCourse.id}/modules/${otherModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/access denied/i);
        });

        test('should allow admin to create lesson in any course', async () => {
            const lessonData = {
                title: 'Admin Created Lesson',
                content: 'Created by admin'
            };

            const response = await request(app)
                .post(`/api/courses/${otherCourse.id}/modules/${otherModule.id}/lessons`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body.title).toBe(lessonData.title);
        });

        test('should return 404 for non-existent course', async () => {
            const lessonData = {
                title: 'Lesson for non-existent course',
                content: 'Should fail'
            };

            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .post(`/api/courses/${fakeUuid}/modules/${testModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/course not found/i);
        });

        test('should return 404 for non-existent module', async () => {
            const lessonData = {
                title: 'Lesson for non-existent module',
                content: 'Should fail'
            };

            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${fakeUuid}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/module not found/i);
        });

        test('should return 401 without authentication token', async () => {
            const lessonData = {
                title: 'Unauthenticated Lesson',
                content: 'Should fail'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${testModule.id}/lessons`)
                .send(lessonData);

            expect(response.status).toBe(401);
        });

        test('should return 403 when student tries to create lesson', async () => {
            const lessonData = {
                title: 'Student Lesson',
                content: 'Should fail'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${testModule.id}/lessons`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(lessonData);

            expect(response.status).toBe(403);
        });

        test('should trim whitespace from title', async () => {
            const lessonData = {
                title: '  Lesson 2: Advanced Topics  ',
                content: 'Testing title trimming'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${testModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Lesson 2: Advanced Topics');
        });

        test('should handle null content', async () => {
            const lessonData = {
                title: 'Lesson without content'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${testModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body.content).toBeNull();
        });

        test('should default isRequired to true when not specified', async () => {
            const lessonData = {
                title: 'Lesson with default required status',
                content: 'Testing default isRequired'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${testModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body.isRequired).toBe(true);
        });
    });

    describe('Lesson Ordering Within Module - Validates Requirement 2.4', () => {
        let orderTestModule;

        beforeAll(async () => {
            orderTestModule = await createTestModule(testCourse.id, { 
                title: 'Order Test Module', 
                orderIndex: 10 
            });
        });

        test('should assign order_index 0 to first lesson in module', async () => {
            const lessonData = {
                title: 'First Lesson in Module',
                content: 'Testing order assignment'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${orderTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body.orderIndex).toBe(0);
        });

        test('should assign incrementing order_index to subsequent lessons', async () => {
            // Create first lesson
            const lesson1Response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${orderTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson A' });

            expect(lesson1Response.status).toBe(201);
            const firstOrderIndex = lesson1Response.body.orderIndex;

            // Create second lesson
            const lesson2Response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${orderTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson B' });

            expect(lesson2Response.status).toBe(201);
            expect(lesson2Response.body.orderIndex).toBe(firstOrderIndex + 1);

            // Create third lesson
            const lesson3Response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${orderTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson C' });

            expect(lesson3Response.status).toBe(201);
            expect(lesson3Response.body.orderIndex).toBe(firstOrderIndex + 2);
        });

        test('should maintain separate order_index sequences for different modules', async () => {
            // Create another module
            const anotherModule = await createTestModule(testCourse.id, { 
                title: 'Another Order Test Module', 
                orderIndex: 11 
            });

            // Create lesson in first module
            const lesson1Response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${orderTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson in Module 1' });

            // Create lesson in second module
            const lesson2Response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${anotherModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson in Module 2' });

            expect(lesson1Response.status).toBe(201);
            expect(lesson2Response.status).toBe(201);

            // Both should have their own order sequences
            // The second module's first lesson should start at 0
            expect(lesson2Response.body.orderIndex).toBe(0);
        });

        test('should retrieve lessons in order_index order', async () => {
            // Create a fresh module for this test
            const sortTestModule = await createTestModule(testCourse.id, { 
                title: 'Sort Test Module', 
                orderIndex: 12 
            });

            // Create multiple lessons
            await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${sortTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson 1' });

            await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${sortTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson 2' });

            await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${sortTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson 3' });

            // Retrieve lessons
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${sortTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('lessons');
            expect(Array.isArray(response.body.lessons)).toBe(true);
            expect(response.body.lessons.length).toBeGreaterThanOrEqual(3);

            // Check that lessons are sorted by orderIndex
            const lessons = response.body.lessons;
            for (let i = 1; i < lessons.length; i++) {
                expect(lessons[i].orderIndex).toBeGreaterThanOrEqual(lessons[i - 1].orderIndex);
            }
        });
    });

    describe('Required/Optional Status - Validates Requirement 9.3', () => {
        let statusTestModule;

        beforeAll(async () => {
            statusTestModule = await createTestModule(testCourse.id, { 
                title: 'Status Test Module', 
                orderIndex: 20 
            });
        });

        test('should create lesson with isRequired set to true', async () => {
            const lessonData = {
                title: 'Required Lesson',
                content: 'This is a required lesson',
                isRequired: true
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${statusTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body.isRequired).toBe(true);
        });

        test('should create lesson with isRequired set to false', async () => {
            const lessonData = {
                title: 'Optional Lesson',
                content: 'This is an optional lesson',
                isRequired: false
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${statusTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(lessonData);

            expect(response.status).toBe(201);
            expect(response.body.isRequired).toBe(false);
        });

        test('should update lesson from required to optional', async () => {
            // Create a required lesson
            const createResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${statusTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ 
                    title: 'Initially Required Lesson',
                    isRequired: true 
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.isRequired).toBe(true);
            const lessonId = createResponse.body.id;

            // Update to optional
            const updateResponse = await request(app)
                .put(`/api/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ isRequired: false });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.isRequired).toBe(false);
        });

        test('should update lesson from optional to required', async () => {
            // Create an optional lesson
            const createResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${statusTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ 
                    title: 'Initially Optional Lesson',
                    isRequired: false 
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.isRequired).toBe(false);
            const lessonId = createResponse.body.id;

            // Update to required
            const updateResponse = await request(app)
                .put(`/api/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ isRequired: true });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.isRequired).toBe(true);
        });

        test('should preserve isRequired status when updating other fields', async () => {
            // Create an optional lesson
            const createResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${statusTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ 
                    title: 'Preserve Status Lesson',
                    content: 'Original content',
                    isRequired: false 
                });

            expect(createResponse.status).toBe(201);
            const lessonId = createResponse.body.id;

            // Update only the title
            const updateResponse = await request(app)
                .put(`/api/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Updated Title' });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.title).toBe('Updated Title');
            expect(updateResponse.body.isRequired).toBe(false); // Should remain false
        });

        test('should retrieve lesson with correct isRequired status', async () => {
            // Create a required lesson
            const createResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${statusTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ 
                    title: 'Retrieve Status Lesson',
                    isRequired: true 
                });

            expect(createResponse.status).toBe(201);
            const lessonId = createResponse.body.id;

            // Retrieve the lesson
            const getResponse = await request(app)
                .get(`/api/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.isRequired).toBe(true);
        });
    });

    describe('GET /api/courses/:courseId/modules/:moduleId/lessons - Get All Lessons', () => {
        let getLessonsModule;

        beforeAll(async () => {
            getLessonsModule = await createTestModule(testCourse.id, { 
                title: 'Get Lessons Test Module', 
                orderIndex: 30 
            });

            // Create some lessons
            await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${getLessonsModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson A', isRequired: true });

            await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${getLessonsModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson B', isRequired: false });
        });

        test('should return all lessons for a module', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${getLessonsModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('lessons');
            expect(Array.isArray(response.body.lessons)).toBe(true);
            expect(response.body.lessons.length).toBeGreaterThanOrEqual(2);
        });

        test('should return 404 for non-existent course', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/api/courses/${fakeUuid}/modules/${getLessonsModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 404 for non-existent module', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${fakeUuid}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${getLessonsModule.id}/lessons`);

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/lessons/:lessonId - Update Lesson', () => {
        let updateTestModule;
        let lessonToUpdate;

        beforeEach(async () => {
            updateTestModule = await createTestModule(testCourse.id, { 
                title: 'Update Test Module', 
                orderIndex: 40 
            });

            const createResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${updateTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ 
                    title: 'Original Title',
                    content: 'Original Content',
                    isRequired: true
                });

            lessonToUpdate = createResponse.body;
        });

        test('should successfully update lesson title', async () => {
            const updateData = {
                title: 'Updated Title'
            };

            const response = await request(app)
                .put(`/api/lessons/${lessonToUpdate.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe(updateData.title);
            expect(response.body.content).toBe(lessonToUpdate.content);
        });

        test('should successfully update lesson content', async () => {
            const updateData = {
                content: 'Updated Content'
            };

            const response = await request(app)
                .put(`/api/lessons/${lessonToUpdate.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.content).toBe(updateData.content);
            expect(response.body.title).toBe(lessonToUpdate.title);
        });

        test('should return 403 when instructor tries to update another instructor\'s lesson', async () => {
            const updateData = {
                title: 'Unauthorized Update'
            };

            const response = await request(app)
                .put(`/api/lessons/${lessonToUpdate.id}`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send(updateData);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });

        test('should allow admin to update any lesson', async () => {
            const updateData = {
                title: 'Admin Updated Title'
            };

            const response = await request(app)
                .put(`/api/lessons/${lessonToUpdate.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe(updateData.title);
        });

        test('should return 404 for non-existent lesson', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const updateData = {
                title: 'Update Non-existent'
            };

            const response = await request(app)
                .put(`/api/lessons/${fakeUuid}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(404);
        });

        test('should return 400 for empty update data', async () => {
            const response = await request(app)
                .put(`/api/lessons/${lessonToUpdate.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/no fields to update/i);
        });
    });

    describe('DELETE /api/lessons/:lessonId - Delete Lesson', () => {
        test('should successfully delete a lesson', async () => {
            const deleteTestModule = await createTestModule(testCourse.id, { 
                title: 'Delete Test Module', 
                orderIndex: 50 
            });

            const createResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${deleteTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Lesson to Delete' });

            const lessonId = createResponse.body.id;

            const response = await request(app)
                .delete(`/api/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');

            // Verify lesson is deleted
            const getResponse = await request(app)
                .get(`/api/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(getResponse.status).toBe(404);
        });

        test('should return 403 when instructor tries to delete another instructor\'s lesson', async () => {
            const deleteTestModule = await createTestModule(testCourse.id, { 
                title: 'Delete Auth Test Module', 
                orderIndex: 51 
            });

            const createResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${deleteTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Protected Lesson' });

            const lessonId = createResponse.body.id;

            const response = await request(app)
                .delete(`/api/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${otherInstructorToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });

        test('should allow admin to delete any lesson', async () => {
            const deleteTestModule = await createTestModule(testCourse.id, { 
                title: 'Admin Delete Test Module', 
                orderIndex: 52 
            });

            const createResponse = await request(app)
                .post(`/api/courses/${testCourse.id}/modules/${deleteTestModule.id}/lessons`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ title: 'Admin Delete Test' });

            const lessonId = createResponse.body.id;

            const response = await request(app)
                .delete(`/api/lessons/${lessonId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        test('should return 404 for non-existent lesson', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .delete(`/api/lessons/${fakeUuid}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toMatch(/lesson not found/i);
        });
    });
});
