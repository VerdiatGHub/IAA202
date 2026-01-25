import React, { useState } from 'react';
import { Edit2, Trash2, Plus, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
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
}

/**
 * LessonItem Component
 * 
 * Displays an individual lesson with:
 * - Lesson header with title
 * - Content item count
 * - Edit and delete buttons
 * - Expand/collapse functionality for content items
 * - Required/optional badge
 * 
 * Validates Requirements: 10.2, 10.5, 9.1, 9.2
 */
export const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  index,
  onEdit,
  onDelete,
  onAddContent,
  onEditContent,
  onDeleteContent,
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

  const handleEditContent = (contentItem: ContentItem) => {
    onEditContent?.(contentItem);
  };

  const handleDeleteContent = (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content item?')) {
      onDeleteContent?.(contentId);
    }
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
          {onEdit && (
            <button
              className="icon-button"
              onClick={handleEdit}
              title="Edit lesson"
              aria-label="Edit lesson"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
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
          {sortedContentItems.length === 0 ? (
            <div className="content-empty">
              <p className="empty-message">No content items in this lesson yet</p>
              {onAddContent && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<Plus size={14} />}
                  onClick={onAddContent}
                >
                  Add Content
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="content-items-list">
                {sortedContentItems.map((contentItem) => (
                  <div key={contentItem.id} className="content-item-row">
                    <div className="content-item-info">
                      <span className="content-type-icon">
                        {getContentTypeIcon(contentItem.contentType)}
                      </span>
                      <span className="content-title">{contentItem.title}</span>
                      {contentItem.duration && (
                        <span className="content-duration">{contentItem.duration} min</span>
                      )}
                      <span className={`content-badge ${contentItem.isRequired ? 'required' : 'optional'}`}>
                        {contentItem.isRequired ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <div className="content-item-actions">
                      {onEditContent && (
                        <button
                          className="icon-button"
                          onClick={() => handleEditContent(contentItem)}
                          title="Edit content"
                          aria-label="Edit content"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDeleteContent && (
                        <button
                          className="icon-button icon-button-danger"
                          onClick={() => handleDeleteContent(contentItem.id)}
                          title="Delete content"
                          aria-label="Delete content"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {onAddContent && (
                <div className="add-content-container">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={<Plus size={14} />}
                    onClick={onAddContent}
                  >
                    Add Content
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Get icon for content type
 * Validates Requirement: 10.3, 15.5
 */
function getContentTypeIcon(contentType: string): string {
  switch (contentType) {
    case 'video':
      return '🎥';
    case 'text':
      return '📄';
    case 'quiz':
      return '📝';
    case 'assignment':
      return '📋';
    case 'resource':
      return '📎';
    default:
      return '📄';
  }
}

export default LessonItem;
