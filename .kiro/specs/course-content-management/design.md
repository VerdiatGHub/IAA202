# Design Document: Course Content Management System

## Overview

This design document specifies the implementation of a comprehensive course content management system for an existing Learning Management System (LMS). The system introduces a hierarchical content structure (Modules → Lessons → Content Items) that enables instructors and administrators to organize course materials in a structured, pedagogically sound manner similar to platforms like Coursera.

The design extends the existing flat lesson structure to support:
- **Modules**: Top-level organizational containers (e.g., "Week 1: Introduction to HTML")
- **Lessons**: Learning units within modules (e.g., "Lesson 1.1: HTML Basics")
- **Content Items**: Multiple content types within lessons (videos, text, quizzes, assignments, resources)

The system maintains backward compatibility with the existing LMS infrastructure while adding new capabilities for content organization, reordering, and management through an intuitive Course Editor interface.

## Architecture

### Database Schema Changes

The implementation requires adding new tables and modifying existing ones to support the hierarchical content structure.

#### New Tables

**1. modules table**
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, order_index);
```

**2. content_items table**
```sql
CREATE TYPE content_type AS ENUM ('video', 'text', 'quiz', 'assignment', 'resource');

CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    content_type content_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT true,
    
    -- Video-specific fields
    video_url TEXT,
    duration INTEGER, -- in minutes
    
    -- Text-specific fields
    text_content TEXT,
    
    -- Quiz-specific fields (links to existing quizzes table)
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    
    -- Assignment-specific fields (links to existing assignments table)
    assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    
    -- Resource-specific fields
    resource_type TEXT, -- 'file' or 'link'
    resource_url TEXT,
    file_path TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_items_lesson ON content_items(lesson_id);
CREATE INDEX idx_content_items_order ON content_items(lesson_id, order_index);
CREATE INDEX idx_content_items_type ON content_items(content_type);
```

#### Modified Tables

**lessons table** - Add module_id and is_required fields:
```sql
ALTER TABLE lessons ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX idx_lessons_module ON lessons(module_id);
```

**Migration Strategy**: Existing lessons without module_id will be handled by creating a default "General" module for each course during migration.

### API Endpoints

The system follows RESTful conventions matching the existing API patterns.

#### Module Endpoints

```
GET    /api/courses/:courseId/modules
POST   /api/courses/:courseId/modules
GET    /api/courses/:courseId/modules/:moduleId
PUT    /api/courses/:courseId/modules/:moduleId
DELETE /api/courses/:courseId/modules/:moduleId
PUT    /api/courses/:courseId/modules/:moduleId/reorder
```

#### Lesson Endpoints (Extended)

```
GET    /api/courses/:courseId/modules/:moduleId/lessons
POST   /api/courses/:courseId/modules/:moduleId/lessons
GET    /api/lessons/:lessonId
PUT    /api/lessons/:lessonId
DELETE /api/lessons/:lessonId
PUT    /api/lessons/:lessonId/reorder
```

#### Content Item Endpoints

```
GET    /api/lessons/:lessonId/content
POST   /api/lessons/:lessonId/content
GET    /api/content/:contentId
PUT    /api/content/:contentId
DELETE /api/content/:contentId
PUT    /api/content/:contentId/reorder
```

#### Bulk Reorder Endpoint

```
PUT    /api/courses/:courseId/content/reorder
Body: {
  modules: [{ id: uuid, orderIndex: number }],
  lessons: [{ id: uuid, orderIndex: number }],
  contentItems: [{ id: uuid, orderIndex: number }]
}
```

### Frontend Architecture

#### Component Hierarchy

```
CourseManagementPage
├── CourseTabs
│   ├── DetailsTab (existing)
│   ├── LessonsTab (NEW)
│   └── SettingsTab (existing)
└── LessonsTab
    ├── CourseContentEditor
    │   ├── ModuleList
    │   │   └── ModuleItem
    │   │       ├── ModuleHeader
    │   │       ├── LessonList
    │   │       │   └── LessonItem
    │   │       │       ├── LessonHeader
    │   │       │       └── ContentItemList
    │   │       │           └── ContentItemRow
    │   │       └── AddLessonButton
    │   └── AddModuleButton
    ├── ContentEditorModal
    │   ├── VideoContentForm
    │   ├── TextContentForm
    │   ├── QuizContentForm
    │   ├── AssignmentContentForm
    │   └── ResourceContentForm
    └── PreviewMode
        └── StudentContentView
```

#### State Management

The system uses React Context for managing course content state:

```typescript
interface CourseContentContextValue {
  modules: Module[];
  loading: boolean;
  error: string | null;
  
  // Module operations
  addModule: (module: CreateModuleDto) => Promise<Module>;
  updateModule: (id: string, data: UpdateModuleDto) => Promise<Module>;
  deleteModule: (id: string) => Promise<void>;
  reorderModules: (moduleIds: string[]) => Promise<void>;
  
  // Lesson operations
  addLesson: (moduleId: string, lesson: CreateLessonDto) => Promise<Lesson>;
  updateLesson: (id: string, data: UpdateLessonDto) => Promise<Lesson>;
  deleteLesson: (id: string) => Promise<void>;
  reorderLessons: (moduleId: string, lessonIds: string[]) => Promise<void>;
  
  // Content item operations
  addContentItem: (lessonId: string, item: CreateContentItemDto) => Promise<ContentItem>;
  updateContentItem: (id: string, data: UpdateContentItemDto) => Promise<ContentItem>;
  deleteContentItem: (id: string) => Promise<void>;
  reorderContentItems: (lessonId: string, itemIds: string[]) => Promise<void>;
  
  // Utility
  refreshContent: () => Promise<void>;
}
```

## Components and Interfaces

### Backend Components

#### 1. Module Controller
Handles HTTP requests for module CRUD operations and reordering.

**Responsibilities:**
- Validate incoming module data
- Authorize user access (admin/instructor only)
- Delegate to Module Service
- Return formatted responses

**Key Methods:**
- `getModules(courseId)`: Retrieve all modules for a course
- `createModule(courseId, data)`: Create new module
- `updateModule(moduleId, data)`: Update module details
- `deleteModule(moduleId)`: Delete module and cascade to lessons
- `reorderModules(courseId, orderData)`: Update module order indices

#### 2. Lesson Controller (Extended)
Extends existing lesson controller with module-aware operations.

**Responsibilities:**
- Handle lesson CRUD within module context
- Manage lesson ordering within modules
- Validate lesson data and permissions

**Key Methods:**
- `getLessons(moduleId)`: Get lessons for a module
- `createLesson(moduleId, data)`: Create lesson in module
- `updateLesson(lessonId, data)`: Update lesson
- `deleteLesson(lessonId)`: Delete lesson
- `reorderLessons(moduleId, orderData)`: Reorder lessons in module

#### 3. Content Item Controller
Manages content items within lessons.

**Responsibilities:**
- Handle CRUD for all content types
- Validate content-type-specific data
- Manage content item ordering

**Key Methods:**
- `getContentItems(lessonId)`: Get all content for a lesson
- `createContentItem(lessonId, data)`: Create new content item
- `updateContentItem(contentId, data)`: Update content item
- `deleteContentItem(contentId)`: Delete content item
- `reorderContentItems(lessonId, orderData)`: Reorder content items

#### 4. Module Service
Business logic for module operations.

**Responsibilities:**
- Execute database operations for modules
- Calculate and update order indices
- Handle cascading operations

**Key Methods:**
- `findByCourseId(courseId)`: Query modules with lessons
- `create(courseId, data)`: Insert new module with next order index
- `update(moduleId, data)`: Update module fields
- `delete(moduleId)`: Delete module (cascades to lessons)
- `reorder(courseId, orderMap)`: Batch update order indices

#### 5. Content Item Service
Business logic for content items.

**Responsibilities:**
- Manage content item database operations
- Handle content-type-specific logic
- Link to existing quiz/assignment records

**Key Methods:**
- `findByLessonId(lessonId)`: Query content items for lesson
- `create(lessonId, data)`: Insert content item with validation
- `update(contentId, data)`: Update content item
- `delete(contentId)`: Delete content item
- `reorder(lessonId, orderMap)`: Update content item order

### Frontend Components

#### 1. CourseContentEditor
Main container component for the content management interface.

**Props:**
```typescript
interface CourseContentEditorProps {
  courseId: string;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
}
```

**Responsibilities:**
- Load course content on mount
- Provide context to child components
- Handle preview mode toggle
- Display loading and error states

#### 2. ModuleList
Renders the list of modules with expand/collapse functionality.

**Props:**
```typescript
interface ModuleListProps {
  modules: Module[];
  onAddModule: () => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (moduleId: string) => void;
  onReorderModules: (sourceIndex: number, destIndex: number) => void;
}
```

**Responsibilities:**
- Render module items in order
- Handle drag-and-drop reordering
- Provide add module button
- Manage expand/collapse state

#### 3. ModuleItem
Individual module component with nested lessons.

**Props:**
```typescript
interface ModuleItemProps {
  module: Module;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
}
```

**Responsibilities:**
- Display module header with title and description
- Show lesson count and duration
- Provide edit/delete actions
- Render nested LessonList when expanded

#### 4. LessonItem
Individual lesson component with nested content items.

**Props:**
```typescript
interface LessonItemProps {
  lesson: Lesson;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddContent: () => void;
}
```

**Responsibilities:**
- Display lesson header with title
- Show content item count
- Provide edit/delete actions
- Render ContentItemList when expanded

#### 5. ContentItemRow
Individual content item display with type-specific icons.

**Props:**
```typescript
interface ContentItemRowProps {
  contentItem: ContentItem;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Responsibilities:**
- Display content type icon (video, text, quiz, assignment, resource)
- Show content title and duration (if applicable)
- Display required/optional badge
- Provide edit/delete actions

#### 6. ContentEditorModal
Modal for creating/editing content items with type-specific forms.

**Props:**
```typescript
interface ContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  contentItem?: ContentItem; // undefined for create, defined for edit
  onSave: (data: ContentItemDto) => Promise<void>;
}
```

**Responsibilities:**
- Display content type selector (for create mode)
- Render appropriate form based on content type
- Validate form data
- Submit to API and handle errors

#### 7. StudentContentView
Preview component showing content as students see it.

**Props:**
```typescript
interface StudentContentViewProps {
  courseId: string;
}
```

**Responsibilities:**
- Display modules and lessons in read-only mode
- Show required/optional indicators
- Display content type icons
- Hide all editing controls

## Data Models

### TypeScript Interfaces

```typescript
// Module
interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

interface CreateModuleDto {
  title: string;
  description?: string;
}

interface UpdateModuleDto {
  title?: string;
  description?: string;
  orderIndex?: number;
}

// Lesson (Extended)
interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  orderIndex: number;
  duration: number | null;
  isRequired: boolean;
  contentItems: ContentItem[];
  createdAt: string;
  updatedAt: string;
}

interface CreateLessonDto {
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  isRequired?: boolean;
}

interface UpdateLessonDto {
  title?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  isRequired?: boolean;
  orderIndex?: number;
}

// Content Item
type ContentType = 'video' | 'text' | 'quiz' | 'assignment' | 'resource';

interface ContentItem {
  id: string;
  lessonId: string;
  contentType: ContentType;
  title: string;
  description: string | null;
  orderIndex: number;
  isRequired: boolean;
  
  // Type-specific fields (only populated based on contentType)
  videoUrl?: string;
  duration?: number;
  textContent?: string;
  quizId?: string;
  assignmentId?: string;
  resourceType?: 'file' | 'link';
  resourceUrl?: string;
  filePath?: string;
  
  createdAt: string;
  updatedAt: string;
}

interface CreateContentItemDto {
  contentType: ContentType;
  title: string;
  description?: string;
  isRequired?: boolean;
  
  // Video fields
  videoUrl?: string;
  duration?: number;
  
  // Text fields
  textContent?: string;
  
  // Quiz fields
  quizId?: string;
  
  // Assignment fields
  assignmentId?: string;
  
  // Resource fields
  resourceType?: 'file' | 'link';
  resourceUrl?: string;
  filePath?: string;
}

interface UpdateContentItemDto extends Partial<CreateContentItemDto> {
  orderIndex?: number;
}

// Reorder DTOs
interface ReorderModulesDto {
  modules: Array<{ id: string; orderIndex: number }>;
}

interface ReorderLessonsDto {
  lessons: Array<{ id: string; orderIndex: number }>;
}

interface ReorderContentItemsDto {
  contentItems: Array<{ id: string; orderIndex: number }>;
}
```

### Database Models

The database models follow PostgreSQL conventions with UUID primary keys and timestamp tracking.

**Key Relationships:**
- `courses` 1:N `modules` (one course has many modules)
- `modules` 1:N `lessons` (one module has many lessons)
- `lessons` 1:N `content_items` (one lesson has many content items)
- `content_items` N:1 `quizzes` (optional, for quiz content type)
- `content_items` N:1 `assignments` (optional, for assignment content type)

**Ordering Strategy:**
All ordered entities (modules, lessons, content_items) use an `order_index` integer field. When reordering:
1. Client sends new order as array of IDs
2. Server calculates new order_index values (0, 1, 2, ...)
3. Server updates all affected records in a transaction

**Cascading Deletes:**
- Deleting a course cascades to modules
- Deleting a module cascades to lessons
- Deleting a lesson cascades to content_items
- Deleting a content_item does NOT delete linked quizzes/assignments (SET NULL)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CRUD Operations Preserve Data Integrity

*For any* module, lesson, or content item, when it is created with valid data, then retrieving it should return the same data that was provided during creation.

**Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**

### Property 2: Updates Persist Correctly

*For any* existing module, lesson, or content item, when it is updated with new valid data, then retrieving it should return the updated data.

**Validates: Requirements 1.2, 2.2, 3.3, 4.2, 5.3, 6.2, 7.2**

### Property 3: Cascading Deletion

*For any* module with lessons, when the module is deleted, then all lessons within that module should also be deleted. Similarly, *for any* lesson with content items, when the lesson is deleted, then all content items within that lesson should also be deleted.

**Validates: Requirements 1.3, 2.3**

### Property 4: Order Assignment

*For any* course, module, or lesson, when a new child entity (module, lesson, or content item) is added, then its order_index should be one greater than the maximum existing order_index of siblings, or 0 if no siblings exist.

**Validates: Requirements 1.4, 2.4, 14.1**

### Property 5: Reordering Updates All Affected Indices

*For any* collection of ordered entities (modules in a course, lessons in a module, or content items in a lesson), when they are reordered, then all affected entities should have their order_index values updated to reflect the new order, and no two entities should have the same order_index.

**Validates: Requirements 8.1, 8.2, 14.2**

### Property 6: Reordering Preserves Relationships

*For any* module reordering operation, the lessons within each module should remain associated with their original parent module after the reorder completes.

**Validates: Requirements 8.3**

### Property 7: Display Ordering

*For any* query that retrieves modules, lessons, or content items, the results should be sorted by order_index in ascending order.

**Validates: Requirements 8.5, 14.3, 15.1, 15.2, 15.3**

### Property 8: URL Validation

*For any* video content item or resource content item with a URL, the system should reject URLs that are not properly formatted (missing protocol, invalid characters, etc.) before persisting to the database.

**Validates: Requirements 3.5, 7.4**

### Property 9: Rich Text Preservation

*For any* text content item containing rich text formatting (bold, italic, lists, links), when the content is saved and retrieved, the formatting should be preserved exactly as entered.

**Validates: Requirements 4.4**

### Property 10: Required Status Management

*For any* lesson or content item, when its required status is changed from true to false or vice versa, then retrieving the entity should reflect the updated status. Additionally, *for any* newly created lesson, the default required status should be true.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 11: Access Control for Admins

*For any* course and any user with admin role, the user should be granted access to the Course_Editor for that course.

**Validates: Requirements 12.3**

### Property 12: Access Control for Instructors

*For any* course and any user with instructor role, the user should be granted access to the Course_Editor if and only if the user is assigned as the instructor for that course.

**Validates: Requirements 12.2**

### Property 13: Access Denial for Unauthorized Users

*For any* course and any user who is neither an admin nor the assigned instructor, when the user attempts to access the Course_Editor, the system should deny access and return an error.

**Validates: Requirements 12.1, 12.4**

### Property 14: Student View Restrictions

*For any* user with student role, when accessing course content, the system should display the content in read-only Student_View format without any editing controls.

**Validates: Requirements 12.5**

### Property 15: Error Handling and Rollback

*For any* database operation (create, update, delete), if the operation fails due to a database error, then the system should maintain the previous state (no partial updates) and return an error message to the user.

**Validates: Requirements 13.2**

### Property 16: Content Type Icons Display

*For any* content item displayed in the Course_Editor or Student_View, the UI should show an icon corresponding to the content type (video, text, quiz, assignment, resource).

**Validates: Requirements 10.3, 15.5**

### Property 17: Required Content Indicators

*For any* content item marked as required, when displayed in Student_View or preview mode, the UI should show a visual indicator distinguishing it from optional content.

**Validates: Requirements 11.4, 15.4**

### Property 18: Preview Mode Hides Editing Controls

*For any* Course_Editor in preview mode, all editing controls (add, edit, delete, reorder buttons) should be hidden from the UI.

**Validates: Requirements 11.2**

### Property 19: Preview Mode Displays Correct Ordering

*For any* Course_Editor in preview mode, modules, lessons, and content items should be displayed in order_index ascending order, matching the Student_View.

**Validates: Requirements 11.3**

### Property 20: Hierarchical Tree Structure Display

*For any* course with modules and lessons, when the Lessons tab is selected in the Course_Editor, the UI should render a hierarchical tree structure showing modules as parent nodes and lessons as child nodes.

**Validates: Requirements 10.2**

## Error Handling

The system implements comprehensive error handling at multiple layers to ensure data integrity and provide clear feedback to users.

### API Layer Error Handling

**Validation Errors (400 Bad Request)**
- Missing required fields (title, content type, etc.)
- Invalid data formats (malformed URLs, negative durations)
- Invalid enum values (content type, course level)
- Empty or whitespace-only strings for required text fields

**Authentication Errors (401 Unauthorized)**
- Missing or invalid authentication token
- Expired session token

**Authorization Errors (403 Forbidden)**
- Instructor attempting to edit another instructor's course
- Student attempting to access Course_Editor
- Non-admin attempting to access admin-only endpoints

**Not Found Errors (404 Not Found)**
- Course, module, lesson, or content item ID does not exist
- Referenced quiz or assignment does not exist

**Conflict Errors (409 Conflict)**
- Attempting to create duplicate order_index values
- Concurrent modification conflicts

**Server Errors (500 Internal Server Error)**
- Database connection failures
- Unexpected exceptions during processing
- Transaction rollback failures

### Database Layer Error Handling

**Transaction Management**
- All multi-step operations (reordering, cascading deletes) execute within database transactions
- If any step fails, the entire transaction rolls back
- No partial updates are persisted

**Constraint Violations**
- Foreign key violations (referencing non-existent course/module/lesson)
- NOT NULL constraint violations
- CHECK constraint violations (e.g., negative order_index)

**Connection Handling**
- Connection pool management with automatic retry
- Graceful degradation on connection loss
- Timeout handling for long-running queries

### Frontend Error Handling

**Network Errors**
- Display user-friendly error messages for network failures
- Retry mechanism for transient failures
- Offline detection and appropriate messaging

**Validation Errors**
- Client-side validation before API calls
- Display field-specific error messages
- Prevent form submission with invalid data

**State Management Errors**
- Optimistic UI updates with rollback on failure
- Loading states during async operations
- Error boundaries to catch React component errors

**User Feedback**
- Toast notifications for success/error messages
- Inline error messages for form validation
- Confirmation dialogs for destructive actions (delete)

### Logging and Monitoring

**Server-Side Logging**
- Log all API requests with timestamp, user, and endpoint
- Log all errors with stack traces
- Log database query performance for slow queries

**Client-Side Logging**
- Log JavaScript errors to monitoring service
- Track user actions for debugging
- Performance monitoring for slow renders

## Testing Strategy

The testing strategy employs a dual approach combining unit tests for specific scenarios and property-based tests for comprehensive coverage.

### Property-Based Testing

Property-based tests validate universal properties across randomly generated inputs. Each property test runs a minimum of 100 iterations to ensure comprehensive coverage.

**Testing Library**: 
- Backend: `fast-check` (JavaScript/TypeScript property-based testing library)
- Frontend: `fast-check` with React Testing Library

**Property Test Configuration**:
```typescript
// Example property test configuration
fc.assert(
  fc.property(
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }),
      description: fc.option(fc.string({ maxLength: 1000 }))
    }),
    async (moduleData) => {
      // Test property
    }
  ),
  { numRuns: 100 } // Minimum 100 iterations
);
```

**Property Test Tags**:
Each property test must include a comment tag referencing the design property:
```typescript
// Feature: course-content-management, Property 1: CRUD Operations Preserve Data Integrity
test('module creation preserves data', async () => {
  // Property test implementation
});
```

**Key Property Tests**:

1. **CRUD Operations** (Properties 1-2)
   - Generate random valid data for modules, lessons, content items
   - Verify create → read returns same data
   - Verify update → read returns updated data

2. **Cascading Deletion** (Property 3)
   - Generate random hierarchies (modules with lessons, lessons with content)
   - Delete parent entities
   - Verify all children are deleted

3. **Order Assignment and Reordering** (Properties 4-7)
   - Generate random collections with various order_index values
   - Add new entities and verify order_index = max + 1
   - Reorder entities and verify all indices are updated correctly
   - Verify no duplicate order_index values

4. **Validation** (Property 8)
   - Generate invalid URLs (missing protocol, invalid characters)
   - Verify system rejects invalid data
   - Generate valid URLs and verify acceptance

5. **Access Control** (Properties 11-14)
   - Generate random users with different roles
   - Generate random course-instructor assignments
   - Verify access granted/denied based on role and assignment

6. **Error Handling** (Property 15)
   - Simulate database failures
   - Verify state rollback
   - Verify error messages returned

### Unit Testing

Unit tests validate specific examples, edge cases, and integration points.

**Testing Framework**:
- Backend: Jest
- Frontend: Vitest + React Testing Library

**Unit Test Focus Areas**:

1. **API Endpoints**
   - Test each endpoint with valid requests
   - Test error responses (400, 401, 403, 404, 500)
   - Test authentication and authorization middleware

2. **Service Layer**
   - Test business logic functions
   - Test database query construction
   - Test transaction handling

3. **React Components**
   - Test component rendering with various props
   - Test user interactions (clicks, form submissions)
   - Test state management and context

4. **Edge Cases**
   - Empty collections (no modules, no lessons)
   - Maximum length strings
   - Boundary values for order_index
   - Concurrent operations

5. **Integration Tests**
   - Test complete user flows (create module → add lesson → add content)
   - Test API → Database → API round trips
   - Test frontend → backend integration

**Example Unit Tests**:

```typescript
// Backend API test
describe('POST /api/courses/:courseId/modules', () => {
  it('should create module with valid data', async () => {
    const response = await request(app)
      .post('/api/courses/test-course-id/modules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Week 1', description: 'Introduction' });
    
    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Week 1');
  });

  it('should return 400 for missing title', async () => {
    const response = await request(app)
      .post('/api/courses/test-course-id/modules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Introduction' });
    
    expect(response.status).toBe(400);
  });
});

// Frontend component test
describe('ModuleItem', () => {
  it('should render module title and lesson count', () => {
    const module = {
      id: '1',
      title: 'Week 1',
      lessons: [{}, {}]
    };
    
    render(<ModuleItem module={module} />);
    
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('2 lessons')).toBeInTheDocument();
  });
});
```

### Test Coverage Goals

- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 70% code coverage
- **Property Tests**: All 20 correctness properties must have corresponding tests
- **Critical Paths**: 100% coverage for authentication, authorization, and data persistence

### Testing Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use beforeEach/afterEach to reset database state
3. **Mocking**: Mock external dependencies (file uploads, external APIs)
4. **Assertions**: Use specific assertions (toBe, toEqual) rather than truthy checks
5. **Descriptive Names**: Test names should clearly describe what is being tested
6. **Fast Execution**: Unit tests should run quickly (< 5 seconds total)
7. **Property Test Generators**: Create reusable generators for common data types
