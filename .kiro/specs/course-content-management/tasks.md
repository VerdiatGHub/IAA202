# Implementation Plan: Course Content Management System

## Overview

This implementation plan breaks down the course content management system into incremental coding tasks. The approach follows a bottom-up strategy: database schema → backend API → frontend services → frontend components. Each task builds on previous work, ensuring continuous integration and early validation of core functionality.

## Tasks

- [x] 1. Database Schema Setup
  - Create migration file for new tables (modules, content_items) and enum types
  - Add module_id and is_required columns to lessons table
  - Create indexes for performance optimization
  - Write migration rollback script
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 14.1_

- [-] 2. Implement Module API Endpoints
  - [x] 2.1 Create module routes file and controller
    - Implement GET /api/courses/:courseId/modules endpoint
    - Implement POST /api/courses/:courseId/modules endpoint
    - Implement GET /api/courses/:courseId/modules/:moduleId endpoint
    - Implement PUT /api/courses/:courseId/modules/:moduleId endpoint
    - Implement DELETE /api/courses/:courseId/modules/:moduleId endpoint
    - Add authentication and authorization middleware
    - _Requirements: 1.1, 1.2, 1.3, 12.1, 12.2, 12.3_

  - [x] 2.2 Write property test for module CRUD operations
    - **Property 1: CRUD Operations Preserve Data Integrity**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 Create module service layer
    - Implement database queries for module operations
    - Implement order_index calculation logic (max + 1)
    - Implement cascading delete logic
    - Handle transaction management
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.4 Write property test for order assignment
    - **Property 4: Order Assignment**
    - **Validates: Requirements 1.4**

  - [x] 2.5 Write unit tests for module endpoints
    - Test successful module creation
    - Test validation errors (missing title)
    - Test authorization (instructor can only edit own courses)
    - Test 404 for non-existent modules
    - _Requirements: 1.1, 1.2, 1.3, 12.2_

- [ ] 3. Implement Module Reordering
  - [x] 3.1 Create reorder endpoint and logic
    - Implement PUT /api/courses/:courseId/modules/reorder endpoint
    - Calculate new order_index values for all affected modules
    - Update all modules in a single transaction
    - _Requirements: 8.1, 8.4_

  - [~] 3.2 Write property test for reordering
    - **Property 5: Reordering Updates All Affected Indices**
    - **Property 6: Reordering Preserves Relationships**
    - **Validates: Requirements 8.1, 8.3**

  - [~] 3.3 Write unit tests for reordering edge cases
    - Test reordering with 2 modules
    - Test reordering with 10+ modules
    - Test invalid reorder requests
    - _Requirements: 8.1_

- [x] 4. Checkpoint - Verify Module API
  - Ensure all module tests pass, ask the user if questions arise.

- [ ] 5. Extend Lesson API for Modules
  - [x] 5.1 Update lesson routes and controller
    - Modify POST endpoint to accept moduleId
    - Modify GET endpoint to filter by moduleId
    - Update lesson queries to include module_id and is_required
    - Add lesson reordering endpoint within modules
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3_

  - [x] 5.2 Write property test for lesson CRUD
    - **Property 1: CRUD Operations Preserve Data Integrity**
    - **Property 4: Order Assignment**
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [x] 5.3 Update lesson service layer
    - Modify create to assign module_id
    - Implement order_index calculation within module scope
    - Update cascading delete to include content_items
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 5.4 Write property test for cascading deletion
    - **Property 3: Cascading Deletion**
    - **Validates: Requirements 2.3**

  - [x] 5.5 Write unit tests for lesson operations
    - Test lesson creation within module
    - Test lesson ordering within module
    - Test required/optional status
    - _Requirements: 2.1, 2.4, 9.3_

- [ ] 6. Implement Content Item API
  - [x] 6.1 Create content item routes and controller
    - Implement GET /api/lessons/:lessonId/content endpoint
    - Implement POST /api/lessons/:lessonId/content endpoint
    - Implement GET /api/content/:contentId endpoint
    - Implement PUT /api/content/:contentId endpoint
    - Implement DELETE /api/content/:contentId endpoint
    - Add content type validation
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 14.1_

  - [x] 6.2 Write property test for content item CRUD
    - **Property 1: CRUD Operations Preserve Data Integrity**
    - **Property 2: Updates Persist Correctly**
    - **Validates: Requirements 3.1, 3.3, 4.1, 4.2, 5.1, 6.1, 7.1**

  - [x] 6.3 Create content item service layer
    - Implement content type-specific validation
    - Implement URL validation for video and resource types
    - Implement order_index calculation
    - Handle quiz_id and assignment_id references
    - _Requirements: 3.1, 3.5, 4.1, 5.1, 6.1, 7.1, 7.4, 14.1_

  - [~] 6.4 Write property test for URL validation
    - **Property 8: URL Validation**
    - **Validates: Requirements 3.5, 7.4**

  - [~] 6.5 Write unit tests for content types
    - Test video content creation with URL and duration
    - Test text content with rich text formatting
    - Test quiz content linking to existing quiz
    - Test assignment content creation
    - Test resource content with file and link types
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 7. Implement Content Item Reordering
  - [~] 7.1 Create content reorder endpoint
    - Implement PUT /api/lessons/:lessonId/content/reorder endpoint
    - Update order_index for all content items in lesson
    - Use transaction for atomic updates
    - _Requirements: 14.2, 14.4_

  - [~] 7.2 Write property test for content reordering
    - **Property 5: Reordering Updates All Affected Indices**
    - **Validates: Requirements 14.2**

  - [~] 7.3 Write unit tests for content reordering
    - Test reordering with mixed content types
    - Test reordering preserves content data
    - _Requirements: 14.2_

- [~] 8. Checkpoint - Verify Backend API
  - Ensure all backend tests pass, ask the user if questions arise.

- [ ] 9. Create TypeScript Types and Interfaces
  - [~] 9.1 Define frontend types
    - Create Module, Lesson, ContentItem interfaces
    - Create DTO types for create/update operations
    - Create ContentType enum
    - Add types to types/index.ts
    - _Requirements: All requirements (type safety)_

- [ ] 10. Implement Frontend API Services
  - [~] 10.1 Create module service
    - Implement getModules, createModule, updateModule, deleteModule functions
    - Implement reorderModules function
    - Add error handling and type safety
    - _Requirements: 1.1, 1.2, 1.3, 8.1_

  - [~] 10.2 Create lesson service (extend existing)
    - Add module-aware lesson functions
    - Implement reorderLessons function
    - Update existing lesson service to handle module_id
    - _Requirements: 2.1, 2.2, 2.3, 8.2_

  - [~] 10.3 Create content item service
    - Implement getContentItems, createContentItem, updateContentItem, deleteContentItem
    - Implement reorderContentItems function
    - Add content type-specific validation
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 14.2_

- [ ] 11. Create Course Content Context
  - [~] 11.1 Implement CourseContentContext
    - Create context with state for modules, lessons, content items
    - Implement loading and error states
    - Create provider component
    - _Requirements: All requirements (state management)_

  - [~] 11.2 Implement context actions
    - Add module CRUD actions
    - Add lesson CRUD actions
    - Add content item CRUD actions
    - Add reordering actions
    - Implement optimistic updates with rollback
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 12. Implement Module Components
  - [~] 12.1 Create ModuleList component
    - Render list of modules in order
    - Implement expand/collapse functionality
    - Add "Add Module" button
    - Display loading and empty states
    - _Requirements: 10.2, 8.5_

  - [~] 12.2 Create ModuleItem component
    - Display module header with title and description
    - Show lesson count and total duration
    - Add edit and delete buttons
    - Implement expand/collapse for lessons
    - _Requirements: 10.2, 10.5_

  - [~] 12.3 Create ModuleEditorModal component
    - Form for creating/editing modules
    - Title and description fields
    - Validation and error handling
    - _Requirements: 1.1, 1.2_

  - [~] 12.4 Write unit tests for module components
    - Test ModuleList rendering
    - Test ModuleItem interactions
    - Test ModuleEditorModal form submission
    - _Requirements: 10.2, 10.5_

- [ ] 13. Implement Lesson Components
  - [~] 13.1 Create LessonList component
    - Render lessons within a module
    - Display in order_index order
    - Add "Add Lesson" button
    - _Requirements: 10.2, 8.5_

  - [~] 13.2 Create LessonItem component
    - Display lesson header with title
    - Show content item count
    - Add edit and delete buttons
    - Implement expand/collapse for content items
    - Display required/optional badge
    - _Requirements: 10.2, 10.5, 9.1, 9.2_

  - [~] 13.3 Create LessonEditorModal component
    - Form for creating/editing lessons
    - Title, content, video URL fields
    - Required/optional toggle
    - Duration input
    - _Requirements: 2.1, 2.2, 9.1, 9.2_

  - [~] 13.4 Write unit tests for lesson components
    - Test LessonList rendering
    - Test LessonItem interactions
    - Test required/optional display
    - _Requirements: 10.2, 9.1, 9.2_

- [ ] 14. Implement Content Item Components
  - [~] 14.1 Create ContentItemList component
    - Render content items within a lesson
    - Display in order_index order
    - Add "Add Content" button with type selector
    - _Requirements: 10.2, 14.3_

  - [~] 14.2 Create ContentItemRow component
    - Display content type icon (video, text, quiz, assignment, resource)
    - Show content title and duration (if applicable)
    - Display required/optional badge
    - Add edit and delete buttons
    - _Requirements: 10.3, 10.5, 15.5_

  - [~] 14.3 Write property test for content type icons
    - **Property 16: Content Type Icons Display**
    - **Validates: Requirements 10.3, 15.5**

  - [~] 14.4 Create ContentEditorModal component
    - Content type selector (for create mode)
    - Render type-specific forms (VideoForm, TextForm, QuizForm, AssignmentForm, ResourceForm)
    - Validation for each content type
    - Required/optional toggle
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1_

  - [~] 14.5 Create content type-specific form components
    - VideoContentForm (URL, duration)
    - TextContentForm (rich text editor)
    - QuizContentForm (link to existing quiz or create new)
    - AssignmentContentForm (link to existing assignment or create new)
    - ResourceContentForm (file upload or URL)
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1_

  - [~] 14.6 Write property test for rich text preservation
    - **Property 9: Rich Text Preservation**
    - **Validates: Requirements 4.4**

  - [~] 14.7 Write unit tests for content components
    - Test ContentItemRow rendering for each type
    - Test ContentEditorModal type switching
    - Test form validation
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 15. Implement Drag-and-Drop Reordering
  - [~] 15.1 Add drag-and-drop library
    - Install react-beautiful-dnd or @dnd-kit/core
    - Configure drag-and-drop providers
    - _Requirements: 8.1, 8.2, 14.2_

  - [~] 15.2 Implement module drag-and-drop
    - Make ModuleList draggable
    - Handle onDragEnd to reorder modules
    - Update UI optimistically
    - _Requirements: 8.1, 10.6_

  - [~] 15.3 Implement lesson drag-and-drop
    - Make LessonList draggable within modules
    - Handle onDragEnd to reorder lessons
    - Update UI optimistically
    - _Requirements: 8.2, 10.6_

  - [~] 15.4 Implement content item drag-and-drop
    - Make ContentItemList draggable
    - Handle onDragEnd to reorder content items
    - Update UI optimistically
    - _Requirements: 14.2, 10.6_

  - [~] 15.5 Write unit tests for drag-and-drop
    - Test module reordering
    - Test lesson reordering
    - Test content item reordering
    - _Requirements: 8.1, 8.2, 14.2_

- [~] 16. Checkpoint - Verify Core UI
  - Ensure all component tests pass, ask the user if questions arise.

- [ ] 17. Implement Lessons Tab in Course Management
  - [~] 17.1 Add Lessons tab to course management page
    - Update CourseTabs component to include "Lessons" tab
    - Create LessonsTab component
    - Integrate CourseContentEditor into LessonsTab
    - _Requirements: 10.1_

  - [~] 17.2 Wire up CourseContentEditor
    - Load course content on tab selection
    - Provide CourseContentContext to child components
    - Handle loading and error states
    - _Requirements: 10.2_

  - [~] 17.3 Write unit test for Lessons tab
    - Test tab rendering
    - Test tab switching
    - _Requirements: 10.1_

- [ ] 18. Implement Preview Mode
  - [~] 18.1 Add preview mode toggle
    - Add "Preview" button to CourseContentEditor
    - Implement preview mode state
    - Toggle between edit and preview modes
    - _Requirements: 11.1, 11.5_

  - [~] 18.2 Create StudentContentView component
    - Display modules, lessons, and content in read-only format
    - Hide all editing controls
    - Show required/optional indicators
    - Display content type icons
    - Sort by order_index
    - _Requirements: 11.2, 11.3, 11.4, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [~] 18.3 Write property test for preview mode
    - **Property 18: Preview Mode Hides Editing Controls**
    - **Property 19: Preview Mode Displays Correct Ordering**
    - **Validates: Requirements 11.2, 11.3**

  - [~] 18.4 Write unit tests for preview mode
    - Test preview mode activation
    - Test editing controls hidden
    - Test preview mode exit
    - _Requirements: 11.1, 11.2, 11.5_

- [ ] 19. Implement Access Control
  - [~] 19.1 Add authorization checks to frontend
    - Check user role before showing Course_Editor
    - Verify instructor assignment for instructor role
    - Show appropriate error messages for unauthorized access
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [~] 19.2 Write property tests for access control
    - **Property 11: Access Control for Admins**
    - **Property 12: Access Control for Instructors**
    - **Property 13: Access Denial for Unauthorized Users**
    - **Property 14: Student View Restrictions**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

  - [~] 19.3 Write unit tests for authorization
    - Test admin access to all courses
    - Test instructor access to assigned courses
    - Test instructor denied access to other courses
    - Test student view restrictions
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 20. Implement Error Handling and User Feedback
  - [~] 20.1 Add error handling to all API calls
    - Display toast notifications for errors
    - Show inline error messages for validation
    - Implement retry logic for transient failures
    - _Requirements: 13.2, 13.5_

  - [~] 20.2 Add confirmation dialogs
    - Confirm before deleting modules
    - Confirm before deleting lessons
    - Confirm before deleting content items
    - _Requirements: 1.3, 2.3_

  - [~] 20.3 Add success feedback
    - Show toast on successful create/update/delete
    - Show loading spinners during operations
    - _Requirements: 13.5_

  - [~] 20.4 Write property test for error handling
    - **Property 15: Error Handling and Rollback**
    - **Validates: Requirements 13.2**

  - [~] 20.5 Write unit tests for error scenarios
    - Test network error handling
    - Test validation error display
    - Test confirmation dialogs
    - _Requirements: 13.2, 13.5_

- [ ] 21. Implement Student View for Course Content
  - [~] 21.1 Create student course content page
    - Display modules and lessons for enrolled students
    - Show content items within lessons
    - Display required/optional indicators
    - Show content type icons
    - Sort all content by order_index
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [~] 21.2 Write property test for student view
    - **Property 7: Display Ordering**
    - **Property 17: Required Content Indicators**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4**

  - [~] 21.3 Write unit tests for student view
    - Test module display
    - Test lesson display
    - Test content item display
    - Test required/optional indicators
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 22. Data Migration for Existing Courses
  - [~] 22.1 Create migration script
    - Create default "General" module for each course
    - Migrate existing lessons to default module
    - Preserve existing lesson order_index
    - _Requirements: 1.1, 2.1_

  - [~] 22.2 Test migration script
    - Test with sample data
    - Verify data integrity after migration
    - Test rollback capability
    - _Requirements: 1.1, 2.1_

- [ ] 23. Final Integration Testing
  - [~] 23.1 Write end-to-end integration tests
    - Test complete flow: create module → add lesson → add content
    - Test reordering across all levels
    - Test preview mode
    - Test student view
    - _Requirements: All requirements_

  - [~] 23.2 Write property test for hierarchical structure
    - **Property 20: Hierarchical Tree Structure Display**
    - **Validates: Requirements 10.2**

  - [~] 23.3 Manual testing checklist
    - Test on different screen sizes
    - Test with large datasets (100+ modules)
    - Test concurrent editing scenarios
    - Test browser compatibility
    - _Requirements: All requirements_

- [~] 24. Final Checkpoint - Complete System Verification
  - Ensure all tests pass, verify all requirements are met, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → backend → frontend
- All database operations use transactions to ensure data integrity
- Frontend uses optimistic updates with rollback on failure
- All tests are required for comprehensive quality assurance

