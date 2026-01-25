import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../common/Button/Button';
import { ContentItemRow } from './ContentItemRow';
import type { ContentItem } from '../../types';
import './ContentItemList.css';

interface ContentItemListProps {
  lessonId: string;
  contentItems: ContentItem[];
  onAddContent?: () => void;
  onEditContent?: (contentItem: ContentItem) => void;
  onDeleteContent?: (contentId: string) => void;
  onReorderContent?: (contentItemIds: string[]) => void;
}

/**
 * ContentItemList Component
 * 
 * Renders content items within a lesson:
 * - Displays content items in order_index order
 * - Shows "Add Content" button with type selector
 * - Provides edit and delete actions for each content item
 * 
 * Validates Requirements: 10.2, 14.3
 */
export const ContentItemList: React.FC<ContentItemListProps> = ({
  lessonId,
  contentItems,
  onAddContent,
  onEditContent,
  onDeleteContent,
  onReorderContent,
}) => {
  // Sort content items by orderIndex (Requirement 14.3)
  const sortedContentItems = [...contentItems].sort((a, b) => a.orderIndex - b.orderIndex);

  const handleEditContent = (contentItem: ContentItem) => {
    onEditContent?.(contentItem);
  };

  const handleDeleteContent = (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content item?')) {
      onDeleteContent?.(contentId);
    }
  };

  // Empty state
  if (sortedContentItems.length === 0) {
    return (
      <div className="content-item-list">
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
      </div>
    );
  }

  // Content items exist
  return (
    <div className="content-item-list">
      <div className="content-items">
        {sortedContentItems.map((contentItem) => (
          <ContentItemRow
            key={contentItem.id}
            contentItem={contentItem}
            onEdit={() => handleEditContent(contentItem)}
            onDelete={() => handleDeleteContent(contentItem.id)}
          />
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
    </div>
  );
};

export default ContentItemList;
