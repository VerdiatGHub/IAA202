import React from 'react';
import { Edit2, Trash2, Video, FileText, ClipboardList, FileCheck, Paperclip } from 'lucide-react';
import type { ContentItem } from '../../types';
import './ContentItemRow.css';

interface ContentItemRowProps {
  contentItem: ContentItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * ContentItemRow Component
 * 
 * Displays an individual content item with:
 * - Content type icon (video, text, quiz, assignment, resource)
 * - Content title and duration (if applicable)
 * - Required/optional badge
 * - Edit and delete buttons
 * 
 * Validates Requirements: 10.3, 10.5, 15.5
 */
export const ContentItemRow: React.FC<ContentItemRowProps> = ({
  contentItem,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="content-item-row">
      <div className="content-item-info">
        <span className="content-type-icon" title={contentItem.contentType}>
          {getContentTypeIcon(contentItem.contentType)}
        </span>
        <span className="content-title">{contentItem.title}</span>
        {contentItem.duration && (
          <span className="content-duration">
            {contentItem.duration} {contentItem.duration === 1 ? 'min' : 'mins'}
          </span>
        )}
        <span className={`content-badge ${contentItem.isRequired ? 'required' : 'optional'}`}>
          {contentItem.isRequired ? 'Required' : 'Optional'}
        </span>
      </div>
      <div className="content-item-actions">
        {onEdit && (
          <button
            className="icon-button"
            onClick={onEdit}
            title="Edit content"
            aria-label="Edit content"
          >
            <Edit2 size={14} />
          </button>
        )}
        {onDelete && (
          <button
            className="icon-button icon-button-danger"
            onClick={onDelete}
            title="Delete content"
            aria-label="Delete content"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Get icon component for content type
 * Validates Requirement: 10.3, 15.5
 */
function getContentTypeIcon(contentType: string): React.ReactNode {
  const iconSize = 16;
  const iconColor = 'var(--color-text-secondary, #6c757d)';
  
  switch (contentType) {
    case 'video':
      return <Video size={iconSize} color={iconColor} />;
    case 'text':
      return <FileText size={iconSize} color={iconColor} />;
    case 'quiz':
      return <ClipboardList size={iconSize} color={iconColor} />;
    case 'assignment':
      return <FileCheck size={iconSize} color={iconColor} />;
    case 'resource':
      return <Paperclip size={iconSize} color={iconColor} />;
    default:
      return <FileText size={iconSize} color={iconColor} />;
  }
}

export default ContentItemRow;
