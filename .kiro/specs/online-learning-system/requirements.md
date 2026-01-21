# Requirements Document

## Introduction

Hệ thống Học tập Trực tuyến (Online Learning System - LMS) là nền tảng web giúp quản lý toàn bộ hoạt động học tập trực tuyến. Hệ thống hỗ trợ sinh viên, giảng viên và quản trị viên với các tính năng quản lý khóa học, bài giảng, bài tập, kiểm tra và AI hỏi đáp.

**Tech Stack:**
- Frontend: React + TypeScript + Vite (deploy trên Netlify - miễn phí)
- Backend/Database: Supabase (miễn phí tier)
- AI Q&A: OpenAI API hoặc free alternatives

## Glossary

- **LMS**: Learning Management System - Hệ thống quản lý học tập
- **Student**: Sinh viên sử dụng hệ thống để học tập
- **Instructor**: Giảng viên tạo và quản lý khóa học
- **Admin**: Quản trị viên quản lý hệ thống
- **Course**: Khóa học chứa các bài giảng và bài tập
- **Lesson**: Bài giảng trong khóa học
- **Assignment**: Bài tập sinh viên cần hoàn thành
- **Quiz**: Bài kiểm tra trắc nghiệm
- **Submission**: Bài nộp của sinh viên
- **Progress**: Tiến trình học tập của sinh viên
- **AI_Assistant**: Trợ lý AI hỗ trợ hỏi đáp

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to register and login to the system, so that I can access features based on my role.

#### Acceptance Criteria

1. WHEN a user visits the login page, THE LMS SHALL display login form with email and password fields
2. WHEN a user submits valid credentials, THE LMS SHALL authenticate and redirect to appropriate dashboard based on role
3. WHEN a user submits invalid credentials, THE LMS SHALL display error message and remain on login page
4. WHEN a new user registers, THE LMS SHALL create account with default Student role
5. WHEN a user clicks logout, THE LMS SHALL end session and redirect to login page
6. WHILE a user is not authenticated, THE LMS SHALL restrict access to protected pages

### Requirement 2: Student Dashboard

**User Story:** As a student, I want to view my enrolled courses and learning progress, so that I can track my studies.

#### Acceptance Criteria

1. WHEN a student logs in, THE LMS SHALL display student dashboard with enrolled courses
2. WHEN a student views dashboard, THE LMS SHALL show overall progress percentage across all courses
3. WHEN a student clicks on a course, THE LMS SHALL navigate to course detail page
4. THE LMS SHALL display upcoming assignments and deadlines on dashboard
5. THE LMS SHALL display recent grades and feedback on dashboard

### Requirement 3: Course Enrollment

**User Story:** As a student, I want to browse and enroll in courses, so that I can start learning.

#### Acceptance Criteria

1. WHEN a student visits course catalog, THE LMS SHALL display list of available courses
2. WHEN a student searches for courses, THE LMS SHALL filter courses by name or category
3. WHEN a student clicks enroll on a course, THE LMS SHALL add student to course and show in enrolled list
4. WHEN a student is already enrolled, THE LMS SHALL display "Already Enrolled" status instead of enroll button
5. THE LMS SHALL display course information including title, description, instructor name, and lesson count

### Requirement 4: Course Content Viewing

**User Story:** As a student, I want to view course lessons and materials, so that I can learn the content.

#### Acceptance Criteria

1. WHEN a student opens an enrolled course, THE LMS SHALL display list of lessons in order
2. WHEN a student clicks on a lesson, THE LMS SHALL display lesson content (text, video, or documents)
3. WHEN a student completes viewing a lesson, THE LMS SHALL mark lesson as completed
4. THE LMS SHALL track and display lesson completion status for each lesson
5. WHILE a student has not completed previous lessons, THE LMS SHALL allow access to any lesson (non-linear learning)

### Requirement 5: Assignment Submission

**User Story:** As a student, I want to submit assignments, so that I can complete course requirements.

#### Acceptance Criteria

1. WHEN a student views an assignment, THE LMS SHALL display assignment details and deadline
2. WHEN a student submits an assignment, THE LMS SHALL save submission with timestamp
3. IF a student submits after deadline, THEN THE LMS SHALL mark submission as late
4. WHEN a student has already submitted, THE LMS SHALL display submission status and allow resubmission
5. THE LMS SHALL support text-based assignment submissions

### Requirement 6: Quiz Taking

**User Story:** As a student, I want to take quizzes, so that I can test my knowledge.

#### Acceptance Criteria

1. WHEN a student starts a quiz, THE LMS SHALL display questions one at a time or all at once based on quiz settings
2. WHEN a student submits quiz answers, THE LMS SHALL calculate and display score immediately
3. THE LMS SHALL store quiz results with correct/incorrect answers for review
4. WHEN a quiz has time limit, THE LMS SHALL display countdown timer and auto-submit when time expires
5. WHEN a student completes a quiz, THE LMS SHALL show correct answers and explanations

### Requirement 7: AI Q&A Assistant

**User Story:** As a student, I want to ask questions to AI assistant, so that I can get help with course content.

#### Acceptance Criteria

1. WHEN a student opens AI assistant, THE LMS SHALL display chat interface
2. WHEN a student sends a question, THE LMS SHALL send to AI service and display response
3. THE LMS SHALL maintain conversation history within a session
4. THE LMS SHALL provide context-aware responses based on current course content
5. IF AI service is unavailable, THEN THE LMS SHALL display friendly error message

### Requirement 8: Instructor Course Management

**User Story:** As an instructor, I want to create and manage courses, so that I can teach students.

#### Acceptance Criteria

1. WHEN an instructor creates a course, THE LMS SHALL save course with title, description, and category
2. WHEN an instructor adds a lesson, THE LMS SHALL save lesson content and order within course
3. WHEN an instructor edits course content, THE LMS SHALL update and reflect changes immediately
4. WHEN an instructor deletes a lesson, THE LMS SHALL remove lesson and reorder remaining lessons
5. THE LMS SHALL allow instructor to publish or unpublish courses

### Requirement 9: Assignment and Quiz Creation

**User Story:** As an instructor, I want to create assignments and quizzes, so that I can assess students.

#### Acceptance Criteria

1. WHEN an instructor creates an assignment, THE LMS SHALL save with title, description, deadline, and max points
2. WHEN an instructor creates a quiz, THE LMS SHALL allow adding multiple choice questions with correct answers
3. WHEN an instructor sets quiz options, THE LMS SHALL save time limit and attempt settings
4. THE LMS SHALL allow instructor to edit assignments and quizzes before and after publishing

### Requirement 10: Student Progress Tracking (Instructor)

**User Story:** As an instructor, I want to view student progress, so that I can monitor learning outcomes.

#### Acceptance Criteria

1. WHEN an instructor views a course, THE LMS SHALL display list of enrolled students
2. WHEN an instructor clicks on a student, THE LMS SHALL show student's progress in that course
3. THE LMS SHALL display completion percentage, quiz scores, and assignment grades for each student
4. THE LMS SHALL allow instructor to grade assignment submissions
5. WHEN an instructor grades a submission, THE LMS SHALL notify student of the grade

### Requirement 11: Admin User Management

**User Story:** As an admin, I want to manage users, so that I can maintain system access.

#### Acceptance Criteria

1. WHEN an admin views user list, THE LMS SHALL display all users with roles
2. WHEN an admin changes user role, THE LMS SHALL update user permissions immediately
3. WHEN an admin deactivates a user, THE LMS SHALL prevent user from logging in
4. THE LMS SHALL allow admin to search and filter users by name, email, or role

### Requirement 12: Responsive Design

**User Story:** As a user, I want to access LMS from any device, so that I can learn anywhere.

#### Acceptance Criteria

1. THE LMS SHALL display correctly on desktop screens (1024px and above)
2. THE LMS SHALL display correctly on tablet screens (768px to 1023px)
3. THE LMS SHALL display correctly on mobile screens (below 768px)
4. THE LMS SHALL maintain functionality across all screen sizes

### Requirement 13: Data Persistence

**User Story:** As a user, I want my data to be saved, so that I can continue where I left off.

#### Acceptance Criteria

1. WHEN a user makes changes, THE LMS SHALL persist data to Supabase database
2. WHEN a user returns to the system, THE LMS SHALL restore previous state and progress
3. THE LMS SHALL handle database errors gracefully with user-friendly messages
4. THE LMS SHALL implement optimistic updates for better user experience
