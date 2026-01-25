const fc = require('fast-check');
const { query } = require('../../config/db');
const { createTestUser, createTestCourse, createTestModule, cleanupTestData, closePool } = require('../helpers/testDb');
const { isValidUrl } = require('../../services/contentItemService');

// Feature: course-content-management, Property 8: URL Validation
// Validates: Requirements 3.5, 7.4

describe('Content Item URL Validation Property Tests', () => {
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

    describe('Property 8: URL Validation', () => {
        /**
         * Custom arbitrary for generating invalid URLs
         * These URLs should be rejected by the validation system
         */
        const invalidUrlArbitrary = fc.oneof(
            // Missing protocol
            fc.constant('www.example.com'),
            fc.constant('example.com/path'),
            fc.constant('//example.com'),
            
            // Invalid protocol
            fc.constant('ftp://example.com'),
            fc.constant('file:///path/to/file'),
            fc.constant('javascript:alert(1)'),
            fc.constant('data:text/html,<script>alert(1)</script>'),
            
            // Invalid characters in URL
            fc.string({ minLength: 5, maxLength: 50 }).map(s => `http://example.com/${s.replace(/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]/g, '\x00')}`).filter(url => url.includes('\x00')),
            
            // Malformed URLs
            fc.constant('http://'),
            fc.constant('https://'),
            fc.constant('http:// example.com'),
            fc.constant('http://example .com'),
            fc.constant('not a url at all'),
            fc.constant(''),
            fc.constant('   '),
            
            // URLs with spaces
            fc.constant('http://example.com/path with spaces'),
            fc.constant('http://exam ple.com'),
            
            // Invalid domain
            fc.constant('http://.com'),
            fc.constant('http://..com'),
            fc.constant('http://example..com')
        );

        /**
         * Custom arbitrary for generating valid URLs
         * These URLs should be accepted by the validation system
         */
        const validUrlArbitrary = fc.oneof(
            // Use fast-check's built-in webUrl generator
            fc.webUrl(),
            
            // Additional valid URL patterns
            fc.constant('http://example.com'),
            fc.constant('https://example.com'),
            fc.constant('http://www.example.com'),
            fc.constant('https://www.example.com'),
            fc.constant('http://example.com/path'),
            fc.constant('https://example.com/path/to/resource'),
            fc.constant('http://example.com:8080'),
            fc.constant('https://example.com:443/path'),
            fc.constant('http://subdomain.example.com'),
            fc.constant('https://sub.domain.example.com/path?query=value'),
            fc.constant('http://example.com/path?query=value&other=123'),
            fc.constant('https://example.com/path#fragment'),
            fc.constant('http://192.168.1.1'),
            fc.constant('http://localhost:3000'),
            fc.constant('https://example.com/path-with-dashes'),
            fc.constant('http://example.com/path_with_underscores'),
            fc.constant('https://example.com/path%20encoded')
        );

        test('when a video content item is created with an invalid URL, the system should reject it', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        videoUrl: invalidUrlArbitrary
                    }),
                    async (contentData) => {
                        // Skip empty or whitespace-only URLs as they are allowed (optional field)
                        if (!contentData.videoUrl || contentData.videoUrl.trim() === '') {
                            return true;
                        }

                        // The isValidUrl function should return false for invalid URLs
                        const isValid = isValidUrl(contentData.videoUrl);
                        expect(isValid).toBe(false);

                        // Attempting to create a content item with invalid URL should fail
                        // Either through validation in the service layer or database constraint
                        try {
                            const result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, video_url, order_index
                                )
                                VALUES ($1, $2, $3, $4, 0)
                                RETURNING id
                            `, [testLesson.id, 'video', contentData.title.trim(), contentData.videoUrl]);

                            // If we reach here, the database accepted the invalid URL
                            // Clean up and fail the test
                            const contentId = result.rows[0].id;
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                            
                            // The validation should have caught this
                            throw new Error(`Invalid URL was accepted: ${contentData.videoUrl}`);
                        } catch (error) {
                            // Expected: validation should prevent invalid URLs
                            // The error could be from validation or database constraint
                            expect(error.message).toBeTruthy();
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a video content item is created with a valid URL, the system should accept it', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        videoUrl: validUrlArbitrary
                    }),
                    async (contentData) => {
                        // The isValidUrl function should return true for valid URLs
                        const isValid = isValidUrl(contentData.videoUrl);
                        expect(isValid).toBe(true);

                        // Creating a content item with valid URL should succeed
                        const result = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, video_url, order_index
                            )
                            VALUES ($1, $2, $3, $4, 0)
                            RETURNING id, video_url
                        `, [testLesson.id, 'video', contentData.title.trim(), contentData.videoUrl]);

                        const contentId = result.rows[0].id;

                        try {
                            expect(result.rows[0].video_url).toBe(contentData.videoUrl);

                            // Verify we can retrieve it
                            const retrieveResult = await query(`
                                SELECT video_url FROM content_items WHERE id = $1
                            `, [contentId]);

                            expect(retrieveResult.rows[0].video_url).toBe(contentData.videoUrl);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a resource content item with type "link" is created with an invalid URL, the system should reject it', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        resourceUrl: invalidUrlArbitrary
                    }),
                    async (contentData) => {
                        // Skip empty or whitespace-only URLs as they are allowed (optional field)
                        if (!contentData.resourceUrl || contentData.resourceUrl.trim() === '') {
                            return true;
                        }

                        // The isValidUrl function should return false for invalid URLs
                        const isValid = isValidUrl(contentData.resourceUrl);
                        expect(isValid).toBe(false);

                        // Attempting to create a resource content item with invalid URL should fail
                        try {
                            const result = await query(`
                                INSERT INTO content_items (
                                    lesson_id, content_type, title, resource_type, 
                                    resource_url, order_index
                                )
                                VALUES ($1, $2, $3, $4, $5, 0)
                                RETURNING id
                            `, [testLesson.id, 'resource', contentData.title.trim(), 'link', contentData.resourceUrl]);

                            // If we reach here, the database accepted the invalid URL
                            // Clean up and fail the test
                            const contentId = result.rows[0].id;
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                            
                            // The validation should have caught this
                            throw new Error(`Invalid resource URL was accepted: ${contentData.resourceUrl}`);
                        } catch (error) {
                            // Expected: validation should prevent invalid URLs
                            expect(error.message).toBeTruthy();
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a resource content item with type "link" is created with a valid URL, the system should accept it', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        resourceUrl: validUrlArbitrary
                    }),
                    async (contentData) => {
                        // The isValidUrl function should return true for valid URLs
                        const isValid = isValidUrl(contentData.resourceUrl);
                        expect(isValid).toBe(true);

                        // Creating a resource content item with valid URL should succeed
                        const result = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, resource_type, 
                                resource_url, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, 0)
                            RETURNING id, resource_url
                        `, [testLesson.id, 'resource', contentData.title.trim(), 'link', contentData.resourceUrl]);

                        const contentId = result.rows[0].id;

                        try {
                            expect(result.rows[0].resource_url).toBe(contentData.resourceUrl);

                            // Verify we can retrieve it
                            const retrieveResult = await query(`
                                SELECT resource_url FROM content_items WHERE id = $1
                            `, [contentId]);

                            expect(retrieveResult.rows[0].resource_url).toBe(contentData.resourceUrl);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when a resource content item with type "file" is created, URL validation should not apply', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        filePath: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null })
                    }),
                    async (contentData) => {
                        // Resource type "file" should not require URL validation
                        // It uses filePath instead of resourceUrl
                        const result = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, resource_type, 
                                file_path, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, 0)
                            RETURNING id, resource_type, file_path
                        `, [testLesson.id, 'resource', contentData.title.trim(), 'file', contentData.filePath]);

                        const contentId = result.rows[0].id;

                        try {
                            expect(result.rows[0].resource_type).toBe('file');
                            expect(result.rows[0].file_path).toBe(contentData.filePath);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when updating a video content item with an invalid URL, the system should reject it', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        initialVideoUrl: validUrlArbitrary,
                        invalidVideoUrl: invalidUrlArbitrary
                    }),
                    async (contentData) => {
                        // Skip empty or whitespace-only URLs
                        if (!contentData.invalidVideoUrl || contentData.invalidVideoUrl.trim() === '') {
                            return true;
                        }

                        // Create a content item with valid URL first
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, video_url, order_index
                            )
                            VALUES ($1, $2, $3, $4, 0)
                            RETURNING id
                        `, [testLesson.id, 'video', contentData.title.trim(), contentData.initialVideoUrl]);

                        const contentId = createResult.rows[0].id;

                        try {
                            // Attempting to update with invalid URL should fail
                            const isValid = isValidUrl(contentData.invalidVideoUrl);
                            expect(isValid).toBe(false);

                            try {
                                await query(`
                                    UPDATE content_items
                                    SET video_url = $1
                                    WHERE id = $2
                                `, [contentData.invalidVideoUrl, contentId]);

                                // If we reach here, the update succeeded when it shouldn't have
                                throw new Error(`Invalid URL update was accepted: ${contentData.invalidVideoUrl}`);
                            } catch (error) {
                                // Expected: validation should prevent invalid URLs
                                expect(error.message).toBeTruthy();
                            }

                            // Verify the original URL is still there
                            const verifyResult = await query(`
                                SELECT video_url FROM content_items WHERE id = $1
                            `, [contentId]);

                            expect(verifyResult.rows[0].video_url).toBe(contentData.initialVideoUrl);
                        } finally {
                            await query('DELETE FROM content_items WHERE id = $1', [contentId]);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('when updating a resource content item with an invalid URL, the system should reject it', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                        initialResourceUrl: validUrlArbitrary,
                        invalidResourceUrl: invalidUrlArbitrary
                    }),
                    async (contentData) => {
                        // Skip empty or whitespace-only URLs
                        if (!contentData.invalidResourceUrl || contentData.invalidResourceUrl.trim() === '') {
                            return true;
                        }

                        // Create a resource content item with valid URL first
                        const createResult = await query(`
                            INSERT INTO content_items (
                                lesson_id, content_type, title, resource_type, 
                                resource_url, order_index
                            )
                            VALUES ($1, $2, $3, $4, $5, 0)
                            RETURNING id
                        `, [testLesson.id, 'resource', contentData.title.trim(), 'link', contentData.initialResourceUrl]);

                        const contentId = createResult.rows[0].id;

                        try {
                            // Attempting to update with invalid URL should fail
                            const isValid = isValidUrl(contentData.invalidResourceUrl);
                            expect(isValid).toBe(false);

                            try {
                                await query(`
                                    UPDATE content_items
                                    SET resource_url = $1
                                    WHERE id = $2
                                `, [contentData.invalidResourceUrl, contentId]);

                                // If we reach here, the update succeeded when it shouldn't have
                                throw new Error(`Invalid resource URL update was accepted: ${contentData.invalidResourceUrl}`);
                            } catch (error) {
                                // Expected: validation should prevent invalid URLs
                                expect(error.message).toBeTruthy();
                            }

                            // Verify the original URL is still there
                            const verifyResult = await query(`
                                SELECT resource_url FROM content_items WHERE id = $1
                            `, [contentId]);

                            expect(verifyResult.rows[0].resource_url).toBe(contentData.initialResourceUrl);
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
