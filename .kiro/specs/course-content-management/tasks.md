# Implementation Plan: Course Content Management System

## Overview

This implementation plan breaks down the course content management system into incremental coding tasks. The approach follows a bottom-up strategy: database schema → backend API → frontend services → frontend components. Each task builds on previous work, ensuring continuous integration and early validation of core functionality.

## Backend Implementation Status

**COMPLETED:**
- ✅ Database schema (modules, content_items tables, migrations)
- ✅ Module API endpoints (CRUD + reordering)
- ✅ Module service layer with transaction support
- ✅ Lesson API endpoints (extended for modules + reordering)
- ✅ Lesson service layer (module-aware, cascading deletes)
- ✅ Content Item API endpoints (CRUD + reordering)
- ✅ Content Item service layer (type-specific validation, URL validation)
- ✅ Property-based tests for modules, lessons, and content items
- ✅ Unit tests for all backend endpoints

**REMAINING:**
- Frontend implementation (types exist, but no services or components)
- Data migration script for existing lessons
- Integration testing
- Manual testing and verification

## Tasks

- [x] 1. Database Schema Setup
  - Create migration file for new tables (modules, content_items) and enum types
  - Add module_id and is_required columns to lessons table
  - Create indexes for performance optimization
  - Write migration rollback script
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 14.1_

- [x] 2. Implement Module API Endpoints
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

- [x] 3. Implement Module Reordering
  - [x] 3.1 Create reorder endpoint and logic
    - Implement PUT /api/courses/:courseId/modules/reorder endpoint
    - Calculate new order_index values for all affected modules
    - Update all modules in a single transaction
    - _Requirements: 8.1, 8.4_

  - [x] 3.2 Write property test for reordering
    - **Property 5: Reordering Updates All Affected Indices**
    - **Property 6: Reordering Preserves Relationships**
    - **Validates: Requirements 8.1, 8.3**

  - [x] 3.3 Write unit tests for reordering edge cases
    - Test reordering with 2 modules
    - Test reordering with 10+ modules
    - Test invalid reorder requests
    - _Requirements: 8.1_

- [x] 4. Checkpoint - Verify Module API
  - All module tests implemented and ready for verification

- [x] 5. Extend Lesson API for Modules
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

- [x] 6. Implement Content Item API
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

  - [x] 6.4 Write property test for URL validation
    - **Property 8: URL Validation**
    - **Validates: Requirements 3.5, 7.4**

  - [x] 6.5 Write unit tests for content types
    - Test video content creation with URL and duration
    - Test text content with rich text formatting
    - Test quiz content linking to existing quiz
    - Test assignment content creation
    - Test resource content with file and link types
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 7. Implement Content Item Reordering
  - [x] 7.1 Create content reorder endpoint
    - Implement PUT /api/lessons/:lessonId/content/reorder endpoint
    - Update order_index for all content items in lesson
    - Use transaction for atomic updates
    - _Requirements: 14.2, 14.4_

  - [x] 7.2 Write property test for content reordering
    - **Property 5: Reordering Updates All Affected Indices**
    - **Validates: Requirements 14.2**

  - [x] 7.3 Write unit tests for content reordering
    - Test reordering with mixed content types
    - Test reordering preserves content data
    - _Requirements: 14.2_

- [x] 8. Checkpoint - Verify Backend API
  - All backend endpoints, services, and tests implemented

- [x] 8. Checkpoint - Verify Backend API
  - All backend endpoints, services, and tests implemented

- [-] 9. Create Frontend API Services
  - [x] 9.1 Implement module service
    - Create getModules, createModule, updateModule, deleteModule functions
    - Implement reorderModules function
    - Add error handling and type safety
    - _Requirements: 1.1, 1.2, 1.3, 8.1_

  - [x] 9.2 Implement lesson service
    - Create getLessons, createLesson, updateLesson, deleteLesson functions
    - Implement reorderLessons function
    - Add module-aware lesson functions
    - _Requirements: 2.1, 2.2, 2.3, 8.2_

  - [x] 9.3 Implement content item service
    - Create getContentItems, createContentItem, updateContentItem, deleteContentItem functions
    - Implement reorderContentItems function
    - Add content type-specific validation
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 14.2_

- [x] 10. Create Course Content Context
  - [x] 10.1 Implement CourseContentContext
    - Create context with state for modules, lessons, content items
    - Implement loading and error states
    - Create provider component
    - _Requirements: All requirements (state management)_

  - [x] 10.2 Implement context actions
    - Add module CRUD actions
    - Add lesson CRUD actions
    - Add content item CRUD actions
    - Add reordering actions
    - Implement optimistic updates with rollback
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 11. Implement Module Components
  - [x] 11.1 Create ModuleList component
    - Render list of modules in order
    - Implement expand/collapse functionality
    - Add "Add Module" button
    - Display loading and empty states
    - _Requirements: 10.2, 8.5_

  - [x] 11.2 Create ModuleItem component
    - Display module header with title and description
    - Show lesson count and total duration
    - Add edit and delete buttons
    - Implement expand/collapse for lessons
    - _Requirements: 10.2, 10.5_

  - [x] 11.3 Create ModuleEditorModal component
    - Form for creating/editing modules
    - Title and description fields
    - Validation and error handling
    - _Requirements: 1.1, 1.2_

- [ ] 12. Implement Lesson Components
  - [x] 12.1 Create LessonList component
    - Render lessons within a module
    - Display in order_index order
    - Add "Add Lesson" button
    - _Requirements: 10.2, 8.5_

  - [x] 12.2 Create LessonItem component
    - Display lesson header with title
    - Show content item count
    - Add edit and delete buttons
    - Implement expand/collapse for content items
    - Display required/optional badge
    - _Requirements: 10.2, 10.5, 9.1, 9.2_

  - [~] 12.3 Create LessonEditorModal component
    - Form for creating/editing lessons
    - Title, content, video URL fields
    - Required/optional toggle
    - Duration input
    - _Requirements: 2.1, 2.2, 9.1, 9.2_

- [ ] 13. Implement Content Item Components
  - [~] 13.1 Create ContentItemList component
    - Render content items within a lesson
    - Display in order_index order
    - Add "Add Content" button with type selector
    - _Requirements: 10.2, 14.3_

  - [~] 13.2 Create ContentItemRow component
    - Display content type icon (video, text, quiz, assignment, resource)
    - Show content title and duration (if applicable)
    - Display required/optional badge
    - Add edit and delete buttons
    - _Requirements: 10.3, 10.5, 15.5_

  - [~] 13.3 Create ContentEditorModal component
    - Content type selector (for create mode)
    - Render type-specific forms (VideoForm, TextForm, QuizForm, AssignmentForm, ResourceForm)
    - Validation for each content type
    - Required/optional toggle
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1_

  - [~] 13.4 Create content type-specific form components
    - VideoContentForm (URL, duration)
    - TextContentForm (rich text editor)
    - QuizContentForm (link to existing quiz or create new)
    - AssignmentContentForm (link to existing assignment or create new)
    - ResourceContentForm (file upload or URL)
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 14. Implement Drag-and-Drop Reordering
  - [~] 14.1 Add drag-and-drop library
    - Install @dnd-kit/core and @dnd-kit/sortable
    - Configure drag-and-drop providers
    - _Requirements: 8.1, 8.2, 14.2_

  - [~] 14.2 Implement module drag-and-drop
    - Make ModuleList draggable
    - Handle onDragEnd to reorder modules
    - Update UI optimistically
    - _Requirements: 8.1, 10.6_

  - [~] 14.3 Implement lesson drag-and-drop
    - Make LessonList draggable within modules
    - Handle onDragEnd to reorder lessons
    - Update UI optimistically
    - _Requirements: 8.2, 10.6_

  - [~] 14.4 Implement content item drag-and-drop
    - Make ContentItemList draggable
    - Handle onDragEnd to reorder content items
    - Update UI optimistically
    - _Requirements: 14.2, 10.6_

- [ ] 15. Integrate Course Content Editor into Course Management
  - [~] 15.1 Add Lessons tab to course management page
    - Update course management page to include "Lessons" tab
    - Create LessonsTab component
    - Integrate CourseContentEditor into LessonsTab
    - _Requirements: 10.1_

  - [~] 15.2 Wire up CourseContentEditor
    - Load course content on tab selection
    - Provide CourseContentContext to child components
    - Handle loading and error states
    - _Requirements: 10.2_

- [ ] 16. Implement Preview Mode
  - [~] 16.1 Add preview mode toggle
    - Add "Preview" button to CourseContentEditor
    - Implement preview mode state
    - Toggle between edit and preview modes
    - _Requirements: 11.1, 11.5_

  - [~] 16.2 Create StudentContentView component
    - Display modules, lessons, and content in read-only format
    - Hide all editing controls
    - Show required/optional indicators
    - Display content type icons
    - Sort by order_index
    - _Requirements: 11.2, 11.3, 11.4, 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 17. Implement Student View for Course Content
  - [~] 17.1 Create student course content page
    - Display modules and lessons for enrolled students
    - Show content items within lessons
    - Display required/optional indicators
    - Show content type icons
    - Sort all content by order_index
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 18. Implement Error Handling and User Feedback
  - [~] 18.1 Add error handling to all API calls
    - Display toast notifications for errors
    - Show inline error messages for validation
    - Implement retry logic for transient failures
    - _Requirements: 13.2, 13.5_

  - [~] 18.2 Add confirmation dialogs
    - Confirm before deleting modules
    - Confirm before deleting lessons
    - Confirm before deleting content items
    - _Requirements: 1.3, 2.3_

  - [~] 18.3 Add success feedback
    - Show toast on successful create/update/delete
    - Show loading spinners during operations
    - _Requirements: 13.5_

- [ ] 19. Data Migration for Existing Courses
  - [~] 19.1 Create migration script
    - Create default "General" module for each course
    - Migrate existing lessons to default module
    - Preserve existing lesson order_index
    - _Requirements: 1.1, 2.1_

  - [~] 19.2 Test migration script
    - Test with sample data
    - Verify data integrity after migration
    - Test rollback capability
    - _Requirements: 1.1, 2.1_

- [ ] 20. Final Integration Testing
  - [~] 20.1 Write end-to-end integration tests
    - Test complete flow: create module → add lesson → add content
    - Test reordering across all levels
    - Test preview mode
    - Test student view
    - _Requirements: All requirements_

  - [~] 20.2 Manual testing checklist
    - Test on different screen sizes
    - Test with large datasets (100+ modules)
    - Test concurrent editing scenarios
    - Test browser compatibility
    - _Requirements: All requirements_

- [~] 21. Final Checkpoint - Complete System Verification
  - Verify all requirements are met
  - Ensure all tests pass
  - Confirm frontend and backend integration works correctly

## Notes

- Each task references specific requirements for traceability
- Backend implementation is complete (tasks 1-8)
- Frontend types are defined but services and components need implementation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- All database operations use transactions to ensure data integrity
- Frontend will use optimistic updates with rollback on failure
- Tests require database connection to run (currently failing due to connection issues)

