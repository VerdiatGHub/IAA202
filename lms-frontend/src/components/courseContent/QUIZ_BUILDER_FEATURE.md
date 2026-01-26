# Inline Quiz Builder Feature

## Overview
Admins can now create quizzes directly within the content editor instead of linking to existing quiz IDs. The quiz builder supports multiple-choice questions with customizable options.

## Features Implemented

### Frontend Components

#### QuizBuilder Component (`QuizBuilder.tsx`)
- Add/remove questions dynamically
- Each question supports:
  - Question text (required)
  - Multiple answer options (minimum 2, can add more)
  - Select correct answer via radio button
  - Points per question (default: 1)
- Visual feedback for correct answer selection
- Validation for empty questions/options

#### Updated ContentEditorModal
- Replaced "Quiz ID" input field with inline quiz builder
- Added optional time limit field for quizzes
- Validates that at least one question is added
- Validates all questions have text and filled options

### Backend Updates

#### Content Item Service (`contentItemService.js`)
- Enhanced `create()` function to handle quiz creation
- Uses database transactions for atomic quiz + questions creation
- When `quizData` is provided:
  1. Creates quiz in `quizzes` table
  2. Creates all questions in `questions` table
  3. Links quiz to content item
  4. Commits transaction or rolls back on error

### Database Schema (Existing)
Uses existing tables:
- `quizzes` - stores quiz metadata (title, time_limit, course_id)
- `questions` - stores questions (question_text, options as JSONB, correct_answer, points)
- `content_items` - links quiz via quiz_id foreign key

## User Experience

### Creating a Quiz
1. Click "Add Content" in a lesson
2. Select "Quiz" content type
3. Enter quiz title and description
4. Optionally set time limit
5. Click "Add Question" to add questions
6. For each question:
   - Enter question text
   - Fill in at least 2 answer options
   - Click "Add Option" to add more options
   - Select the correct answer via radio button
   - Set points (default: 1)
7. Click "Add Content" to save

### Validation
- At least one question required
- All questions must have text
- All options must be filled
- One correct answer must be selected per question

## Technical Details

### Data Flow
```
Frontend (QuizBuilder) 
  → ContentEditorModal 
  → API POST /api/lessons/:id/content-items
  → contentItemService.create()
  → Transaction: Create quiz + questions
  → Return content item with quiz_id
```

### Quiz Data Structure
```typescript
{
  quizData: {
    title: string,
    timeLimit: number | null,
    questions: [
      {
        questionText: string,
        options: string[],
        correctAnswer: number, // index of correct option
        points: number
      }
    ]
  }
}
```

### Database Storage
- Quiz options stored as JSONB array: `["Option 1", "Option 2", "Option 3"]`
- Correct answer stored as the actual text value
- Questions linked to quiz via `quiz_id` foreign key

## Benefits
1. **Streamlined workflow** - No need to create quizzes separately
2. **Better UX** - Visual quiz builder with immediate feedback
3. **Data integrity** - Transaction ensures quiz and questions are created together
4. **Flexibility** - Support for 2+ answer options per question
5. **Validation** - Prevents incomplete quizzes from being saved

## Future Enhancements (Optional)
- Edit existing quizzes
- Question reordering (drag-and-drop)
- Question types: true/false, short answer
- Question bank/templates
- Duplicate questions
- Import questions from file
