import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DragEndEvent } from '@dnd-kit/core';
import { Button } from '../common/Button';
import { LessonItem } from './LessonItem';
import { DndProvider } from './DndProvider';
import { SortableItem } from './SortableItem';
import { handleDragEnd } from '../../utils/dndHelpers';
import { useCourseContent } from '../../contexts/useCourseContent';
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
  enableDragAndDrop?: boolean; // Optional: toggle drag-and-drop
}

/**
 * LessonList Component
 * 
 * Displays lessons within a module:
 * - Renders lessons in order_index order (Requirement 8.5)
 * - Provides "Add Lesson" button (Requirement 10.2)
 * - Shows lesson items with expand/collapse functionality
 * - Supports drag-and-drop reordering (Requirement 8.2, 10.6)
 * 
 * Validates Requirements: 10.2, 8.2, 8.5, 10.6
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
  enableDragAndDrop = true, // Default to enabled (Requirement 8.2, 10.6)
}) => {
  const { reorderLessons, loading } = useCourseContent();
  const [isDragging, setIsDragging] = useState(false);

  // Sort lessons by orderIndex (Requirement 8.5)
  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  // Handle drag end event (Requirement 8.2)
  const handleLessonDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    
    const newOrder = handleDragEnd(event, sortedLessons);
    if (newOrder) {
      try {
        // Optimistic update with automatic rollback on error (Requirement 8.4)
        await reorderLessons(moduleId, newOrder);
      } catch (error) {
        console.error('Failed to reorder lessons:', error);
        // Error is handled by context (rollback + error message)
      }
    }
  };

  const handleLessonDragStart = () => {
    setIsDragging(true);
  };

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

  // Get lesson IDs for DndProvider
  const lessonIds = sortedLessons.map(l => l.id);

  // Lessons list with drag-and-drop (Requirement 10.6)
  const lessonsList = (
    <div className="lessons-container" data-dragging={isDragging}>
      {sortedLessons.map((lesson, index) => {
        const lessonItem = (
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
        );

        // Wrap with SortableItem if drag-and-drop is enabled
        return enableDragAndDrop ? (
          <SortableItem key={lesson.id} id={lesson.id} disabled={loading}>
            {lessonItem}
          </SortableItem>
        ) : (
          lessonItem
        );
      })}
    </div>
  );

  // Lessons list
  return (
    <div className="lesson-list">
      {enableDragAndDrop ? (
        <DndProvider 
          items={lessonIds} 
          onDragEnd={handleLessonDragEnd}
          onDragStart={handleLessonDragStart}
        >
          {lessonsList}
        </DndProvider>
      ) : (
        lessonsList
      )}

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
