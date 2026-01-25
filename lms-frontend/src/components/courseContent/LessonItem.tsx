import React, { useState } from 'react';
import { Edit2, Trash2, ChevronDown } from 'lucide-react';
import { ContentItemList } from './ContentItemList';
import type { Lesson, ContentItem } from '../../types';
import './LessonItem.css';

interface LessonItemProps {
  lesson: Lesson;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddContent?: () => void;
  onEditContent?: (contentItem: ContentItem) => void;
  onDeleteContent?: (contentId: string) => void;
  isPreviewMode?: boolean; // Hide editing controls in preview mode
}

/**
 * LessonItem Component
 * 
 * Displays an individual lesson with:
 * - Lesson header with title
 * - Content item count
 * - Edit and delete buttons (hidden in preview mode)
 * - Expand/collapse functionality for content items
 * - Required/optional badge
 * 
 * Validates Requirements: 10.2, 10.5, 9.1, 9.2, 11.2
 */
export const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  index,
  onEdit,
  onDelete,
  onAddContent,
  onEditContent,
  onDeleteContent,
  isPreviewMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this lesson? All content items within it will also be deleted.')) {
      onDelete?.();
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate content item count
  const contentCount = lesson.contentItems?.length || 0;

  // Sort content items by orderIndex (Requirement 14.3)
  const sortedContentItems = lesson.contentItems
    ? [...lesson.contentItems].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  return (
    <div className="lesson-item">
      <div className="lesson-header" onClick={handleToggleExpand}>
        <div className="lesson-info">
          <span className="lesson-number">Lesson {index + 1}</span>
          <h4 className="lesson-title">{lesson.title}</h4>
          <div className="lesson-meta">
            <span className="content-count">
              {contentCount} {contentCount === 1 ? 'item' : 'items'}
            </span>
            {lesson.duration && (
              <>
                <span className="meta-separator">•</span>
                <span className="lesson-duration">
                  {lesson.duration} {lesson.duration === 1 ? 'min' : 'mins'}
                </span>
              </>
            )}
            {lesson.isRequired !== undefined && (
              <span className={`lesson-badge ${lesson.isRequired ? 'required' : 'optional'}`}>
                {lesson.isRequired ? 'Required' : 'Optional'}
              </span>
            )}
          </div>
        </div>
        <div className="lesson-actions">
          {/* Hide edit/delete buttons in preview mode (Requirement 11.2) */}
          {!isPreviewMode && onEdit && (
            <button
              className="icon-button"
              onClick={handleEdit}
              title="Edit lesson"
              aria-label="Edit lesson"
            >
              <Edit2 size={14} />
            </button>
          )}
          {!isPreviewMode && onDelete && (
            <button
              className="icon-button icon-button-danger"
              onClick={handleDelete}
              title="Delete lesson"
              aria-label="Delete lesson"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            className={`expand-button ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
            aria-label={isExpanded ? 'Collapse lesson' : 'Expand lesson'}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="lesson-content">
          <ContentItemList
            lessonId={lesson.id}
            contentItems={sortedContentItems}
            onAddContent={onAddContent}
            onEditContent={onEditContent}
            onDeleteContent={onDeleteContent}
            isPreviewMode={isPreviewMode}
          />
        </div>
      )}
    </div>
  );
};

export default LessonItem;
