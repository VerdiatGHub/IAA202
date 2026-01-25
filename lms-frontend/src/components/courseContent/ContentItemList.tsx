import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DragEndEvent } from '@dnd-kit/core';
import { Button } from '../common/Button/Button';
import { ContentItemRow } from './ContentItemRow';
import { ContentEditorModal } from './ContentEditorModal';
import { DndProvider } from './DndProvider';
import { SortableItem } from './SortableItem';
import { handleDragEnd } from '../../utils/dndHelpers';
import { useCourseContent } from '../../contexts/useCourseContent';
import type { ContentItem } from '../../types';
import './ContentItemList.css';

interface ContentItemListProps {
  lessonId: string;
  contentItems: ContentItem[];
  onAddContent?: () => void;
  onEditContent?: (contentItem: ContentItem) => void;
  onDeleteContent?: (contentId: string) => void;
  onReorderContent?: (contentItemIds: string[]) => void;
  enableDragAndDrop?: boolean; // Optional: toggle drag-and-drop
  isPreviewMode?: boolean; // Hide editing controls in preview mode
}

/**
 * ContentItemList Component
 * 
 * Renders content items within a lesson:
 * - Displays content items in order_index order (Requirement 14.3)
 * - Shows "Add Content" button with type selector (hidden in preview mode) (Requirement 10.2, 11.2)
 * - Provides edit and delete actions for each content item
 * - Supports drag-and-drop reordering (Requirement 14.2, 10.6)
 * 
 * Validates Requirements: 10.2, 14.2, 14.3, 10.6, 11.2
 */
export const ContentItemList: React.FC<ContentItemListProps> = ({
  lessonId,
  contentItems,
  onAddContent,
  onEditContent,
  onDeleteContent,
  onReorderContent,
  enableDragAndDrop = true, // Default to enabled (Requirement 14.2, 10.6)
  isPreviewMode = false,
}) => {
  const { reorderContentItems, loading } = useCourseContent();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  // Sort content items by orderIndex (Requirement 14.3)
  const sortedContentItems = [...contentItems].sort((a, b) => a.orderIndex - b.orderIndex);

  // Handle drag end event (Requirement 14.2)
  const handleContentDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    
    const newOrder = handleDragEnd(event, sortedContentItems);
    if (newOrder) {
      try {
        // Optimistic update with automatic rollback on error (Requirement 14.4)
        await reorderContentItems(lessonId, newOrder);
      } catch (error) {
        console.error('Failed to reorder content items:', error);
        // Error is handled by context (rollback + error message)
      }
    }
  };

  const handleContentDragStart = () => {
    setIsDragging(true);
  };

  const handleAddContent = () => {
    setEditingContent(undefined);
    setIsEditorOpen(true);
  };

  const handleEditContent = (contentItem: ContentItem) => {
    setEditingContent(contentItem);
    setIsEditorOpen(true);
  };

  const handleDeleteContent = (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content item?')) {
      onDeleteContent?.(contentId);
    }
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingContent(undefined);
  };

  const handleEditorSuccess = () => {
    // Modal will close itself, parent component will refresh data
  };

  // Empty state
  if (sortedContentItems.length === 0) {
    return (
      <div className="content-item-list">
        <div className="content-empty">
          <p className="empty-message">No content items in this lesson yet</p>
          {/* Hide Add Content button in preview mode (Requirement 11.2) */}
          {!isPreviewMode && (
            <Button 
              variant="outline" 
              size="sm" 
              icon={<Plus size={14} />}
              onClick={handleAddContent}
            >
              Add Content
            </Button>
          )}
        </div>
        
        {!isPreviewMode && (
          <ContentEditorModal
            isOpen={isEditorOpen}
            onClose={handleEditorClose}
            lessonId={lessonId}
            contentItem={editingContent}
            onSuccess={handleEditorSuccess}
          />
        )}
      </div>
    );
  }

  // Get content item IDs for DndProvider
  const contentItemIds = sortedContentItems.map(c => c.id);

  // Content items list with drag-and-drop (Requirement 10.6)
  const contentItemsList = (
    <div className="content-items" data-dragging={isDragging}>
      {sortedContentItems.map((contentItem) => {
        const contentItemRow = (
          <ContentItemRow
            key={contentItem.id}
            contentItem={contentItem}
            onEdit={() => handleEditContent(contentItem)}
            onDelete={() => handleDeleteContent(contentItem.id)}
            isPreviewMode={isPreviewMode}
          />
        );

        // Wrap with SortableItem if drag-and-drop is enabled
        return enableDragAndDrop ? (
          <SortableItem key={contentItem.id} id={contentItem.id} disabled={loading}>
            {contentItemRow}
          </SortableItem>
        ) : (
          contentItemRow
        );
      })}
    </div>
  );

  // Content items exist
  return (
    <div className="content-item-list">
      {enableDragAndDrop ? (
        <DndProvider 
          items={contentItemIds} 
          onDragEnd={handleContentDragEnd}
          onDragStart={handleContentDragStart}
        >
          {contentItemsList}
        </DndProvider>
      ) : (
        contentItemsList
      )}
      
      {/* Hide Add Content button in preview mode (Requirement 11.2) */}
      {!isPreviewMode && (
        <div className="add-content-container">
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Plus size={14} />}
            onClick={handleAddContent}
          >
            Add Content
          </Button>
        </div>
      )}

      {!isPreviewMode && (
        <ContentEditorModal
          isOpen={isEditorOpen}
          onClose={handleEditorClose}
          lessonId={lessonId}
          contentItem={editingContent}
          onSuccess={handleEditorSuccess}
        />
      )}
    </div>
  );
};

export default ContentItemList;
