import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../common/Button';
import { LessonItem } from './LessonItem';
import type { Lesson, ContentItem } from '../../types';
import './LessonList.css';

interface LessonListProps {
  lessons: Lesson[];
  moduleId: string;
  onAddLesson: () => void;
  onEditLesson?: (lesson: Lesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onAddContent?: (lessonId: string) => void;
  onEditContent?: (contentItem: ContentItem) => void;
  onDeleteContent?: (contentId: string) => void;
}

/**
 * LessonList Component
 * 
 * Displays lessons within a module:
 * - Renders lessons in order_index order (Requirement 8.5)
 * - Provides "Add Lesson" button (Requirement 10.2)
 * - Shows lesson items with expand/collapse functionality
 * 
 * Validates Requirements: 10.2, 8.5
 */
export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  moduleId,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddContent,
  onEditContent,
  onDeleteContent,
}) => {
  // Sort lessons by orderIndex (Requirement 8.5)
  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  // Empty state
  if (sortedLessons.length === 0) {
    return (
      <div className="lesson-list-empty">
        <p className="empty-message">No lessons in this module yet</p>
        <Button 
          variant="outline" 
          size="sm" 
          icon={<Plus size={14} />}
          onClick={onAddLesson}
        >
          Add Lesson
        </Button>
      </div>
    );
  }

  // Lessons list
  return (
    <div className="lesson-list">
      <div className="lessons-container">
        {sortedLessons.map((lesson, index) => (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            index={index}
            onEdit={onEditLesson ? () => onEditLesson(lesson) : undefined}
            onDelete={onDeleteLesson ? () => onDeleteLesson(lesson.id) : undefined}
            onAddContent={onAddContent ? () => onAddContent(lesson.id) : undefined}
            onEditContent={onEditContent}
            onDeleteContent={onDeleteContent}
          />
        ))}
      </div>

      <div className="add-lesson-container">
        <Button 
          variant="outline" 
          size="sm" 
          icon={<Plus size={14} />}
          onClick={onAddLesson}
        >
          Add Lesson
        </Button>
      </div>
    </div>
  );
};

export default LessonList;
