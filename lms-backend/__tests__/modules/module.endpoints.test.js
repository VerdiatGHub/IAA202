const request = require('supertest');
const express = require('express');
const { generateToken } = require('../../middleware/auth');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');
const moduleRoutes = require('../../routes/modules');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api', moduleRoutes);

// Unit tests for module endpoints
// Validates: Requirements 1.1, 1.2, 1.3, 12.2

describe('Module Endpoints Unit Tests', () => {
    let adminUser, adminToken;
    let instructorUser, instructorToken;
    let otherInstructorUser, otherInstructorToken;
    let studentUser, studentToken;
    let testCourse, otherCourse;

    beforeAll(async () => {
        // Create test users
        adminUser = await createTestUser({ role: 'admin', email: 'admin@test.com' });
        adminToken = generateToken(adminUser);

        instructorUser = await createTestUser({ role: 'instructor', email: 'instructor@test.com' });
        instructorToken = generateToken(instructorUser);

        otherInstructorUser = await createTestUser({ role: 'instructor', email: 'other@test.com' });
        otherInstructorToken = generateToken(otherInstructorUser);

        studentUser = await createTestUser({ role: 'student', email: 'student@test.com' });
        studentToken = generateToken(studentUser);

        // Create test courses
        testCourse = await createTestCourse(instructorUser.id, { title: 'Test Course 1' });
        otherCourse = await createTestCourse(otherInstructorUser.id, { title: 'Test Course 2' });
    });

    afterAll(async () => {
        await cleanupTestData();
        await closePool();
    });

    describe('POST /api/courses/:courseId/modules - Create Module', () => {
        test('should successfully create a module with valid data', async () => {
            const moduleData = {
                title: 'Week 1: Introduction',
                description: 'Introduction to the course'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(moduleData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(moduleData.title);
            expect(response.body.description).toBe(moduleData.description);
            expect(response.body.courseId).toBe(testCourse.id);
            expect(response.body.orderIndex).toBeGreaterThanOrEqual(0);
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).toHaveProperty('updatedAt');
        });

        test('should return 400 for missing title', async () => {
            const moduleData = {
                description: 'Module without title'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(moduleData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/title/i);
        });

        test('should return 400 for empty title', async () => {
            const moduleData = {
                title: '   ',
                description: 'Module with empty title'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(moduleData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/title/i);
        });

        test('should return 403 when instructor tries to create module in another instructor\'s course', async () => {
            const moduleData = {
                title: 'Unauthorized Module',
                description: 'Should not be created'
            };

            const response = await request(app)
                .post(`/api/courses/${otherCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(moduleData);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/access denied/i);
        });

        test('should allow admin to create module in any course', async () => {
            const moduleData = {
                title: 'Admin Created Module',
                description: 'Created by admin'
            };

            const response = await request(app)
                .post(`/api/courses/${otherCourse.id}/modules`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(moduleData);

            expect(response.status).toBe(201);
            expect(response.body.title).toBe(moduleData.title);
        });

        test('should return 404 for non-existent course', async () => {
            const moduleData = {
                title: 'Module for non-existent course',
                description: 'Should fail'
            };

            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .post(`/api/courses/${fakeUuid}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(moduleData);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/course not found/i);
        });

        test('should return 401 without authentication token', async () => {
            const moduleData = {
                title: 'Unauthenticated Module',
                description: 'Should fail'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .send(moduleData);

            expect(response.status).toBe(401);
        });

        test('should return 403 when student tries to create module', async () => {
            const moduleData = {
                title: 'Student Module',
                description: 'Should fail'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(moduleData);

            expect(response.status).toBe(403);
        });

        test('should trim whitespace from title', async () => {
            const moduleData = {
                title: '  Week 2: Advanced Topics  ',
                description: 'Testing title trimming'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(moduleData);

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Week 2: Advanced Topics');
        });

        test('should handle null description', async () => {
            const moduleData = {
                title: 'Module without description'
            };

            const response = await request(app)
                .post(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(moduleData);

            expect(response.status).toBe(201);
            expect(response.body.description).toBeNull();
        });
    });

    describe('GET /api/courses/:courseId/modules - Get All Modules', () => {
        let courseWithModules;
        let module1, module2;

        beforeAll(async () => {
            courseWithModules = await createTestCourse(instructorUser.id, { title: 'Test Course with Modules' });
            module1 = await createTestModule(courseWithModules.id, { title: 'Module 1', orderIndex: 0 });
            module2 = await createTestModule(courseWithModules.id, { title: 'Module 2', orderIndex: 1 });
        });

        test('should return all modules for a course', async () => {
            const response = await request(app)
                .get(`/api/courses/${courseWithModules.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('modules');
            expect(Array.isArray(response.body.modules)).toBe(true);
            expect(response.body.modules.length).toBeGreaterThanOrEqual(2);
        });

        test('should return modules in order by orderIndex', async () => {
            const response = await request(app)
                .get(`/api/courses/${courseWithModules.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            const modules = response.body.modules;
            
            // Check that modules are sorted by orderIndex
            for (let i = 1; i < modules.length; i++) {
                expect(modules[i].orderIndex).toBeGreaterThanOrEqual(modules[i - 1].orderIndex);
            }
        });

        test('should return 404 for non-existent course', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/api/courses/${fakeUuid}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/courses/${courseWithModules.id}/modules`);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/courses/:courseId/modules/:moduleId - Get Specific Module', () => {
        let testModule;

        beforeAll(async () => {
            testModule = await createTestModule(testCourse.id, { 
                title: 'Specific Module Test',
                description: 'Testing specific module retrieval'
            });
        });

        test('should return specific module by id', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${testModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(testModule.id);
            expect(response.body.title).toBe(testModule.title);
            expect(response.body.description).toBe(testModule.description);
            expect(response.body).toHaveProperty('lessons');
            expect(Array.isArray(response.body.lessons)).toBe(true);
        });

        test('should return 404 for non-existent module', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${fakeUuid}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/module not found/i);
        });

        test('should return 404 when module belongs to different course', async () => {
            const otherModule = await createTestModule(otherCourse.id, { title: 'Other Course Module' });

            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${otherModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/courses/:courseId/modules/:moduleId - Update Module', () => {
        let moduleToUpdate;

        beforeEach(async () => {
            moduleToUpdate = await createTestModule(testCourse.id, { 
                title: 'Original Title',
                description: 'Original Description'
            });
        });

        test('should successfully update module title', async () => {
            const updateData = {
                title: 'Updated Title'
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/${moduleToUpdate.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe(updateData.title);
            expect(response.body.description).toBe(moduleToUpdate.description);
        });

        test('should successfully update module description', async () => {
            const updateData = {
                description: 'Updated Description'
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/${moduleToUpdate.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.description).toBe(updateData.description);
            expect(response.body.title).toBe(moduleToUpdate.title);
        });

        test('should successfully update both title and description', async () => {
            const updateData = {
                title: 'New Title',
                description: 'New Description'
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/${moduleToUpdate.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe(updateData.title);
            expect(response.body.description).toBe(updateData.description);
        });

        test('should return 403 when instructor tries to update another instructor\'s module', async () => {
            const otherModule = await createTestModule(otherCourse.id, { title: 'Other Module' });
            const updateData = {
                title: 'Unauthorized Update'
            };

            const response = await request(app)
                .put(`/api/courses/${otherCourse.id}/modules/${otherModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });

        test('should allow admin to update any module', async () => {
            const updateData = {
                title: 'Admin Updated Title'
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/${moduleToUpdate.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe(updateData.title);
        });

        test('should return 404 for non-existent module', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const updateData = {
                title: 'Update Non-existent'
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/${fakeUuid}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(404);
        });

        test('should return 400 for empty update data', async () => {
            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/${moduleToUpdate.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/no fields to update/i);
        });

        test('should trim whitespace from updated title', async () => {
            const updateData = {
                title: '  Trimmed Title  '
            };

            const response = await request(app)
                .put(`/api/courses/${testCourse.id}/modules/${moduleToUpdate.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Trimmed Title');
        });
    });

    describe('DELETE /api/courses/:courseId/modules/:moduleId - Delete Module', () => {
        test('should successfully delete a module', async () => {
            const moduleToDelete = await createTestModule(testCourse.id, { title: 'Module to Delete' });

            const response = await request(app)
                .delete(`/api/courses/${testCourse.id}/modules/${moduleToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');

            // Verify module is deleted
            const getResponse = await request(app)
                .get(`/api/courses/${testCourse.id}/modules/${moduleToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(getResponse.status).toBe(404);
        });

        test('should return 403 when instructor tries to delete another instructor\'s module', async () => {
            const otherModule = await createTestModule(otherCourse.id, { title: 'Protected Module' });

            const response = await request(app)
                .delete(`/api/courses/${otherCourse.id}/modules/${otherModule.id}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });

        test('should allow admin to delete any module', async () => {
            const moduleToDelete = await createTestModule(otherCourse.id, { title: 'Admin Delete Test' });

            const response = await request(app)
                .delete(`/api/courses/${otherCourse.id}/modules/${moduleToDelete.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        test('should return 404 for non-existent module', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .delete(`/api/courses/${testCourse.id}/modules/${fakeUuid}`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toMatch(/module not found/i);
        });

        test('should return 401 without authentication', async () => {
            const moduleToDelete = await createTestModule(testCourse.id, { title: 'Unauth Delete Test' });

            const response = await request(app)
                .delete(`/api/courses/${testCourse.id}/modules/${moduleToDelete.id}`);

            expect(response.status).toBe(401);
        });

        test('should return 403 when student tries to delete module', async () => {
            const moduleToDelete = await createTestModule(testCourse.id, { title: 'Student Delete Test' });

            const response = await request(app)
                .delete(`/api/courses/${testCourse.id}/modules/${moduleToDelete.id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('Authorization Edge Cases', () => {
        test('should handle invalid JWT token', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', 'Bearer invalid_token_here');

            expect(response.status).toBe(403);
        });

        test('should handle malformed authorization header', async () => {
            const response = await request(app)
                .get(`/api/courses/${testCourse.id}/modules`)
                .set('Authorization', 'InvalidFormat');

            expect(response.status).toBe(401);
        });
    });
});

    describe('PUT /api/courses/:courseId/modules/reorder - Reorder Modules', () => {
        let reorderCourse;
        let reorderModule1, reorderModule2, reorderModule3;

        beforeAll(async () => {
            // Create a course with multiple modules for reordering tests
            reorderCourse = await createTestCourse(instructorUser.id, { title: 'Reorder Test Course' });
            reorderModule1 = await createTestModule(reorderCourse.id, { title: 'Module 1', orderIndex: 0 });
            reorderModule2 = await createTestModule(reorderCourse.id, { title: 'Module 2', orderIndex: 1 });
            reorderModule3 = await createTestModule(reorderCourse.id, { title: 'Module 3', orderIndex: 2 });
        });

        test('should successfully reorder modules', async () => {
            // Reverse the order: 3, 2, 1
            const reorderData = {
                moduleIds: [reorderModule3.id, reorderModule2.id, reorderModule1.id]
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('modules');
            expect(Array.isArray(response.body.modules)).toBe(true);
            expect(response.body.modules.length).toBe(3);

            // Verify the new order
            const modules = response.body.modules;
            expect(modules[0].id).toBe(reorderModule3.id);
            expect(modules[0].orderIndex).toBe(0);
            expect(modules[1].id).toBe(reorderModule2.id);
            expect(modules[1].orderIndex).toBe(1);
            expect(modules[2].id).toBe(reorderModule1.id);
            expect(modules[2].orderIndex).toBe(2);
        });

        test('should update order_index values correctly', async () => {
            // Reorder: 2, 1, 3
            const reorderData = {
                moduleIds: [reorderModule2.id, reorderModule1.id, reorderModule3.id]
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            
            const modules = response.body.modules;
            // Verify each module has the correct order_index
            expect(modules[0].orderIndex).toBe(0);
            expect(modules[1].orderIndex).toBe(1);
            expect(modules[2].orderIndex).toBe(2);
            
            // Verify no duplicate order_index values
            const orderIndices = modules.map(m => m.orderIndex);
            const uniqueIndices = new Set(orderIndices);
            expect(uniqueIndices.size).toBe(orderIndices.length);
        });

        test('should return 400 for missing moduleIds', async () => {
            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/moduleIds/i);
        });

        test('should return 400 for empty moduleIds array', async () => {
            const reorderData = {
                moduleIds: []
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 400 for non-array moduleIds', async () => {
            const reorderData = {
                moduleIds: 'not-an-array'
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 400 when module does not belong to course', async () => {
            const otherCourseModule = await createTestModule(otherCourse.id, { title: 'Other Course Module' });
            
            const reorderData = {
                moduleIds: [reorderModule1.id, otherCourseModule.id, reorderModule2.id]
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/do not belong to this course/i);
        });

        test('should return 403 when instructor tries to reorder another instructor\'s modules', async () => {
            const reorderData = {
                moduleIds: [reorderModule1.id, reorderModule2.id, reorderModule3.id]
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/access denied/i);
        });

        test('should allow admin to reorder any course modules', async () => {
            const reorderData = {
                moduleIds: [reorderModule1.id, reorderModule2.id, reorderModule3.id]
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('modules');
        });

        test('should return 404 for non-existent course', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const reorderData = {
                moduleIds: [reorderModule1.id, reorderModule2.id]
            };

            const response = await request(app)
                .put(`/api/courses/${fakeUuid}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/course not found/i);
        });

        test('should return 401 without authentication', async () => {
            const reorderData = {
                moduleIds: [reorderModule1.id, reorderModule2.id]
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .send(reorderData);

            expect(response.status).toBe(401);
        });

        test('should return 403 when student tries to reorder modules', async () => {
            const reorderData = {
                moduleIds: [reorderModule1.id, reorderModule2.id]
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(reorderData);

            expect(response.status).toBe(403);
        });

        test('should handle reordering with 2 modules', async () => {
            const smallCourse = await createTestCourse(instructorUser.id, { title: 'Small Course' });
            const mod1 = await createTestModule(smallCourse.id, { title: 'Mod A', orderIndex: 0 });
            const mod2 = await createTestModule(smallCourse.id, { title: 'Mod B', orderIndex: 1 });

            const reorderData = {
                moduleIds: [mod2.id, mod1.id]
            };

            const response = await request(app)
                .put(`/api/courses/${smallCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            expect(response.body.modules[0].id).toBe(mod2.id);
            expect(response.body.modules[0].orderIndex).toBe(0);
            expect(response.body.modules[1].id).toBe(mod1.id);
            expect(response.body.modules[1].orderIndex).toBe(1);
        });

        test('should handle reordering with 10+ modules', async () => {
            const largeCourse = await createTestCourse(instructorUser.id, { title: 'Large Course' });
            const modules = [];
            
            // Create 12 modules
            for (let i = 0; i < 12; i++) {
                const mod = await createTestModule(largeCourse.id, { 
                    title: `Module ${i + 1}`, 
                    orderIndex: i 
                });
                modules.push(mod);
            }

            // Reverse the order
            const reversedIds = modules.map(m => m.id).reverse();
            const reorderData = {
                moduleIds: reversedIds
            };

            const response = await request(app)
                .put(`/api/courses/${largeCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(response.status).toBe(200);
            expect(response.body.modules.length).toBe(12);
            
            // Verify the order is reversed
            for (let i = 0; i < 12; i++) {
                expect(response.body.modules[i].id).toBe(reversedIds[i]);
                expect(response.body.modules[i].orderIndex).toBe(i);
            }
        });

        test('should maintain data integrity after reordering', async () => {
            // Reorder modules
            const reorderData = {
                moduleIds: [reorderModule2.id, reorderModule3.id, reorderModule1.id]
            };

            const reorderResponse = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            expect(reorderResponse.status).toBe(200);

            // Fetch modules again to verify persistence
            const getResponse = await request(app)
                .get(`/api/courses/${reorderCourse.id}/modules`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(getResponse.status).toBe(200);
            const modules = getResponse.body.modules;
            
            // Verify the order persisted
            expect(modules[0].id).toBe(reorderModule2.id);
            expect(modules[1].id).toBe(reorderModule3.id);
            expect(modules[2].id).toBe(reorderModule1.id);
            
            // Verify module data is intact (title, description, etc.)
            expect(modules[0].title).toBe('Module 2');
            expect(modules[1].title).toBe('Module 3');
            expect(modules[2].title).toBe('Module 1');
        });

        test('should handle invalid UUID in moduleIds', async () => {
            const reorderData = {
                moduleIds: ['invalid-uuid', reorderModule1.id]
            };

            const response = await request(app)
                .put(`/api/courses/${reorderCourse.id}/modules/reorder`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(reorderData);

            // Should return 400 or 500 depending on validation
            expect([400, 500]).toContain(response.status);
        });
    });
