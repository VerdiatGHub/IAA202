# Task 20.2: Manual Testing Checklist

## Overview

This document provides a comprehensive manual testing checklist for the Course Content Management System. The testing covers different screen sizes, large datasets, concurrent editing scenarios, and browser compatibility.

**Task Requirements:**
- Test on different screen sizes
- Test with large datasets (100+ modules)
- Test concurrent editing scenarios
- Test browser compatibility
- Requirements: All requirements

**Status:** 🔄 IN PROGRESS

---

## 1. Screen Size Testing (Responsive Design)

### 1.1 Desktop Testing (1920x1080)

#### Course Content Editor
- [ ] Navigate to course Lessons tab
- [ ] Verify all modules display correctly
- [ ] Verify expand/collapse animations work smoothly
- [ ] Verify drag-and-drop reordering works
- [ ] Verify modals are centered and properly sized
- [ ] Verify all buttons and icons are visible
- [ ] Verify no horizontal scrolling on main content area

#### Student Content View
- [ ] Navigate to student course view
- [ ] Verify curriculum tab displays correctly
- [ ] Verify all content is readable
- [ ] Verify icons and badges are properly sized
- [ ] Verify expand/collapse works smoothly

### 1.2 Laptop Testing (1366x768)

#### Course Content Editor
- [ ] Verify layout adapts to smaller width
- [ ] Verify modals fit within viewport
- [ ] Verify no content is cut off
- [ ] Verify drag-and-drop still works
- [ ] Verify sidebar navigation is accessible

#### Student Content View
- [ ] Verify content remains readable
- [ ] Verify no horizontal scrolling
- [ ] Verify all interactive elements are clickable

### 1.3 Tablet Testing (768x1024 - iPad)

#### Portrait Mode
- [ ] Verify course editor is usable
- [ ] Verify modals are responsive
- [ ] Verify touch interactions work (tap, swipe)
- [ ] Verify drag-and-drop works with touch
- [ ] Verify forms are easy to fill out
- [ ] Verify buttons are large enough for touch

#### Landscape Mode
- [ ] Verify layout adjusts appropriately
- [ ] Verify all content is accessible
- [ ] Verify no overlapping elements

#### Student Content View
- [ ] Verify content is readable in both orientations
- [ ] Verify touch interactions work smoothly
- [ ] Verify expand/collapse works with touch

### 1.4 Mobile Testing (375x667 - iPhone SE)

#### Course Content Editor
- [ ] Verify editor is usable on small screen
- [ ] Verify modals are responsive and scrollable
- [ ] Verify forms are mobile-friendly
- [ ] Verify buttons are appropriately sized
- [ ] Verify drag-and-drop works or has alternative
- [ ] Verify navigation menu is accessible

#### Student Content View
- [ ] Verify content is readable
- [ ] Verify no horizontal scrolling
- [ ] Verify touch targets are large enough
- [ ] Verify expand/collapse works smoothly
- [ ] Verify icons and badges are visible

### 1.5 Large Desktop Testing (2560x1440)

#### Course Content Editor
- [ ] Verify layout scales appropriately
- [ ] Verify no excessive whitespace
- [ ] Verify text remains readable
- [ ] Verify modals are appropriately sized

#### Student Content View
- [ ] Verify content layout is balanced
- [ ] Verify text size is appropriate
- [ ] Verify no layout issues

---

## 2. Large Dataset Testing (100+ Modules)

### 2.1 Data Preparation

**Prerequisites:**
- [ ] Create test course with 100+ modules
- [ ] Each module should have 5-10 lessons
- [ ] Each lesson should have 3-5 content items
- [ ] Mix of content types (video, text, quiz, assignment, resource)
- [ ] Mix of required and optional content

**Test Data Script Location:** `lms-backend/scripts/generate-large-dataset.js` (to be created)

### 2.2 Performance Testing

#### Initial Load
- [ ] Navigate to course Lessons tab
- [ ] Measure time to load all modules (should be < 3 seconds)
- [ ] Verify loading indicator displays
- [ ] Verify no browser freezing or lag
- [ ] Check browser console for errors
- [ ] Check network tab for API response times

#### Scrolling Performance
- [ ] Scroll through all 100+ modules
- [ ] Verify smooth scrolling (no jank)
- [ ] Verify no memory leaks (check DevTools memory)
- [ ] Verify expand/collapse remains responsive

#### Expand/Collapse Performance
- [ ] Expand all modules (if possible)
- [ ] Verify browser remains responsive
- [ ] Collapse all modules
- [ ] Verify no performance degradation

### 2.3 Reordering with Large Datasets

#### Module Reordering
- [ ] Drag module from position 1 to position 50
- [ ] Verify reorder completes successfully
- [ ] Verify API call completes (check network tab)
- [ ] Verify success toast appears
- [ ] Verify order persists after page refresh
- [ ] Measure time to complete reorder (should be < 2 seconds)

#### Lesson Reordering
- [ ] Expand module with 10+ lessons
- [ ] Drag lesson from top to bottom
- [ ] Verify reorder completes successfully
- [ ] Verify no lag during drag operation

#### Content Item Reordering
- [ ] Expand lesson with 10+ content items
- [ ] Drag content item from top to bottom
- [ ] Verify reorder completes successfully
- [ ] Verify no lag during drag operation

### 2.4 CRUD Operations with Large Datasets

#### Create Operations
- [ ] Add new module to course with 100+ modules
- [ ] Verify module appears at correct position
- [ ] Verify order_index is calculated correctly
- [ ] Add new lesson to module with 10+ lessons
- [ ] Add new content item to lesson with 10+ items

#### Update Operations
- [ ] Edit module in middle of large list
- [ ] Verify update completes successfully
- [ ] Edit lesson in middle of large list
- [ ] Edit content item in middle of large list

#### Delete Operations
- [ ] Delete module from middle of large list
- [ ] Verify cascading deletion works
- [ ] Verify remaining modules maintain correct order
- [ ] Delete lesson from middle of large list
- [ ] Delete content item from middle of large list

### 2.5 Search and Navigation

#### Finding Content
- [ ] Use browser search (Ctrl+F) to find specific module
- [ ] Verify search works across collapsed modules
- [ ] Navigate to specific module by scrolling
- [ ] Verify no performance issues during navigation

### 2.6 Student View with Large Datasets

#### Initial Load
- [ ] Navigate to student course view with 100+ modules
- [ ] Measure load time (should be < 3 seconds)
- [ ] Verify loading indicator displays
- [ ] Verify no browser freezing

#### Navigation
- [ ] Scroll through all modules
- [ ] Expand/collapse modules
- [ ] Verify smooth performance
- [ ] Verify no memory leaks

---

## 3. Concurrent Editing Testing

### 3.1 Setup

**Prerequisites:**
- [ ] Two different browsers (e.g., Chrome and Firefox)
- [ ] Two different user accounts (both instructors or admins)
- [ ] Same course open in both browsers
- [ ] Both users on Lessons tab

### 3.2 Concurrent Module Operations

#### Scenario 1: Simultaneous Module Creation
- [ ] User A creates module "Module A"
- [ ] User B creates module "Module B" at same time
- [ ] Verify both modules are created
- [ ] Verify no duplicate order_index values
- [ ] Refresh both browsers
- [ ] Verify both modules persist correctly

#### Scenario 2: Simultaneous Module Updates
- [ ] Both users edit same module simultaneously
- [ ] User A updates title to "Version A"
- [ ] User B updates title to "Version B"
- [ ] Verify last write wins (or conflict resolution)
- [ ] Refresh both browsers
- [ ] Verify data consistency

#### Scenario 3: Simultaneous Module Deletion
- [ ] User A deletes module
- [ ] User B tries to edit same module
- [ ] Verify appropriate error handling
- [ ] Verify no orphaned lessons

#### Scenario 4: Concurrent Module Reordering
- [ ] User A reorders modules
- [ ] User B reorders modules at same time
- [ ] Verify final order is consistent
- [ ] Refresh both browsers
- [ ] Verify order persists correctly

### 3.3 Concurrent Lesson Operations

#### Scenario 1: Simultaneous Lesson Creation
- [ ] Both users add lesson to same module
- [ ] Verify both lessons are created
- [ ] Verify correct order_index assignment
- [ ] Refresh both browsers
- [ ] Verify data consistency

#### Scenario 2: Simultaneous Lesson Updates
- [ ] Both users edit same lesson
- [ ] Verify last write wins
- [ ] Verify no data corruption

#### Scenario 3: Simultaneous Lesson Deletion
- [ ] User A deletes lesson
- [ ] User B tries to edit same lesson
- [ ] Verify appropriate error handling

### 3.4 Concurrent Content Item Operations

#### Scenario 1: Simultaneous Content Creation
- [ ] Both users add content to same lesson
- [ ] Verify both items are created
- [ ] Verify correct order_index assignment

#### Scenario 2: Simultaneous Content Updates
- [ ] Both users edit same content item
- [ ] Verify last write wins
- [ ] Verify no data corruption

#### Scenario 3: Simultaneous Content Deletion
- [ ] User A deletes content item
- [ ] User B tries to edit same item
- [ ] Verify appropriate error handling

### 3.5 Real-time Updates (if implemented)

- [ ] User A creates module
- [ ] Verify User B sees update without refresh
- [ ] User A reorders modules
- [ ] Verify User B sees new order
- [ ] Test with all CRUD operations

### 3.6 Conflict Resolution

#### Expected Behaviors:
- [ ] Last write wins for updates
- [ ] Appropriate error messages for editing deleted items
- [ ] No data corruption or orphaned records
- [ ] Consistent order_index values
- [ ] No duplicate primary keys

---

## 4. Browser Compatibility Testing

### 4.1 Chrome (Latest Version)

#### Course Content Editor
- [ ] All features work correctly
- [ ] Drag-and-drop works smoothly
- [ ] Modals display correctly
- [ ] Forms submit successfully
- [ ] Toast notifications appear
- [ ] Loading spinners display
- [ ] No console errors

#### Student Content View
- [ ] Content displays correctly
- [ ] Expand/collapse works
- [ ] Icons and badges render
- [ ] No console errors

### 4.2 Firefox (Latest Version)

#### Course Content Editor
- [ ] All features work correctly
- [ ] Drag-and-drop works smoothly
- [ ] Modals display correctly
- [ ] Forms submit successfully
- [ ] Toast notifications appear
- [ ] Loading spinners display
- [ ] No console errors
- [ ] CSS rendering matches Chrome

#### Student Content View
- [ ] Content displays correctly
- [ ] Expand/collapse works
- [ ] Icons and badges render
- [ ] No console errors

### 4.3 Safari (Latest Version - macOS/iOS)

#### Course Content Editor
- [ ] All features work correctly
- [ ] Drag-and-drop works (Safari-specific testing)
- [ ] Modals display correctly
- [ ] Forms submit successfully
- [ ] Toast notifications appear
- [ ] Loading spinners display
- [ ] No console errors
- [ ] CSS rendering is correct

#### Student Content View
- [ ] Content displays correctly
- [ ] Expand/collapse works
- [ ] Icons and badges render
- [ ] No console errors

### 4.4 Edge (Latest Version)

#### Course Content Editor
- [ ] All features work correctly
- [ ] Drag-and-drop works smoothly
- [ ] Modals display correctly
- [ ] Forms submit successfully
- [ ] Toast notifications appear
- [ ] Loading spinners display
- [ ] No console errors

#### Student Content View
- [ ] Content displays correctly
- [ ] Expand/collapse works
- [ ] Icons and badges render
- [ ] No console errors

### 4.5 Mobile Browsers

#### Safari iOS (iPhone)
- [ ] Touch interactions work
- [ ] Modals are responsive
- [ ] Forms are usable
- [ ] Drag-and-drop works or has alternative
- [ ] No layout issues

#### Chrome Android
- [ ] Touch interactions work
- [ ] Modals are responsive
- [ ] Forms are usable
- [ ] Drag-and-drop works or has alternative
- [ ] No layout issues

### 4.6 Cross-Browser Issues to Check

- [ ] CSS Grid/Flexbox compatibility
- [ ] SVG icon rendering
- [ ] Modal backdrop behavior
- [ ] Form input styling
- [ ] Button hover states
- [ ] Transition animations
- [ ] Font rendering
- [ ] Color consistency
- [ ] Z-index stacking
- [ ] Scrollbar styling

---

## 5. Functional Testing (All Requirements)

### 5.1 Module Management (Requirement 1)

- [ ] Create module with title and description
- [ ] Edit module title and description
- [ ] Delete module (verify cascading deletion)
- [ ] Verify order_index assignment
- [ ] Verify persistence to database

### 5.2 Lesson Management (Requirement 2)

- [ ] Create lesson within module
- [ ] Edit lesson title and description
- [ ] Delete lesson (verify cascading deletion)
- [ ] Verify order_index assignment
- [ ] Verify persistence to database

### 5.3 Video Content (Requirement 3)

- [ ] Add video content with URL and duration
- [ ] Edit video content
- [ ] Delete video content
- [ ] Verify URL validation

### 5.4 Text Content (Requirement 4)

- [ ] Add text content with rich text
- [ ] Edit text content
- [ ] Delete text content
- [ ] Verify rich text formatting preserved

### 5.5 Quiz Content (Requirement 5)

- [ ] Add quiz content
- [ ] Link to existing quiz
- [ ] Edit quiz content
- [ ] Delete quiz content

### 5.6 Assignment Content (Requirement 6)

- [ ] Add assignment content
- [ ] Link to existing assignment
- [ ] Edit assignment content
- [ ] Delete assignment content

### 5.7 Resource Content (Requirement 7)

- [ ] Add resource content (file)
- [ ] Add resource content (link)
- [ ] Edit resource content
- [ ] Delete resource content
- [ ] Verify URL validation

### 5.8 Content Ordering (Requirement 8)

- [ ] Reorder modules
- [ ] Reorder lessons within module
- [ ] Verify order persists after refresh
- [ ] Verify relationships preserved

### 5.9 Content Properties (Requirement 9)

- [ ] Mark lesson as required
- [ ] Mark lesson as optional
- [ ] Verify default is required
- [ ] Verify status persists

### 5.10 Course Editor Interface (Requirement 10)

- [ ] Verify Lessons tab exists
- [ ] Verify hierarchical tree view
- [ ] Verify content type icons
- [ ] Verify visual distinction between modules and lessons
- [ ] Verify inline editing controls
- [ ] Verify reordering controls

### 5.11 Content Preview (Requirement 11)

- [ ] Activate preview mode
- [ ] Verify editing controls hidden
- [ ] Verify content displayed in order
- [ ] Verify required/optional indicators
- [ ] Exit preview mode

### 5.12 Access Control (Requirement 12)

- [ ] Admin can access all courses
- [ ] Instructor can access assigned courses
- [ ] Instructor cannot access other courses
- [ ] Student sees read-only view
- [ ] Unauthorized users denied access

### 5.13 Data Persistence (Requirement 13)

- [ ] All changes persist to database
- [ ] Failed operations show error
- [ ] Previous state maintained on error
- [ ] Validation prevents invalid states
- [ ] Success messages displayed

### 5.14 Content Item Ordering (Requirement 14)

- [ ] Content items assigned correct order_index
- [ ] Reordering updates all affected items
- [ ] Display sorted by order_index
- [ ] Changes persist immediately

### 5.15 Student Content Display (Requirement 15)

- [ ] Modules displayed in order
- [ ] Lessons displayed in order within modules
- [ ] Content items displayed in order within lessons
- [ ] Required content indicated
- [ ] Content type icons displayed

---

## 6. Error Handling and Edge Cases

### 6.1 Network Errors

- [ ] Disconnect network during create operation
- [ ] Verify error toast appears
- [ ] Verify optimistic update rolls back
- [ ] Reconnect and retry operation

### 6.2 Validation Errors

- [ ] Submit form with empty required fields
- [ ] Submit invalid URL
- [ ] Submit negative duration
- [ ] Verify error messages display

### 6.3 Authorization Errors

- [ ] Instructor tries to edit another's course
- [ ] Student tries to access editor
- [ ] Verify 403 error handling

### 6.4 Not Found Errors

- [ ] Try to edit deleted module
- [ ] Try to edit deleted lesson
- [ ] Verify 404 error handling

### 6.5 Edge Cases

- [ ] Course with no modules
- [ ] Module with no lessons
- [ ] Lesson with no content items
- [ ] Very long titles (200+ characters)
- [ ] Very long descriptions (1000+ characters)
- [ ] Special characters in titles
- [ ] Unicode characters in content

---

## 7. Accessibility Testing

### 7.1 Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Use Enter to activate buttons
- [ ] Use Escape to close modals
- [ ] Use arrow keys for navigation (if applicable)
- [ ] Verify focus indicators visible

### 7.2 Screen Reader Testing

- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] Verify all buttons have labels
- [ ] Verify form fields have labels
- [ ] Verify error messages are announced
- [ ] Verify success messages are announced

### 7.3 Color Contrast

- [ ] Verify text meets WCAG AA standards
- [ ] Verify buttons have sufficient contrast
- [ ] Verify icons are distinguishable
- [ ] Test with color blindness simulator

### 7.4 Focus Management

- [ ] Focus moves to modal when opened
- [ ] Focus returns to trigger when modal closes
- [ ] Focus trapped within modal
- [ ] Focus visible on all interactive elements

---

## 8. Performance Metrics

### 8.1 Load Times

- [ ] Initial page load < 2 seconds
- [ ] Module list load < 1 second
- [ ] Modal open < 200ms
- [ ] Form submission < 1 second
- [ ] Reorder operation < 2 seconds

### 8.2 Memory Usage

- [ ] Check memory usage with DevTools
- [ ] Verify no memory leaks after operations
- [ ] Monitor memory with large datasets
- [ ] Verify garbage collection works

### 8.3 Network Usage

- [ ] Check API payload sizes
- [ ] Verify no unnecessary requests
- [ ] Verify proper caching
- [ ] Check for N+1 query issues

---

## 9. Security Testing

### 9.1 Authentication

- [ ] Verify token required for all operations
- [ ] Verify expired token handled
- [ ] Verify invalid token rejected

### 9.2 Authorization

- [ ] Verify role-based access control
- [ ] Verify course ownership checks
- [ ] Verify no privilege escalation

### 9.3 Input Validation

- [ ] Verify XSS prevention in text fields
- [ ] Verify SQL injection prevention
- [ ] Verify file upload restrictions
- [ ] Verify URL validation

---

## 10. Testing Tools and Setup

### 10.1 Required Tools

- [ ] Chrome DevTools
- [ ] Firefox Developer Tools
- [ ] Safari Web Inspector
- [ ] Responsive design mode
- [ ] Network throttling
- [ ] Browser extensions (React DevTools, etc.)

### 10.2 Test Environment

- [ ] Development server running
- [ ] Database populated with test data
- [ ] Multiple user accounts created
- [ ] Test course with various content types
- [ ] Large dataset course (100+ modules)

### 10.3 Documentation

- [ ] Screenshot any bugs found
- [ ] Record console errors
- [ ] Note browser versions tested
- [ ] Document any workarounds needed

---

## 11. Sign-off Checklist

### 11.1 Screen Size Testing
- [ ] All screen sizes tested and working
- [ ] No critical layout issues
- [ ] Responsive design verified

### 11.2 Large Dataset Testing
- [ ] Performance acceptable with 100+ modules
- [ ] No browser freezing or crashes
- [ ] All operations work correctly

### 11.3 Concurrent Editing Testing
- [ ] Concurrent operations handled correctly
- [ ] No data corruption
- [ ] Appropriate error handling

### 11.4 Browser Compatibility Testing
- [ ] All major browsers tested
- [ ] No critical browser-specific issues
- [ ] Mobile browsers tested

### 11.5 Functional Testing
- [ ] All requirements validated
- [ ] All features working correctly
- [ ] No critical bugs

### 11.6 Final Approval
- [ ] All critical issues resolved
- [ ] All tests passed
- [ ] Ready for production deployment

---

## 12. Known Issues and Limitations

### Issues Found During Testing:
1. _To be documented during testing_

### Limitations:
1. _To be documented during testing_

### Future Improvements:
1. _To be documented during testing_

---

## 13. Test Results Summary

**Testing Date:** _To be filled_

**Tester:** _To be filled_

**Environment:**
- Frontend URL: _To be filled_
- Backend URL: _To be filled_
- Database: _To be filled_

**Overall Status:** 🔄 IN PROGRESS

**Critical Issues:** _To be documented_

**Non-Critical Issues:** _To be documented_

**Recommendations:** _To be documented_

---

## Appendix A: Test Data Generation Script

Location: `lms-backend/scripts/generate-large-dataset.js`

This script should be created to generate test data for large dataset testing:
- 100+ modules
- 5-10 lessons per module
- 3-5 content items per lesson
- Mix of content types
- Mix of required/optional content

---

## Appendix B: Browser Version Matrix

| Browser | Version | OS | Status |
|---------|---------|----|----|
| Chrome | ___ | Windows | ⏳ |
| Chrome | ___ | macOS | ⏳ |
| Chrome | ___ | Linux | ⏳ |
| Firefox | ___ | Windows | ⏳ |
| Firefox | ___ | macOS | ⏳ |
| Safari | ___ | macOS | ⏳ |
| Safari | ___ | iOS | ⏳ |
| Edge | ___ | Windows | ⏳ |
| Chrome | ___ | Android | ⏳ |

---

## Appendix C: Performance Benchmarks

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Initial page load | < 2s | ___ | ⏳ |
| Module list load | < 1s | ___ | ⏳ |
| Create module | < 1s | ___ | ⏳ |
| Reorder modules | < 2s | ___ | ⏳ |
| Delete module | < 1s | ___ | ⏳ |
| Load 100+ modules | < 3s | ___ | ⏳ |

---

**Document Version:** 1.0  
**Last Updated:** _To be filled_  
**Next Review:** _To be filled_
